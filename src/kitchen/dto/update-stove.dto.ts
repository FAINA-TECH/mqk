// src/kitchen/dto/update-stove.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStoveDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Hardware ID of the stove (e.g., mega_10009)',
    example: 'mega_10009',
    required: false,
  })
  stoveId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Friendly name for the stove',
    example: 'Stove A',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'ID of the kitchen this stove belongs to',
    example: 'kitchen-uuid-123',
    required: false,
  })
  kitchenId?: string;
}