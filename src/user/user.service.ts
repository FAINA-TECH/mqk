// src/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<User> {
    const { nationalId, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { nationalId },
      relations: ['kitchens'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['kitchens'],
    });
  }

  async findOne(nationalId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { nationalId },
      relations: ['kitchens'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${nationalId} not found`);
    }

    return user;
  }

  async update(nationalId: string, updateUserDto: any): Promise<User> {
    const user = await this.findOne(nationalId);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(user.id, updateUserDto);
    return this.findOne(nationalId);
  }

  async remove(nationalId: string): Promise<void> {
    const user = await this.findOne(nationalId);
    await this.userRepository.remove(user);
  }
}
