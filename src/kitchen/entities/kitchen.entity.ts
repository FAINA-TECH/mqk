// src/kitchen/entities/kitchen.entity.ts
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Burner } from './burner.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Kitchen {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique ID for the kitchen',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column()
  @ApiProperty({
    description: 'Name of the kitchen',
    example: 'Kayole Community Kitchen',
  })
  name: string;

  @Column()
  @ApiProperty({
    description: 'Location of the kitchen',
    example: 'Kayole, Nairobi',
  })
  location: string;

  @ManyToOne(() => User, (user) => user.kitchens)
  worker: User;

  @OneToMany(() => Burner, (burner) => burner.kitchen, { cascade: true })
  burners: Burner[];
}
