import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard extends PassportAuthGuard('jwt-admin') {
  constructor() {
    super();
  }
}
