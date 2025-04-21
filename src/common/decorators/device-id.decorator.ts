import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DeviceId = createParamDecorator((_: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const deviceId = request.headers['x-device-id'];

  return deviceId;
});
