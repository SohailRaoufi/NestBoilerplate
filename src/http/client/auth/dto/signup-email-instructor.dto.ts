import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsLatLong, IsNotEmpty, IsString } from 'class-validator';

import { ValidatePersonalInfoDto } from './validate-personal-info.dto';
import { ValidateInstructorLicenseDto } from './validate-instructor-license.dto';
import { ValidateInstructorCarDetailDto } from './validate-instructor-car-detail.dto';

export class SignUpEmailInstructorDto extends IntersectionType(
  ValidatePersonalInfoDto,
  ValidateInstructorCarDetailDto,
  ValidateInstructorLicenseDto,
) {
  @ApiProperty({ example: 'Ahmad Ali' })
  @IsNotEmpty({ message: 'Account Name is required' })
  @IsString({ message: 'Account Name must be a string' })
  accountName: string;

  @ApiProperty({ example: 1234567890 })
  @IsNotEmpty({ message: 'Account number is required' })
  @IsString({ message: 'Account number must be a string' })
  accountNumber: string;

  @ApiProperty({ example: 1234567890 })
  @IsNotEmpty({ message: 'Transit number is required' })
  @IsString({ message: 'Transit number must be a string' })
  transitNumber: string;

  @ApiProperty({ example: 1234567890 })
  @IsNotEmpty({ message: 'Institution number is required' })
  @IsString({ message: 'Institution number must be a string' })
  institutionNumber: string;

  @ApiProperty({ example: 'Kabul, Shar ee naw' })
  @IsNotEmpty({ message: 'Street is required' })
  @IsString({ message: 'Street must be a string' })
  street: string;

  @ApiProperty({ example: 'Afghanistan' })
  @IsNotEmpty({ message: 'Country is required' })
  @IsString({ message: 'Country must be a string' })
  country: string;

  @ApiProperty({ example: 'Kabul' })
  @IsNotEmpty({ message: 'City is required' })
  @IsString({ message: 'City must be a string' })
  city: string;

  @ApiProperty({ example: '1001' })
  @IsNotEmpty({ message: 'Postal code is required' })
  @IsString({ message: 'Postal code must be a string' })
  postalCode: string;

  @ApiProperty({ example: '34.5553,69.2075' })
  @IsLatLong({ message: 'Coordinates must be valid latitude,longitude' })
  coordinates: string;
}
