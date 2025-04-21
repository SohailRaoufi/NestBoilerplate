import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserJwtGuard extends AuthGuard('jwt-user') {
  constructor() {
    super();
  }
}
