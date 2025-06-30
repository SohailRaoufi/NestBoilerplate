/* eslint-disable @typescript-eslint/require-await */
import 'dotenv/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

export const mailerConfigs = async (): Promise<MailerOptions> => ({
  transport: {
    host: process.env.EMAIL_HOST,
    port: +process.env.EMAIL_PORT!,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: process.env.EMAIL_SECURE === 'true',
  },
  defaults: {
    from: 'Me <info@me.ca>',
  },
  template: {
    dir: process.cwd() + '/templates/emails/',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
  preview: false,
  options: {
    partials: {
      dir: process.cwd() + '/templates/emails/partials/',
      options: {
        strict: true,
      },
    },
  },
});
