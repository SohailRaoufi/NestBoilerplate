import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TokenResponseDto {
  @ApiProperty({
    example: 'token',
  })
  @IsNotEmpty({ message: 'token should not be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string;
}