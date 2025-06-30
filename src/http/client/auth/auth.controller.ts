import 'dotenv/config';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiConsumes,
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
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';

import { User } from '@/entities/user/user.entity';
import { DeviceId } from '@/common/decorators/device-id.decorator';
import { FileValidationPipe } from '@/common/pipes/file-validation.pipe';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { AuthService } from './auth.service';
import { EmailSignInDto } from './dto/email-signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { EmailVerifyOtpDto } from './dto/email-verfiy-otp.dto';
import { EmailResendOtpDto } from './dto/email-resend-otp.dto';
import { AppleUserPayload, GoogleUserPayload } from './dto/oauth.dto';
import { SignUpEmailLearnerDto } from './dto/siginup-email-learner.dto';
import { ValidatePersonalInfoDto } from './dto/validate-personal-info.dto';
import { SignUpEmailInstructorDto } from './dto/signup-email-instructor.dto';
import { ValidateInstructorLicenseDto } from './dto/validate-instructor-license.dto';
import { ValidateInstructorCarDetailDto } from './dto/validate-instructor-car-detail.dto';
import { UserJwtGuard } from '@/common/guards/user.guard';

@ApiTags('Client - Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*==============================================
   * Validate Instructor Personal Info
   *=============================================*/

  @Post('/validate/instructor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Validate Instructor Personal Info' })
  @ApiNoContentResponse({
    description: 'Instructor personal info validated successfully',
  })
  async validateInstructorPersonalInfo(
    @Body() payload: ValidatePersonalInfoDto,
  ) {
    await this.authService.validateUserPersonalInfo(payload);
  }

  /*==============================================
   * Validate Instructor Car Detail
   *=============================================*/

  @Post('/validate/instructor-car-detail')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Validate Instructor Car Detail' })
  @ApiNoContentResponse({
    description: 'Instructor car detail validated successfully',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('carPhotos', 10))
  async validateInstructorCarDetail(
    @Body() payload: ValidateInstructorCarDetailDto,
    @UploadedFiles(
      new FileValidationPipe('images', { minCount: 3, required: true }),
    )
    carPhotos: Array<Express.Multer.File>,
  ) {
    await this.authService.validateInstructorCarDetail(payload, carPhotos);
  }

  /*==============================================
   * Validate Instructor License
   *=============================================*/

  @Post('/validate/instructor-license')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Validate Instructor License Detail' })
  @ApiNoContentResponse({
    description: 'Instructor license detail validated successfully',
  })
  @UseInterceptors(FileInterceptor('licenseFile'))
  async validateInstructorLicense(
    @Body() payload: ValidateInstructorLicenseDto,
    @UploadedFile(new FileValidationPipe(['documents', 'images']))
    licenseFile: Express.Multer.File,
  ) {
    await this.authService.validateInstructorLicense(payload, licenseFile);
  }

  /*==============================================
   * Register New Instructor
   *=============================================*/

  @Post('/register/instructor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register New Instructor' })
  @ApiNoContentResponse({
    description: 'Instructor registered successfully',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'carPhotos', maxCount: 10 },
      { name: 'licenseFile' },
    ]),
  )
  async registerInstructor(
    @Body() payload: SignUpEmailInstructorDto,
    @UploadedFiles()
    files: {
      carPhotos: Array<Express.Multer.File>;
      licenseFile: Express.Multer.File;
    },
  ) {
    const { carPhotos, licenseFile: licenseFile } = files;
    // validdate car photos
    await new FileValidationPipe('images', {
      minCount: 3,
      required: true,
    }).transform(carPhotos, null);

    //Apply file validation on licenseFile
    await new FileValidationPipe(['documents', 'images']).transform(
      licenseFile[0],
      null,
    );

    return await this.authService.registerInstructor(
      payload,
      carPhotos,
      licenseFile[0],
    );
  }

  /*==============================================
   * Register New Learner
   *=============================================*/
  @Post('/register/learner')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register New Learner' })
  @ApiNoContentResponse({
    description: 'Learner registered successfully',
  })
  async registerLearner(@Body() payload: SignUpEmailLearnerDto) {
    return await this.authService.registerLearner(payload);
  }

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
  async resendOtp(@Body() payload: EmailResendOtpDto) {
    await this.authService.sendEmailOtp(payload.email);
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
