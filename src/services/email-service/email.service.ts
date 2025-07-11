import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { EmailQueue } from '@/queues/consumers/email.consumer';
import { calculateExpiryInMinutes } from '@/utils/datetime';
import {
  CustomerForgetPasswordEvent,
  CustomerForgetPasswordEventPayload,
  CustomerOtpEventPayload,
} from '@/events/definations/customer/customer.events';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserSecurityAction } from '@/entities/user/user-security-action.entity';
import { SecurityActionsStatus } from '@/common/enums/security-action.enum';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue<EmailQueue>,
    private readonly em: EntityManager,
  ) {}

  /**
   * takes email, token and expiry. create a reset link and calculate expiry in minutes also add the job to the queue
   * @param payload
   */
  async sendForgetPasswordEmail({
    fullName,
    email,
    token,
    expiry,
  }: CustomerForgetPasswordEventPayload) {
    // Convert expiry to minutes
    const minutes = calculateExpiryInMinutes(expiry);

    // add email to queue
    await this.emailQueue.add('forget-password-email', {
      to: email,
      subject: 'Forget Your Password',
      template: 'forget-password',
      context: {
        title: 'Forget Your Password',
        fullName,
        expiryMinutes: minutes,
        token : token
      },
    });
  }

  async sendOtp({
    otpCode,
    otpId,
    email,
    expiry,
    fullName,
  }: CustomerOtpEventPayload) {
    try {
      const expiryMinutes = calculateExpiryInMinutes(expiry);

      await this.emailQueue.add('otp-email', {
        to: email,
        subject: 'Otp Code',
        template: 'otp-email',
        context: {
          title: 'OTP Verification',
          otpCode,
          expiryMinutes,
          fullName,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // delete the otp if something went wrong
      await this.em.nativeDelete(UserSecurityAction, {
        id: otpId,
        status: SecurityActionsStatus.PENDING,
      });
    }
  }
}
