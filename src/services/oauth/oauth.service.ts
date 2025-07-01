/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { AttachmentsService } from '@/http/attachments/attachments.service';
@Injectable()
export class OauthService {
  private googleClientSecret!: string;
  private googleClientId!: string;
  private googleClient!: OAuth2Client;
  private appleClient!: JwksClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {
    this.initGoogleClient();
    this.initAppleClient();
  }

  private initGoogleClient() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google client environment variables');
    }
    this.googleClientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.googleClient = new OAuth2Client({
      clientId: this.googleClientId,
      clientSecret: this.googleClientSecret,
    });
  }

  private initAppleClient() {
    if (!process.env.APPLE_AUTH_KEYS_URL) {
      throw new Error('Missing Apple auth keys URL');
    }
    this.appleClient = new JwksClient({
      jwksUri: process.env.APPLE_AUTH_KEYS_URL,
      cache: false,
    });
  }

  async verifyGoogleToken(token: string) {
    try {
      const iosClientId = process.env.GOOGLE_IOS_CLIENT_ID;
      const androidClientId = process.env.GOOGLE_ANDRIOD_CLIENT_ID;
      if (!iosClientId || !androidClientId) {
        throw new UnauthorizedException('Missing Google client IDs');
      }
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: [this.googleClientId, iosClientId, androidClientId],
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid oauth token');
      }

      return {
        sub: payload.sub as string,
        email: payload.email as string,
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        profilePictureUrl: payload.profile as string,
      };
    } catch {
      throw new BadRequestException('Invalid google token');
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
      const contentType =
        (response.headers?.['content-type'] as string) || 'image/jpeg';
      const ext = contentType.split('/')[1] || 'jpg';

      // Use a dummy Readable stream for the required property
      const { Readable } = await import('stream');
      const stream = Readable.from(buffer);

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: `${v4()}.${ext}`,
        encoding: '7bit',
        mimetype: contentType,
        buffer: buffer as unknown as Buffer & ArrayBufferLike,
        size: buffer.length,
        destination: '',
        filename: `${v4()}.${ext}`,
        path: '',
        stream,
      };

      return file;
    } catch {
      throw new BadRequestException('Failed to fetch profile image');
    }
  }

  async verifiyAppleToken(token: string) {
    const decoded = this.jwtService.decode(token, { complete: true });

    if (
      !decoded ||
      typeof decoded === 'string' ||
      !decoded.header ||
      !decoded.header.kid
    ) {
      throw new UnauthorizedException('Invalid Apple ID token');
    }

    const { kid } = decoded.header;

    const key = await this.appleClient.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    const appleClientId = process.env.APPLE_CLIENT_ID;
    const appleBundleApp = process.env.APPLE_BUNDLE_APP;
    if (!appleClientId || !appleBundleApp) {
      throw new UnauthorizedException('Missing Apple client IDs');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['RS256'],
        publicKey,
        issuer: 'https://appleid.apple.com',
        audience: [appleClientId, appleBundleApp],
      });

      return {
        sub: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new UnauthorizedException('Invalid Apple Id token');
    }
  }
  s;
}
