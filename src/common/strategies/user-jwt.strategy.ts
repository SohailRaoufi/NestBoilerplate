import { User } from '@/entities/user/user.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.getOrThrow('USER_JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: { sub: string }) {
    const { sub } = payload;

    if (!sub) {
      throw new UnauthorizedException();
    }

    const user = await this.em.findOne(
      User,
      {
        id: sub,
        emailVerifiedAt: { $ne: null },
      },
      {
        disableIdentityMap: true,
      },
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
