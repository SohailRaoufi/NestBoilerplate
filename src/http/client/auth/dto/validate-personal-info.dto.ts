import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  IsOptional,
  IsISO8601,
} from 'class-validator';

import { UserGenderTypes } from '@/common/enums/user-gender-types.enum';
import { IsValidDateOfBirth } from '@/common/validators/is-valid-date-of-birth.validator';

export class ValidatePersonalInfoDto {
  @ApiProperty({ example: 'ahmad' })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @ApiProperty({ example: 'ahmad@gmail.com' })
  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: '+12505550199' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @IsPhoneNumber('CA', { message: 'Invalid Canadian phone number' })
  phoneNumber: string;

  @ApiProperty({ example: 'Password@123' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @IsStrongPassword(
    {
      minLength: 8,
      minSymbols: 1,
      minNumbers: 1,
      minUppercase: 1,
      minLowercase: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsValidDateOfBirth({ minAge: 16 })
  @IsISO8601({}, { message: 'Invalid date of birth' })
  dateOfBirth: Date;

  @ApiProperty({ example: UserGenderTypes.MALE, enum: UserGenderTypes })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsString({ message: 'Gender must be a string' })
  gender: UserGenderTypes;
}
