import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EmailSignInDto {
  @ApiProperty({ example: 'ahmad@gmail.com' })
  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'securePassword' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @ApiProperty({ example: 'Secure password' })
  @IsString({ message: 'Two factor authentication code is invalid.' })
  @IsOptional()
  twoFaCode: string;
}
