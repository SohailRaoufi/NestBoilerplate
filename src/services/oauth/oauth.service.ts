import { v4 } from 'uuid';
import { firstValueFrom } from 'rxjs';
import { JwksClient } from 'jwks-rsa';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { OAuth2Client } from 'google-auth-library';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
@Injectable()
export class OauthService {
  private googleClientSecret: string;
  private googleClientId: string;
  private googleClient: OAuth2Client;
  private appleClient: JwksClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {
    this.initGoogleClient();
    this.initAppleClient();
  }

  private initGoogleClient() {
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.googleClient = new OAuth2Client({
      client_id: this.googleClientId,
      client_secret: this.googleClientSecret,
    });
  }

  private initAppleClient() {
    this.appleClient = new JwksClient({
      jwksUri: process.env.APPLE_AUTH_KEYS_URL,
      cache: false,
    });
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: [
          this.googleClientId,
          process.env.GOOGLE_IOS_CLIENT_ID,
          process.env.GOOGLE_ANDRIOD_CLIENT_ID,
        ],
      });

      const payload = ticket.getPayload();

      return {
        sub: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profilePictureUrl: payload.picture,
      };
    } catch {
      throw new UnauthorizedException('Invalid oauth token');
    }
  }

  async fetchProfileImageAsFile(
    profileImageUrl: string,
  ): Promise<Express.Multer.File> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(profileImageUrl, {
          responseType: 'arraybuffer',
        }),
      );

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const ext = contentType.split('/')[1] || 'jpg';

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: `${v4()}.${ext}`,
        encoding: '7bit',
        mimetype: contentType,
        buffer,
        size: buffer.length,
        destination: '',
        filename: `${v4()}.${ext}`,
        path: '',
        stream: null,
      };

      return file;
    } catch {
      throw new BadRequestException('Invalid profile photo url');
    }
  }

  async verifiyAppleToken(token: string) {
    const decoded = this.jwtService.decode(token, { complete: true });

    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid Apple ID token');
    }

    const { kid } = decoded.header;

    const key = await this.appleClient.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        publicKey,
        issuer: 'https://appleid.apple.com',
        audience: [process.env.APPLE_CLIENT_ID, process.env.APPLE_BUNDLE_APP],
      });

      return {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple Id token');
    }
  }
}
