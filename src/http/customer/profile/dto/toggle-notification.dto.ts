import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleNotificationDto {
  @ApiProperty({
    description: 'Whether to enable or disable notifications',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;
}
