import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';
import {
  Controller,
  UseGuards,
  Body,
  Post,
  HttpStatus,
  Patch,
  HttpCode,
  Delete,
} from '@nestjs/common';

import { User } from '@/entities/user/user.entity';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { Verify2faDto } from './dto/auth-2fa-verify.dto';
import { ProfileService } from './profile.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ToggleNotificationDto } from './dto/toggle-notification.dto';
import { UserJwtGuard } from '@/common/guards/user.guard';

@ApiTags('Customer - Profile')
@ApiBearerAuth()
@UseGuards(UserJwtGuard)
@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /*==============================================
   * Update User Password
   *=============================================*/

  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change Password' })
  @ApiNoContentResponse({
    description: 'Password changed successfully',
  })
  async updatePassword(
    @CurrentUser() user: User,
    @Body() payload: UpdatePasswordDto,
  ) {
    await this.profileService.updatePassword(user, payload);
  }

  /*==============================================
   * Enable 2FA
   *=============================================*/

  @Patch('/enable-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2fa.' })
  @ApiOkResponse({ description: 'Successfully returned qrCode.' })
  async enableTwoFactorAuthentication(@CurrentUser() user: User) {
    return await this.profileService.generateTwoFactorAuthenticationSecret(
      user,
    );
  }

  /*==============================================
   * Disable 2FA
   *=============================================*/

  @Patch('/disable-2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disables 2fa.' })
  @ApiNoContentResponse({
    description: 'Successfully disabled two factor authentication.',
  })
  async disableTwoFactorAuthentication(@CurrentUser() user: User) {
    await this.profileService.disableTwoFactorAuthentication(user);
  }

  /*==============================================
   * Verify 2FA
   *=============================================*/

  @Post('/verify-2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verifies two factor authentication code.' })
  @ApiNoContentResponse({
    description: 'Successfully verified two factor authentication code.',
  })
  async verify2faAuth(
    @CurrentUser() user: User,
    @Body() payload: Verify2faDto,
  ) {
    await this.profileService.verify2faAuth(user, payload);
  }

  /*==============================================
   * Toggle Notification
   *=============================================*/

  @Patch('/toggle-notification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Toggle notification settings for user.' })
  @ApiNoContentResponse({
    description: 'Successfully toggled user notification settings.',
  })
  async toggleNotification(
    @CurrentUser() user: User,
    @Body() payload: ToggleNotificationDto,
  ) {
    await this.profileService.toggleNotification(user, payload);
  }

  /*==============================================
   * Delete Account
   *=============================================*/

  @Delete('/account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'User Deleted Successfully' })
  @ApiNoContentResponse({
    description: 'Successfully Deleted User.',
  })
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.profileService.deleteAccount(userId);
  }
}
