/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';

import { EmailService } from '@/services/email-service/email.service';
import {
  ClientForgetPasswordEvent,
  ClientSendOtpEvent,
} from '@/events/definations/client/client.events';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ClientEventListener {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('user.forgot-password')
  async handleUserForgetPasswordEvent(payload: ClientForgetPasswordEvent) {
    await this.emailService.sendForgetPasswordEmail(payload.payload);
  }

  @OnEvent('user.send-otp')
  async handleUserRegiserEvent(payload: ClientSendOtpEvent) {
    await this.emailService.sendOtp(payload.payload);
  }
}
