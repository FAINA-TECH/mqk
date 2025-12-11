import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Stove } from './stove.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Burner {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique ID for the burner',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column()
  @ApiProperty({
    description: 'Name or number of the burner',
    example: 'Burner 1',
  })
  name: string;

  @Column({ type: 'int', default: 1 })
  @ApiProperty({
    description: 'Physical position on the stove (1, 2, 3, or 4)',
    example: 1,
  })
  position: number;

  @Column({ default: false })
  @ApiProperty({
    description: 'Whether the burner is currently active',
    example: false,
  })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({
    description: 'Rate per hour in KSH',
    example: 30.0,
  })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({
    description: 'Rate for less than an hour in KSH',
    example: 20.0,
  })
  partialRate: number;

  @Column({ default: false })
  @ApiProperty({
    description: 'Whether the burner is connected to PAYGO system',
    example: false,
  })
  isConnectedToPaygo: boolean;

  @ManyToOne(() => Stove, (stove) => stove.burners, { onDelete: 'CASCADE' })
  stove: Stove;
}