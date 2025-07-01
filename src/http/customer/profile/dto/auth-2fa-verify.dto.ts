import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({ example: '840651' })
  @IsString({ message: 'Code is invalid.' })
  @IsNotEmpty({ message: 'Code is is required.' })
  @MinLength(6, { message: 'Code is too short.' })
  code: string;
}
