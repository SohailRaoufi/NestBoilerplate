import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { MailerService } from '@nestjs-modules/mailer';

export type EmailQueue = {
  to: string;
  subject: string;
  template: string;
  context?: Record<any, any>;
};

@Processor('email', {
  concurrency: 2,
  limiter: { max: 2, duration: 1000 },
})
export class EmailConsumer extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<EmailQueue, any, string>): Promise<any> {
    return await this.mailerService.sendMail(job.data);
  }
}
