// src/user/entities/user.entity.ts
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Kitchen } from '../../kitchen/entities/kitchen.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  WORKER = 'worker',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Auto-generated unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column({ nullable: true, unique: true })
  @ApiProperty({
    description: 'National ID number',
    example: '12345678',
  })
  nationalId: string;

  @Column({ nullable: true, default: 'Unnamed User' })
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @Column({ nullable: true, default: 'password123' })
  @ApiProperty({
    description: 'Password for authentication',
    example: 'password123',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WORKER,
  })
  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.WORKER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @ApiProperty({
    description: 'Status of the user account',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @OneToMany(() => Kitchen, (kitchen) => kitchen.worker)
  kitchens: Kitchen[];
}
