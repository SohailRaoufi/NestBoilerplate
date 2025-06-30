import 'dotenv/config';

import {
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

@ApiTags('Client - Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*==============================================
   * User Sign In
   *=============================================*/

  @Post('/sign-in/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Sign In' })
  @ApiNoContentResponse({
    description: 'User sign in successfully',
  })
  async signInEmail(
    @Body() payload: EmailSignInDto,
    @DeviceId() deviceId: string,
  ) {
    return await this.authService.signInEmail(payload, deviceId);
  }

  /*==============================================
   * Verify OTP Code
   *=============================================*/

  @Post('/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP Code' })
  @ApiResponse({
    description: 'OTP verified successfully',
  })
  async verifyOtp(
    @Body() payload: EmailVerifyOtpDto,
    @DeviceId() deviceId: string,
  ) {
    return await this.authService.verifyEmailOtp(
      payload.otpCode,
      payload.email,
      deviceId,
    );
  }

  /*==============================================
   * Resend OTP Code
   *=============================================*/

  @Post('/resend-otp')
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

  @Post('/forget-password')
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

  @Post('/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset Password' })
  @ApiNoContentResponse({
    description: 'Password reset successfully',
  })
  async resetPassword(@Body() payload: ResetPasswordDto) {
    await this.authService.resetPassword(payload);
  }

  /*==============================================
   * SignOut User
   *=============================================*/

  @Post('/sign-out')
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
  @ApiOkResponse({
    description: 'Google Oauth',
  })
  async googleOauth(
    @Body() payload: GoogleUserPayload,
    @DeviceId() deviceId: string,
  ) {
    return await this.authService.findOrCreateGoogleUser(payload, deviceId);
  }

  /*==============================================
   * Apple Oauth
   *=============================================*/

  @Post('/oauth/apple')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apple oauth' })
  @ApiOkResponse({
    description: 'Apple Oauth',
  })
  async appleOauth(
    @Body() payload: AppleUserPayload,
    @DeviceId() deviceId: string,
  ) {
    return await this.authService.findOrCreateAppleUser(payload, deviceId);
  }
}
