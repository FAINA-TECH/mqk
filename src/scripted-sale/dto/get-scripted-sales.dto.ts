// src/scripted-sale/dto/get-scripted-sales.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString } from 'class-validator';

export class GetScriptedSalesDto {
  @ApiProperty({ example: '3d9b0421-58ac-4a1d-855a-1998a7438a4f' })
  @IsString()
  kitchenId: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  endDate: string;
}
