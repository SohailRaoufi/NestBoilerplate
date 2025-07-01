import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleUserPayload {
  @ApiProperty({
    example: 'token',
  })
  @IsNotEmpty({ message: 'token should not be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string;
}

export class AppleUserPayload {
  @ApiProperty({
    example: 'token',
  })
  @IsNotEmpty({ message: 'token should not be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string;
}