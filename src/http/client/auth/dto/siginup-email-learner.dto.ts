import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';

import { ValidatePersonalInfoDto } from './validate-personal-info.dto';

export class SignUpEmailLearnerDto extends IntersectionType(
  ValidatePersonalInfoDto,
) {
  @ApiProperty({
    example: 'New York, 2t street',
    description: 'Street address of the learner',
  })
  @IsString({ message: 'street must be a string' })
  @IsNotEmpty({ message: 'street must not be empty' })
  street?: string;
}
