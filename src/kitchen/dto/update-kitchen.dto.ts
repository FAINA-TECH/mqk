// src/kitchen/dto/update-kitchen.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateKitchenDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Name of the kitchen',
    example: 'Kayole Community Kitchen',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Location of the kitchen',
    example: 'Kayole, Nairobi',
    required: false,
  })
  location?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'National ID of the worker assigned to this kitchen',
    example: '12345678',
    required: false,
  })
  workerNationalId?: string;
}