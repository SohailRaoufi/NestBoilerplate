/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';

import { EmailService } from '@/services/email-service/email.service';
import {
  CustomerForgetPasswordEvent,
  CustomerSendOtpEvent,
} from '@/events/definations/customer/customer.events';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CustomerEventListener {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.forgot-password')
  async handleUserForgetPasswordEvent(payload: CustomerForgetPasswordEvent) {
    await this.emailService.sendForgetPasswordEmail(payload.payload);
  }

  @OnEvent('user.send-otp')
  async handleUserRegiserEvent(payload: CustomerSendOtpEvent) {
    await this.emailService.sendOtp(payload.payload);
  }
}
