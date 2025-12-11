import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBurnerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Name of the burner',
    example: 'Burner 1',
  })
  name: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @ApiProperty({
    description: 'Physical position (1-4)',
    example: 1,
  })
  position: number;

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
    description: 'ID of the stove this burner belongs to',
    example: 'stove-uuid-123',
  })
  stoveId: string;
}