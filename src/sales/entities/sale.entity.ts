// src/sales/entities/sale.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  salesId: string;

  @Column({ nullable: false })
  @ApiProperty({
    description: 'The kitchen running',
    type: String,
    example: 'Kayole',
  })
  kitchen: string;

  @Column({ nullable: false })
  @ApiProperty({
    description: 'The burner which is on',
    type: String,
    example: '1',
  })
  burner: string;

  @Column({ nullable: false })
  @ApiProperty({
    description: 'The phone number',
    type: String,
    example: '0790566616',
  })
  phone: string;

  @Column({ nullable: false })
  @ApiProperty({
    description: 'The amount payable in Shillings',
    type: String,
    example: '40',
  })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
