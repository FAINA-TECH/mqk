import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Kitchen } from './kitchen.entity';
import { Burner } from './burner.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Stove {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique ID for the stove record',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Hardware ID of the stove (MQTT Topic Identifier)',
    example: 'mega_10009',
  })
  stoveId: string;

  @Column()
  @ApiProperty({
    description: 'A friendly name or label for this stove',
    example: 'Stove A',
  })
  name: string;

  @ManyToOne(() => Kitchen, (kitchen) => kitchen.stoves, { onDelete: 'CASCADE' })
  kitchen: Kitchen;

  @OneToMany(() => Burner, (burner) => burner.stove, { cascade: true })
  burners: Burner[];
}