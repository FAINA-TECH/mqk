// src/scripted-sale/entities/scripted-sale-transaction.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Burner } from '../../kitchen/entities/burner.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ScriptedPaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
}

@Entity()
export class ScriptedSaleTransaction {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique ID', example: '123e4567-...' })
  id: string;

  @ManyToOne(() => Burner, { eager: false, onDelete: 'CASCADE' })
  burner: Burner;

  @Column()
  @ApiProperty({ description: 'Kitchen ID this sale belongs to' })
  kitchenId: string;

  @Column()
  @ApiProperty({ description: 'Phone number of the attendant' })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ description: 'Duration in minutes', example: 60 })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ description: 'Amount charged in KSH', example: 30 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ScriptedPaymentMethod,
    default: ScriptedPaymentMethod.CASH,
  })
  @ApiProperty({ enum: ScriptedPaymentMethod })
  paymentMethod: ScriptedPaymentMethod;

  @Column({ default: 'S' })
  @ApiProperty({ description: 'S = Scripted/Simulated' })
  runtype: string;

  @Column({ type: 'timestamp' })
  @ApiProperty({ description: 'The simulated transaction timestamp' })
  transactionDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
