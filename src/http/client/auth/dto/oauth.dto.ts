import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

import { UserGenderTypes } from '@/common/enums/user-gender-types.enum';
import { IsValidDateOfBirth } from '@/common/validators/is-valid-date-of-birth.validator';

export class GoogleUserPayload {
  @ApiProperty({
    example: 'token',
  })
  @IsNotEmpty({ message: 'token should not be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string;

  @ApiProperty({ example: '+12505550199' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @IsPhoneNumber('CA', { message: 'Invalid Canadian phone number' })
  phoneNumber: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsOptional()
  @IsValidDateOfBirth({ minAge: 16 })
  @IsISO8601({}, { message: 'Invalid date of birth' })
  dateOfBirth: Date;

  @ApiProperty({ example: UserGenderTypes.MALE, enum: UserGenderTypes })
  @IsOptional()
  @IsString({ message: 'Gender must be a string' })
  gender: UserGenderTypes;
}

export class AppleUserPayload {
  @ApiProperty({
    example: 'token',
  })
  @IsNotEmpty({ message: 'token should not be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string;

  @ApiProperty({ example: 'ahmad' })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @ApiProperty({ example: '+12505550199' })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @IsPhoneNumber('CA', { message: 'Invalid Canadian phone number' })
  phoneNumber: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsOptional()
  @IsValidDateOfBirth({ minAge: 16 })
  @IsISO8601({}, { message: 'Invalid date of birth' })
  dateOfBirth: Date;

  @ApiProperty({ example: UserGenderTypes.MALE, enum: UserGenderTypes })
  @IsOptional()
  @IsString({ message: 'Gender must be a string' })
  gender: UserGenderTypes;
}
