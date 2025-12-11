import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStoveDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Hardware ID of the stove (e.g., mega_10009)',
    example: 'mega_10009',
  })
  stoveId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Friendly name for the stove',
    example: 'Stove A',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the kitchen this stove belongs to',
    example: 'kitchen-uuid-123',
  })
  kitchenId: string;
}