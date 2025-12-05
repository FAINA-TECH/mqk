// src/user/dto/login-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
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
    description: 'Password for authentication',
    example: 'password123',
  })
  password: string;
}
