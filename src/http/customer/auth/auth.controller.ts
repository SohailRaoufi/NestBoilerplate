import 'dotenv/config';

import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { User } from '@/entities/user/user.entity';
import { DeviceId } from '@/common/decorators/device-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { AuthService } from './auth.service';
import { EmailSignInDto } from './dto/email-signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { EmailVerifyOtpDto } from './dto/email-verfiy-otp.dto';
import { EmailResendOtpDto } from './dto/email-resend-otp.dto';
import { AppleUserPayload, GoogleUserPayload } from './dto/oauth.dto';
import { UserJwtGuard } from '@/common/guards/user.guard';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token.dto';

@ApiTags('Customer - Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*==============================================
   * User Sign In
   *=============================================*/

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  async signInEmail(
    @Body() payload: EmailSignInDto,
    @DeviceId() deviceId: string,
  ) : Promise<TokenResponseDto> {
    return await this.authService.signInEmail(payload, deviceId);
  }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register' })
  async register(@Body() payload: RegisterDto) {
    return await this.authService.register(payload);
  }

  /*==============================================
   * Verify OTP Code
   *=============================================*/

  @Post('/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP Code' })
  async verifyOtp(
    @Body() payload: EmailVerifyOtpDto,
    @DeviceId() deviceId: string,
  ) : Promise<TokenResponseDto> {
    return await this.authService.verifyEmailOtp(
      payload.otpCode,
      payload.email,
      deviceId,
    );
  }

  /*==============================================
   * Resend OTP Code
   *=============================================*/

  @Post('/otp/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resend OTP Code' })
  @ApiNoContentResponse({
    description: 'OTP code resent successfully',
  })
  resendOtp(@Body() payload: EmailResendOtpDto) {
    return this.authService.sendEmailOtp();
  }

  /*==============================================
   * Forget Password
   *=============================================*/

  @Post('/password/reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Forget Password' })
  @ApiNoContentResponse({
    description: 'Password reset email sent successfully',
  })
  async forgetPassword(@Body() payload: ForgetPasswordDto) {
    await this.authService.forgotPassword(payload);
  }

  /*==============================================
   * Reset Password
   *=============================================*/

  @Post('/password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset Password' })
  async resetPassword(@Body() payload: ResetPasswordDto) {
    await this.authService.resetPassword(payload);
  }

  /*==============================================
   * SignOut User
   *=============================================*/

  @Post('/logout')
  @UseGuards(UserJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sign Out User' })
  @ApiNoContentResponse({
    description: 'User Sign out successfully',
  })
  async logout(@CurrentUser() currentUser: User, @DeviceId() deviceId: string) {
    await this.authService.signOutUser(currentUser, deviceId);
  }

  /*==============================================
   * Google Oauth
   *=============================================*/

  @Post('/oauth/google')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Google oauth' })
  async googleOauth(
    @Body() payload: GoogleUserPayload,
    @DeviceId() deviceId: string,
  ): Promise<TokenResponseDto> {
    return await this.authService.findOrCreateGoogleUser(payload, deviceId);
  }

  /*==============================================
   * Apple Oauth
   *=============================================*/

  @Post('/oauth/apple')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apple oauth' })
  async appleOauth(
    @Body() payload: AppleUserPayload,
    @DeviceId() deviceId: string,
  ) : Promise<TokenResponseDto> {
    return await this.authService.findOrCreateAppleUser(payload, deviceId);
  }
}
