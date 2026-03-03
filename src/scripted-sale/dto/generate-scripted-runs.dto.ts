// src/scripted-sale/dto/generate-scripted-runs.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateScriptedRunsDto {
  @ApiProperty({
    description: 'Kitchen ID',
    example: '3d9b0421-58ac-4a1d-855a-1998a7438a4f',
  })
  @IsString()
  kitchenId: string;

  @ApiPropertyOptional({
    description: 'Year (required if not using specificDate)',
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: 'Month 1-12 (required if not using specificDate)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description:
      'Generate for a single specific date (YYYY-MM-DD). Overrides year/month.',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString()
  specificDate?: string;
}
