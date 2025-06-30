/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import { v4 } from 'uuid';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { EmailSignInDto } from './dto/email-signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { AppleUserPayload, GoogleUserPayload } from './dto/oauth.dto';
import { User, userRepository } from '@/entities/user/user.entity';
import { hashPassword, verifyHash } from '@/utils/hash';
import { UnprocessableException } from '@/common/exceptions/unprocessable';
import { authenticator } from 'otplib';
import { UserSecurityAction } from '@/entities/user/user-security-action.entity';
import {
  SecurityActionsStatus,
  SecurityActionType,
} from '@/common/enums/security-action.enum';
import { getAheadDateByMin } from '@/utils/datetime';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientForgetPasswordEvent } from '@/events/definations/client/client.events';
import { UserDevice } from '@/entities/user/user-device.entity';
import { OauthService } from '@/services/oauth/oauth.service';
import { OauthProvider } from '@/common/enums/oauth.enum';
import { S3BucketService } from '@/services/s3-bucket/s3-bucket.service';
import { S3BucketPaths } from '@/services/s3-bucket/s3-bucket-paths';
import { UserRole } from '@/common/enums/user-role.enum';
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: userRepository,
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly oauthService: OauthService,
    private readonly s3BucketService: S3BucketService,
  ) {}

  /**
   * Sign in User
   * @param payload - Sig in Payload
   * @param deviceId
   * @returns access token
   * @throws UnauthorizedException if Sign in fails
   */
  async signInEmail(payload: EmailSignInDto, deviceId: string) {
    const user = await this.CheckUserExists(payload.email);
    await verifyHash(payload.password, user.passwordHash);

    if (!user.emailVerifiedAt) {
      throw new UnprocessableException({
        message: 'User is not otp Verified.',
        field: 'otp',
      });
    }

    if (user.deactivatedAt) {
      throw new UnauthorizedException('User Deactivated By Admin.');
    }

    if (user.twoFactorAuthenticationEnabled) {
      const { twoFaCode } = payload;

      if (!twoFaCode) {
        throw new NotAcceptableException({ twoFaRequired: true });
      }

      if (!user.twoFactorAuthenticationSecret) {
        throw new BadRequestException('Opt secret is empty');
      }

      const verify = authenticator.verify({
        token: twoFaCode,
        secret: user.twoFactorAuthenticationSecret,
      });

      if (!verify) {
        throw new UnprocessableException({
          message: 'Two factor authentication code is invalid.',
          field: 'twoFaCode',
        });
      }
    }

    await this.createDevice(user.id, deviceId);

    const token = await this.generateToken(user);

    return {
      token: token,
    };
  }

  /**
   * Sends an OTP verification code to user's email
   * @param userEmail - User email to send OTP to
   * @returns Promise containing success message and access token
   * @throws UnprocessableEntityException if email sending fails
   */
  sendEmailOtp() {
    //TODO: implement me!!!
    return {
      message:
        'Nigga 1 finally you are here call me i have a better idea for email otp, with regards nigga 3',
    };
  }

  /**
   * Verifies the OTP code provided by the user
   * @param otpCode - The OTP code to verify
   * @param email - Email of the user attempting verification
   * @returns Promise containing success message and new access token
   * @throws BadRequestException if OTP is invalid or expired
   * @returns token
   */
  async verifyEmailOtp(otpCode: string, userEmail: string, deviceId: string) {
    const user = await this.CheckUserExists(userEmail);

    // Prevent re-verifying if already verified
    if (user.emailVerifiedAt) {
      throw new UnprocessableException({
        message: 'OTP already verified.',
        field: 'otpCode',
      });
    }

    // Find the latest valid OTP for this user
    const latestOtp = await this.em.findOne(UserSecurityAction, {
      user: user,
      type: SecurityActionType.OTP,
      status: SecurityActionsStatus.PENDING,
      secret: otpCode,
      expiredAt: { $gt: new Date() },
    });

    if (!latestOtp) {
      throw new UnprocessableException({
        message: 'No Valid OTP or Expired.',
        field: 'otpCode',
      });
    }

    // Mark the OTP as used
    latestOtp.status = SecurityActionsStatus.USED;
    user.emailVerifiedAt = new Date();
    await this.em.persistAndFlush([latestOtp, user]);

    await this.createDevice(user.id, deviceId);

    const token = await this.generateToken(user);

    return { token: token };
  }

  /**
   * Forgot Password
   * @params payload
   */
  async forgotPassword(payload: ForgetPasswordDto) {
    try {
      const user = await this.CheckUserExists(payload.email);

      const existingUserForgetPassword = await this.em.findOne(
        UserSecurityAction,
        {
          user: user,
        },
      );

      if (existingUserForgetPassword) {
        // delete the existing token
        await this.em.nativeDelete(UserSecurityAction, {
          secret: existingUserForgetPassword.secret,
        });
      }

      // Reset Token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Expiry Date -> 15 Minutes from now
      const expiry = getAheadDateByMin(15);

      // Store the reset token in the database
      const userForgetPassword = this.em.create(UserSecurityAction, {
        user: user,
        type: SecurityActionType.PASSWORD_RESET,
        secret: resetToken,
        expiredAt: expiry,
        status: SecurityActionsStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.em.persistAndFlush(userForgetPassword);

      // Dispath the Forget Password Event
      this.eventEmitter.emit(
        'user.forgot-password',
        new ClientForgetPasswordEvent({
          fullName: user.name,
          email: user.email,
          token: resetToken,
          expiry,
        }),
      );
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Reset Password
   * @param payload
   */
  async resetPassword(payload: ResetPasswordDto) {
    const userForgetPassword = await this.em.findOne(UserSecurityAction, {
      secret: payload.token,
    });

    if (!userForgetPassword) {
      throw new UnprocessableException({
        message: 'Invalid or expired reset code.',
        field: 'resetPassword',
      });
    }

    if (userForgetPassword.expiredAt < new Date()) {
      throw new UnprocessableException({
        message: 'Reset code has expired.',
        field: 'resetPassword',
      });
    }

    const hashedPassword = await hashPassword(payload.password);

    await this.em.nativeUpdate(
      User,
      {
        id: userForgetPassword.user.id,
      },
      {
        passwordHash: hashedPassword,
      },
    );
  }

  /**
   * Create Device
   * @param userId
   * @param deviceId
   */
  async createDevice(userId: string, deviceId: string) {
    const existsDevice = await this.checkDeviceExists(userId, deviceId);

    if (!existsDevice) {
      const newDevice = this.em.create(UserDevice, {
        user: userId,
        deviceId: deviceId,
      });

      await this.em.persistAndFlush(newDevice);
    }
  }

  /**
   * SignOut User
   * @param currentUser
   * @param deviceId
   */
  async signOutUser(currentUser: User, deviceId: string) {
    const device = await this.em.findOne(UserDevice, { deviceId });

    if (!device) {
      return;
    }

    if (currentUser.id !== device.user.id) {
      return;
    }

    await this.em.removeAndFlush(device);
  }

  /**
   * ============================================
   * Helper Methods
   * ============================================
   */

  /**
   * check device exists
   * @param userId
   * @param deviceId
   * @returns
   */
  async checkDeviceExists(userId: string, deviceId: string) {
    const device = await this.em.findOne(UserDevice, {
      user: userId,
      deviceId: deviceId,
    });

    return device;
  }

  /**
   * Generates a JWT access token for the user
   * @param user - User entity to generate token for
   * @returns Promise containing the signed access token
   */
  async generateToken(user: User): Promise<string> {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return token;
  }

  /**
   * Check If User Exists
   * @param email
   * @returns user instance
   */
  async CheckUserExists(email: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  /**
   * Generates a random 5-digit OTP code
   * @returns string - 5-digit OTP code
   */
  generateOtp() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  /**
   * ============================
   * Oauth Methods
   * ============================
   */

  async findOrCreateGoogleUser(payload: GoogleUserPayload, deviceId: string) {
    const { token } = payload;

    const { email, firstName, lastName, profilePictureUrl, sub } =
      await this.oauthService.verifyGoogleToken(token);

    let user = await this.userRepository.findOne({
      oauthProviderId: sub,
      oauthProvider: OauthProvider.GOOGLE,
      role: UserRole.CUSTOMER,
    });

    if (!user) {
      // Upload Profile Picture
      const file =
        await this.oauthService.fetchProfileImageAsFile(profilePictureUrl);

      const { originalMetadata, thumbnailMetadata } =
        await this.s3BucketService.UploadPhoto(
          file,
          S3BucketPaths.USER_PROFILE_PHOTO,
        );

      // Create the user
      user = this.userRepository.create({
        email,
        passwordHash: await hashPassword(v4()),
        role: UserRole.CUSTOMER,
        name: `${firstName} ${lastName}`,
        emailVerifiedAt: new Date(),
        photo: originalMetadata.url,
        photoThumbnail: thumbnailMetadata?.url,
        oauthProvider: OauthProvider.GOOGLE,
        oauthProviderId: sub,
        twoFactorAuthenticationEnabled: false,
      });

      await this.em.persistAndFlush(user);
    }

    // for cases when learner is manual registerd but not otp verified
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await this.em.persistAndFlush(user);
    }

    await this.createDevice(user.id, deviceId);

    const accessToken = await this.generateToken(user);

    return { token: accessToken };
  }

  async findOrCreateAppleUser(payload: AppleUserPayload, deviceId: string) {
    const { token } = payload;

    const { email, sub } = await this.oauthService.verifiyAppleToken(token);

    let user = await this.userRepository.findOne({
      oauthProvider: OauthProvider.APPLE,
      oauthProviderId: sub,
      role: UserRole.CUSTOMER,
    });

    if (!user) {
      //TODO: FIX other data
      // Create the user
      user = this.userRepository.create({
        email,
        passwordHash: await hashPassword(v4()),
        role: UserRole.CUSTOMER,
        name: 'Anything',
        emailVerifiedAt: new Date(),
        oauthProvider: OauthProvider.APPLE,
        oauthProviderId: sub,
        twoFactorAuthenticationEnabled: false,
      });

      await this.em.persistAndFlush(user);
    }

    // for cases when learner is manual registerd but not otp verified
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await this.em.persistAndFlush(user);
    }

    await this.createDevice(user.id, deviceId);

    const accessToken = await this.generateToken(user);

    return { token: accessToken };
  }
}
