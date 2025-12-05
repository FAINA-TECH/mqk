// src/kitchen/dto/create-kitchen.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateKitchenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the kitchen',
    example: 'Kayole Community Kitchen',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Location of the kitchen',
    example: 'Kayole, Nairobi',
  })
  location: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'National ID of the worker assigned to this kitchen (optional)',
    example: '12345678',
    required: false,
  })
  workerNationalId?: string;
}
