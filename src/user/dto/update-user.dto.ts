import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Password for authentication',
    example: 'password123',
    required: false,
  })
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.WORKER,
    required: false,
  })
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  @ApiProperty({
    description: 'Status of the user account',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  status?: UserStatus;
}
