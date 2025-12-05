// src/user/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'National ID number',
    example: '12345678',
  })
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Password for authentication',
    example: 'password123',
  })
  password: string;

  @IsEnum(UserRole)
  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.WORKER,
  })
  role: UserRole;

  @IsEnum(UserStatus)
  @ApiProperty({
    description: 'Status of the user account',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;
}
