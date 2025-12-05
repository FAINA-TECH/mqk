import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../entities/sale-transaction.entity';

export class CreateSaleTransactionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the burner used',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  burnerId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Phone number of the customer',
    example: '+254712345678',
  })
  phone: string;

  @IsNumber()
  @ApiProperty({
    description: 'Duration in minutes',
    example: 45,
  })
  durationMinutes: number;

  @IsEnum(PaymentMethod)
  @ApiProperty({
    description: 'Method of payment',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description:
      'Amount charged in KSH (optional - will be calculated if not provided)',
    example: 20.0,
    required: false,
  })
  amount?: number;

  // ✅ NEW: Add user identification fields
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Session ID of the user creating the sale',
    example: 'session_123456789',
    required: false,
  })
  sessionId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User identifier (phone, email, or unique ID)',
    example: '+254700000000',
    required: false,
  })
  userIdentifier?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Name of the user creating the sale',
    example: 'John Doe',
    required: false,
  })
  createdByName?: string;
}
