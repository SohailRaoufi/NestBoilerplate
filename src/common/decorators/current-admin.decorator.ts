import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { Admin } from '@/entities/admin/admin.entity';

export const CurrentAdmin = createParamDecorator(
  (data: keyof Admin | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin = request.user;
    return data ? admin?.[data] : admin;
  },
);
