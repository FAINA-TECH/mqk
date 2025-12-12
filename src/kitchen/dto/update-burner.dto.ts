// src/kitchen/dto/update-burner.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateBurnerDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Name of the burner',
    example: 'Burner 1',
    required: false,
  })
  name?: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  @ApiProperty({
    description: 'Physical position (1-4)',
    example: 1,
    required: false,
  })
  position?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether the burner is currently active',
    example: false,
    required: false,
  })
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Rate per hour in KSH',
    example: 30.0,
    required: false,
  })
  hourlyRate?: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Rate for less than an hour in KSH',
    example: 20.0,
    required: false,
  })
  partialRate?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether the burner is connected to PAYGO system',
    example: false,
    required: false,
  })
  isConnectedToPaygo?: boolean;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'ID of the stove this burner belongs to',
    example: 'stove-uuid-123',
    required: false,
  })
  stoveId?: string;
}