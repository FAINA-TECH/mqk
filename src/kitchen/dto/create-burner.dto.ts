// src/kitchen/dto/create-burner.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBurnerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name or number of the burner',
    example: 'Burner 1',
  })
  name: string;

  @IsNumber()
  @ApiProperty({
    description: 'Rate per hour in KSH',
    example: 30.0,
  })
  hourlyRate: number;

  @IsNumber()
  @ApiProperty({
    description: 'Rate for less than an hour in KSH',
    example: 20.0,
  })
  partialRate: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether the burner is connected to PAYGO system',
    example: false,
    default: false,
  })
  isConnectedToPaygo?: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the kitchen this burner belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  kitchenId: string;
}
