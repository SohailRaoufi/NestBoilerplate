import { wrap } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';

import { User, userRepository } from '@/entities/user/user.entity';
import { Verify2faDto } from './dto/auth-2fa-verify.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ToggleNotificationDto } from './dto/toggle-notification.dto';
import { hashPassword, verifyHash } from '@/utils/hash';
import { UnprocessableException } from '@/common/exceptions/unprocessable';
import { authenticator } from 'otplib';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: userRepository,
    private readonly em: EntityManager,
  ) {}

  /**
   * Change User Password
   * @param user
   * @param payload
   */
  async updatePassword(user: User, payload: UpdatePasswordDto) {
    const { currentPassword, newPassword } = payload;

    // Verify current password
    if (!(await verifyHash(currentPassword, user.passwordHash))) {
      throw new UnprocessableException({
        message: 'Invalid Current Password.',
        field: 'currentPassword',
      });
    }

    if (currentPassword === newPassword) {
      throw new UnprocessableException({
        message: 'Old password can not be same as new password.',
        field: 'newPassword',
      });
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);

    // Save changes
    await this.em.persistAndFlush(user);
  }

  /**
   * Generete 2FA Secret
   * @param user
   * @returns
   */
  async generateTwoFactorAuthenticationSecret(user: User) {
    const secret = authenticator.generateSecret();

    const otpAuthUrl = authenticator.keyuri(user.email, 'Wagey', secret);

    wrap(user).assign({ twoFactorAuthenticationSecret: secret });

    await this.em.persistAndFlush(user);

    return {
      otpAuthUrl,
    };
  }

  /**
   * Disables two factor authentication
   * @param user user entity
   */
  async disableTwoFactorAuthentication(user: User) {
    wrap(user).assign({
      twoFactorAuthenticationEnabled: false,
      twoFactorAuthenticationSecret: null,
    });
    await this.em.persistAndFlush(user);
  }

  /**
   * Verify 2FA
   * @param user
   * @param payload
   */
  async verify2faAuth(user: User, payload: Verify2faDto) {
    const verify = authenticator.verify({
      token: payload.code,
      secret: user.twoFactorAuthenticationSecret!,
    });

    if (!verify) {
      throw new UnprocessableException({
        message: 'Two factor authentication code is invalid.',
        field: 'twoFaCode',
      });
    }

    if (user.twoFactorAuthenticationEnabled) {
      throw new UnprocessableException({
        message: 'twoFactorEnabled',
        field: '2fa is already enabled on this account.',
      });
    }

    wrap(user).assign({ twoFactorAuthenticationEnabled: true });
    await this.em.persistAndFlush(user);
  }

  /**
   * Toogle Notification
   * @param user
   */
  async toggleNotification(user: User, payload: ToggleNotificationDto) {
    const { enabled } = payload;
    user.notificationEnabled = enabled;

    await this.em.persistAndFlush(user);
  }

  /**
   * Delete User Account
   * @param userId
   */
  async deleteAccount(userId: string) {
    const user = await this.findUserById(userId);

    if (user.deletedAt) {
      throw new UnprocessableException({
        message: 'User Already Deleted',
        field: 'deleteAccount',
      });
    }

    user.deletedAt = new Date();
    await this.em.persistAndFlush(user);
  }

  /**
   * Find User by ID
   * @param userId - The ID of the User
   * @returns The User entity
   */
  private async findUserById(userId: string) {
    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }
}
