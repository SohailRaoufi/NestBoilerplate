import 'dotenv/config';
import { v4 } from 'uuid';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { hashPassword, verifyHash } from '@/utils/hash';
import { UserTypes } from '@/common/enums/user-type.enum';
import { OauthProvider } from '@/common/enums/oauth.enum';
import { OauthService } from '@/services/oauth/oauth.service';
import { UserOtpType } from '@/common/enums/user-otp-types.enum';
import { User, UserRepository } from '@/entities/user/user.entity';
import { UserOtpRepository } from '@/entities/user/user-otp.entity';
import { S3BucketPaths } from '@/services/s3-bucket/s3-bucket-paths';
import { S3BucketService } from '@/services/s3-bucket/s3-bucket.service';
import { UserDeviceRepository } from '@/entities/user/user-device.entity';
import { UserLicenseRepository } from '@/entities/user/user-license.entity';
import { UnprocessableException } from '@/common/exceptions/unprocessable.exception';
import { InstructorCarPhotoRepository } from '@/entities/user/instructor-car-photo.entity';
import { InstructorBankDetailRepository } from '@/entities/user/instructor-bank-detail.entity';
import {
  UserForgetPassword,
  UserForgetPasswordRepository,
} from '@/entities/user/user-forget-password.entity';
import {
  ClientForgetPasswordEvent,
  ClientSendOtpEvent,
} from '@/events/definations/client/client.events';

import { EmailSignInDto } from './dto/email-signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { AppleUserPayload, GoogleUserPayload } from './dto/oauth.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userOtpRepository: UserOtpRepository,
    private readonly userForgetPasswordRepository: UserForgetPasswordRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
    private readonly s3BucketService: S3BucketService,
    private readonly eventEmitter: EventEmitter2,
    private readonly oauthService: OauthService,
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
    await verifyHash(user.passwordHash, payload.password);

    if (!user.otpVerified) {
      throw new UnprocessableException('User is not otp Verified.', 'otp');
    }

    if (user.deactivatedAt) {
      throw new UnauthorizedException('User Deactivated By Admin.');
    }

    if (user.twoFactorAuthenticationEnabled) {
      const { twoFaCode } = payload;

      if (!twoFaCode) {
        throw new NotAcceptableException({ twoFaRequired: true });
      }

      const verify = authenticator.verify({
        token: twoFaCode,
        secret: user.twoFactorAuthenticationSecret,
      });

      if (!verify) {
        throw new UnprocessableException(
          'Two factor authentication code is invalid.',
          'twoFaCode',
        );
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
  async sendEmailOtp(userEmail: string) {
    // Find the user
    const user = await this.CheckUserExists(userEmail);

    // Check if user is already verified
    if (user.otpVerified) {
      throw new UnprocessableException('User already verified.', 'verified');
    }

    // Invalidate previous OTPs
    await this.userOtpRepository.nativeUpdate(
      { user: user, otpType: UserOtpType.EMAIL, isOtpValid: true },
      { isOtpValid: false },
    );

    // Create new OTP record
    const otpCode = this.generateOtp();

    // create the otp expiry date
    const expiry = new Date(
      Date.now() + 1000 * 60 * +process.env.EMAIL_OTP_EXPIRY_MIN,
    );

    const userOtp = this.userOtpRepository.create({
      otpCode,
      otpType: UserOtpType.EMAIL,
      otpSentTo: user.email,
      otpExpiry: expiry,
      user: user,
    });

    await this.em.persistAndFlush(userOtp);

    // Dispatch the user register event
    this.eventEmitter.emit(
      'user.send-otp',
      new ClientSendOtpEvent({
        reciever: user.email,
        fullName: user.fullName,
        type: UserOtpType.EMAIL,
        otpCode: Number(otpCode),
        otpId: userOtp.id,
        expiry,
      }),
    );

    return { message: 'OTP sent successfully', otpCode: otpCode };
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
    if (user.otpVerified) {
      throw new UnprocessableException('OTP already verified.', 'otpCode');
    }

    // Find the latest valid OTP for this user
    const latestOtp = await this.userOtpRepository.findOne({
      user: user,
      otpType: UserOtpType.EMAIL,
      isOtpValid: true,
      otpCode,
      otpExpiry: { $gt: new Date() },
    });

    if (!latestOtp) {
      throw new UnprocessableException('No Valid OTP or Expired.', 'otpCode');
    }

    // Mark the OTP as used
    latestOtp.isOtpValid = false;
    user.otpVerified = true;
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

      const existingUserForgetPassword =
        await this.userForgetPasswordRepository.findOne({
          user: user,
        });

      if (existingUserForgetPassword) {
        // delete the existing token
        await this.em.nativeDelete(UserForgetPassword, {
          token: existingUserForgetPassword.token,
        });
      }

      // Reset Token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Expiry Date -> 15 Minutes from now
      const expiry = new Date(
        Date.now() + 60 * 1000 * +process.env.FORGET_PASSWORD_EXPIRY_MIN,
      );

      // Store the reset token in the database
      const userForgetPassword = this.userForgetPasswordRepository.create({
        user: user,
        token: resetToken,
        expiresAt: expiry,
      });

      // Dispath the Forget Password Event
      this.eventEmitter.emit(
        'user.forgot-password',
        new ClientForgetPasswordEvent({
          fullName: user.fullName,
          email: user.email,
          token: resetToken,
          expiry,
        }),
      );

      await this.em.persistAndFlush(userForgetPassword);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  /**
   * Reset Password
   * @param payload
   */
  async resetPassword(payload: ResetPasswordDto) {
    const userForgetPassword = await this.userForgetPasswordRepository.findOne({
      token: payload.token,
    });

    if (!userForgetPassword) {
      throw new UnprocessableException(
        'Invalid or expired reset code.',
        'resetPassword',
      );
    }

    if (userForgetPassword.expiresAt < new Date()) {
      throw new UnprocessableException('Reset code has expired.');
    }

    const hashedPassword = await hash(payload.password);

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
      const newDevice = this.userDeviceRepository.create({
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
    const device = await this.userDeviceRepository.findOne({ deviceId });

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
    const device = await this.userDeviceRepository.findOne({
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
      type: user.type,
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
    const { token, phoneNumber, dateOfBirth, gender } = payload;

    const { email, firstName, lastName, profilePictureUrl, sub } =
      await this.oauthService.verifyGoogleToken(token);

    let user = await this.userRepository.findOne({
      oauthProviderId: sub,
      oauthProvider: OauthProvider.GOOGLE,
      type: UserTypes.LEARNER,
    });

    if (!user) {
      if (!phoneNumber || !dateOfBirth || !gender) {
        throw new NotAcceptableException({ additionalDataRequired: true });
      }

      // Check phone number exists
      const phoneExists = await this.userRepository.findOne({ phoneNumber });

      if (phoneExists) {
        throw new UnprocessableException(
          'Phone number already exists',
          'phoneNumber',
        );
      }

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
        passwordHash: await hash(v4()),
        type: UserTypes.LEARNER,
        firstName,
        lastName,
        otpVerified: true,
        profilePhoto: originalMetadata,
        profilePhotoThumbnail: thumbnailMetadata,
        gender,
        phoneNumber,
        dateOfBirth,
        oauthProvider: OauthProvider.GOOGLE,
        oauthProviderId: sub,
      });

      await this.em.persistAndFlush(user);
    }

    // for cases when learner is manual registerd but not otp verified
    if (!user.otpVerified) {
      user.otpVerified = true;
      await this.em.persistAndFlush(user);
    }

    await this.createDevice(user.id, deviceId);

    const accessToken = await this.generateToken(user);

    return { token: accessToken };
  }

  async findOrCreateAppleUser(payload: AppleUserPayload, deviceId: string) {
    const { token, phoneNumber, dateOfBirth, gender, firstName, lastName } =
      payload;

    const { email, sub } = await this.oauthService.verifiyAppleToken(token);

    let user = await this.userRepository.findOne({
      oauthProvider: OauthProvider.APPLE,
      oauthProviderId: sub,
      type: UserTypes.LEARNER,
    });

    if (!user) {
      if (!phoneNumber || !dateOfBirth || !gender || !firstName || !lastName) {
        throw new NotAcceptableException({ additionalDataRequired: true });
      }

      // Check phone number exists
      const phoneExists = await this.userRepository.findOne({ phoneNumber });

      if (phoneExists) {
        throw new UnprocessableException(
          'Phone number already exists',
          'phoneNumber',
        );
      }

      // Create the user
      user = this.userRepository.create({
        email,
        passwordHash: await hash(v4()),
        type: UserTypes.LEARNER,
        firstName,
        lastName,
        otpVerified: true,
        oauthProvider: OauthProvider.APPLE,
        oauthProviderId: sub,
        gender,
        phoneNumber,
        dateOfBirth,
      });

      await this.em.persistAndFlush(user);
    }

    // for cases when learner is manual registerd but not otp verified
    if (!user.otpVerified) {
      user.otpVerified = true;
      await this.em.persistAndFlush(user);
    }

    await this.createDevice(user.id, deviceId);

    const accessToken = await this.generateToken(user);

    return { token: accessToken };
  }
}
