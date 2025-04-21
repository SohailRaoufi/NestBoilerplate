import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { Admin } from '@/entities/admin/admin.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.getOrThrow('ADMIN_JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: { sub: string }) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const admin = await this.em.findOne(
      Admin,
      {
        id: payload.sub,
        suspendedAt: { $eq: null },
      },
      {
        disableIdentityMap: true,
      },
    );

    if (!admin) {
      throw new UnauthorizedException();
    }
    return admin;
  }
}
