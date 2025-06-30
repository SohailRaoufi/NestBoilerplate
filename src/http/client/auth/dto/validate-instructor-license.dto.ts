import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

import { IsPastDate, IsDateFuture } from '@/common/validators';
import { UserLicenseTypes } from '@/common/enums/user-license-types.enum';

export class ValidateInstructorLicenseDto {
  @ApiProperty({
    example: UserLicenseTypes.DRIVING_LICENSE,
    enum: UserLicenseTypes,
  })
  @IsEnum(UserLicenseTypes)
  @IsNotEmpty({ message: 'License type is required' })
  licenseType: UserLicenseTypes;

  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty({ message: 'License number is required' })
  @IsString({ message: 'License number must be a string' })
  licenseNumber: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsNotEmpty({ message: 'License expiry date is required' })
  @IsISO8601({}, { message: 'Invalid expiry date' })
  @IsDateFuture({ message: 'License is Expired' })
  licenseExpiryDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsNotEmpty({ message: 'License issued date is required' })
  @IsISO8601({}, { message: 'Invalid issue date' })
  @IsPastDate({ message: 'Invalid Issue Date' })
  licenseIssueDate: string;

  @ApiProperty({ example: 'license.pdf', type: 'string', format: 'binary' })
  licenseFile: Express.Multer.File;
}
