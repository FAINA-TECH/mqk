import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class GenerateDummyDataDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The kitchen ID to generate data for',
    example: 'uuid-string',
  })
  kitchenId: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  @ApiProperty({
    description: 'Month (1-12)',
    example: 3,
  })
  month: number;

  @IsNumber()
  @Min(2000)
  @ApiProperty({
    description: 'Year',
    example: 2026,
  })
  year: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    description: 'Average daily customers',
    example: 50,
  })
  averageDailyCustomers: number;
}
