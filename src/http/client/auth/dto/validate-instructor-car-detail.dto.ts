import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateInstructorCarDetailDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString({ message: 'Car model must be a string' })
  @IsNotEmpty({ message: 'Car model is required' })
  carModel: string;

  @ApiProperty({ example: '1234567890' })
  @IsString({ message: 'Car plate number must be a string' })
  @IsNotEmpty({ message: 'Car plate number is required' })
  carPlateNumber: string;

  @ApiProperty({ example: '1234567890' })
  @IsString({ message: 'Car insurance number must be a string' })
  @IsNotEmpty({ message: 'Car insurance number is required' })
  carInsuranceNumber: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  carPhotos: Array<Express.Multer.File>;
}
