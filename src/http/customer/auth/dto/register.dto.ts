import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEmpty, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'email@example.com',
  })
  @IsNotEmpty({ message: 'email should not be empty' })
  @IsEmail({}, { message: 'Invalid email' })
  email!: string;

  @ApiProperty({
    example: 'password',
  })
  @IsNotEmpty({ message: 'password should not be empty' })
  @IsString({ message: 'password must be a string' })
  password!: string;

  @ApiProperty({
    example: '03001234567',
  })
  @IsNotEmpty({ message: 'phone should not be empty' })
  @IsPhoneNumber("AF")
  phone!: string;

}