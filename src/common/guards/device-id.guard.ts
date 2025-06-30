import { Reflector } from '@nestjs/core';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class DeviceIdGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const deviceId = request.headers['x-device-id'];

    /**
     * If the request path not starts with '/admin' or '/client' then ignore the guard and return true
     */
    const path = request.route.path as string;

    if (!path.startsWith('/admin') && !path.startsWith('/client')) {
      return true;
    }

    if (!deviceId) {
      throw new HttpException(
        'X-Device-Id header is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  }
}
