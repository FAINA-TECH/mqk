import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Burner } from '../../kitchen/entities/burner.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
}

@Entity()
export class SaleTransaction {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique ID for the sale transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  transactionId: string;

  @ManyToOne(() => Burner)
  burner: Burner;

  @Column()
  @ApiProperty({
    description: 'Phone number of the customer',
    example: '+254712345678',
  })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({
    description: 'Duration in minutes',
    example: 45,
  })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({
    description: 'Amount charged in KSH',
    example: 20.0,
  })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @ApiProperty({
    description: 'Method of payment',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  // ✅ NEW: Add ownership tracking fields
  @Column({ nullable: true })
  @ApiProperty({
    description: 'Session ID of the user who created this sale',
    example: 'session_123456789',
    required: false,
  })
  createdBySessionId?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'User identifier of the person who created this sale',
    example: '+254700000000',
    required: false,
  })
  createdByUserId?: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Name of the user who created this sale',
    example: 'John Doe',
    required: false,
  })
  createdByName?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
