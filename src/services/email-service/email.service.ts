import { Queue } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import { EmailQueue } from '@/common/interfaces/queues';
import { calculateExpiryInMinutes } from '@/utils/datetime';

import {
  ISendAccountVerifiedEmail,
  ISendForgetPasswordPayload,
  ISendInstructorInvalidDocument,
  ISendSupportResolvedEmail,
} from './interfaces/email-interfaces';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue<EmailQueue>,
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
  }: ISendForgetPasswordPayload) {
    // Convert expiry to minutes
    const minutes = calculateExpiryInMinutes(expiry);
    // Create reasetLink using token
    const resetLink = `${process.env.FRONTEND_URL}/password-reset?token=${token}`;

    // add email to queue
    await this.emailQueue.add('forget-password-email', {
      to: email,
      subject: 'Forget Your Password',
      template: 'forget-password',
      context: {
        title: 'Forget Your Password',
        fullName,
        expiryMinutes: minutes,
        resetLink,
      },
    });
  }

  /**
   * Send Email for Invalid Documents
   * @param payload
   */
  async sendInstructorInvalidDocumentEmail(
    payload: ISendInstructorInvalidDocument,
  ) {
    const { email, fullName, documents } = payload;

    const url = process.env.FRONTEND_URL;

    await this.emailQueue.add('invalid-document-email', {
      to: email,
      subject: 'Invalid Document',
      template: 'invalid-document',
      context: {
        title: 'Invalid Documents',
        fullName,
        documents,
        url,
      },
    });
  }

  /**
   * Send Account Verified Email
   * @param payload
   */
  async sendAccountVerifiedEmail(payload: ISendAccountVerifiedEmail) {
    const { email, fullName } = payload;

    await this.emailQueue.add('account-verified', {
      to: email,
      subject: 'Account Verified',
      template: 'account-verified',
      context: {
        title: 'Account Verified',
        fullName,
        email,
      },
    });
  }

  /**
   * Send Support Resolved Email
   * @param payload
   */
  async sendSupportResolvedEmail(payload: ISendSupportResolvedEmail) {
    const {
      supportRequest: { email, subject },
    } = payload;

    await this.emailQueue.add('support-resolved', {
      to: email,
      subject: 'Support Resolved',
      template: 'support-resolved',
      context: {
        title: 'Support Resolved',
        email,
        subject,
      },
    });
  }
}
