// src/kitchen/kitchen.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kitchen } from './entities/kitchen.entity';
import { Stove } from './entities/stove.entity';
import { Burner } from './entities/burner.entity';
import { CreateKitchenDto } from './dto/create-kitchen.dto';
import { UpdateKitchenDto } from './dto/update-kitchen.dto';
import { CreateStoveDto } from './dto/create-stove.dto';
import { UpdateStoveDto } from './dto/update-stove.dto';
import { CreateBurnerDto } from './dto/create-burner.dto';
import { UpdateBurnerDto } from './dto/update-burner.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(Kitchen)
    private kitchenRepository: Repository<Kitchen>,
    @InjectRepository(Stove)
    private stoveRepository: Repository<Stove>,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    private userService: UserService,
  ) {}

  // --- KITCHEN METHODS ---

  async createKitchen(createKitchenDto: CreateKitchenDto): Promise<Kitchen> {
    const { workerNationalId, ...kitchenData } = createKitchenDto;
    const newKitchen = this.kitchenRepository.create(kitchenData);

    if (workerNationalId) {
      const worker = await this.userService.findOne(workerNationalId);
      newKitchen.worker = worker;
    }

    return this.kitchenRepository.save(newKitchen);
  }

  async findAllKitchens(): Promise<Kitchen[]> {
    return this.kitchenRepository.find({
      relations: ['worker', 'stoves', 'stoves.burners'],
    });
  }

  async findKitchenById(id: string): Promise<Kitchen> {
    const kitchen = await this.kitchenRepository.findOne({
      where: { id },
      relations: ['worker', 'stoves', 'stoves.burners'],
    });

    if (!kitchen) {
      throw new NotFoundException(`Kitchen with ID ${id} not found`);
    }
    return kitchen;
  }

  async findKitchensByWorker(nationalId: string): Promise<Kitchen[]> {
    return this.kitchenRepository.find({
      where: { worker: { nationalId } },
      relations: ['stoves', 'stoves.burners'],
    });
  }

  async assignWorker(
    kitchenId: string,
    workerNationalId: string | null,
  ): Promise<Kitchen> {
    const kitchen = await this.findKitchenById(kitchenId);

    if (workerNationalId === null) {
      kitchen.worker = null;
    } else {
      const worker = await this.userService.findOne(workerNationalId);
      kitchen.worker = worker;
    }

    return this.kitchenRepository.save(kitchen);
  }

  async updateKitchen(
    id: string,
    updateKitchenDto: UpdateKitchenDto,
  ): Promise<Kitchen> {
    const kitchen = await this.findKitchenById(id);
    
    if (updateKitchenDto.workerNationalId !== undefined) {
      if (updateKitchenDto.workerNationalId === null) {
        kitchen.worker = null;
      } else {
        const worker = await this.userService.findOne(
          updateKitchenDto.workerNationalId,
        );
        kitchen.worker = worker;
      }
      delete updateKitchenDto.workerNationalId;
    }
    
    Object.assign(kitchen, updateKitchenDto);
    return this.kitchenRepository.save(kitchen);
  }

  async removeKitchen(id: string): Promise<void> {
    const kitchen = await this.findKitchenById(id);
    await this.kitchenRepository.remove(kitchen);
  }

  // --- STOVE METHODS ---

  async createStove(createStoveDto: CreateStoveDto): Promise<Stove> {
    const { kitchenId, ...stoveData } = createStoveDto;

    const kitchen = await this.findKitchenById(kitchenId);

    // Check if stove ID already exists
    const existingStove = await this.stoveRepository.findOne({
      where: { stoveId: stoveData.stoveId },
    });
    if (existingStove) {
      throw new ConflictException(
        `Stove ID ${stoveData.stoveId} already exists`,
      );
    }

    const newStove = this.stoveRepository.create({
      ...stoveData,
      kitchen,
    });

    return this.stoveRepository.save(newStove);
  }

  async findAllStoves(): Promise<Stove[]> {
    return this.stoveRepository.find({
      relations: ['kitchen', 'burners'],
    });
  }

  async findStoveById(id: string): Promise<Stove> {
    const stove = await this.stoveRepository.findOne({
      where: { id },
      relations: ['kitchen', 'burners'],
    });
    if (!stove) {
      throw new NotFoundException(`Stove with ID ${id} not found`);
    }
    return stove;
  }

  async updateStove(id: string, updateStoveDto: UpdateStoveDto): Promise<Stove> {
    const stove = await this.findStoveById(id);

    // Check if updating stoveId and if it already exists
    if (updateStoveDto.stoveId && updateStoveDto.stoveId !== stove.stoveId) {
      const existingStove = await this.stoveRepository.findOne({
        where: { stoveId: updateStoveDto.stoveId },
      });
      if (existingStove) {
        throw new ConflictException(
          `Stove ID ${updateStoveDto.stoveId} already exists`,
        );
      }
    }

    if (updateStoveDto.kitchenId) {
      const kitchen = await this.findKitchenById(updateStoveDto.kitchenId);
      stove.kitchen = kitchen;
      delete updateStoveDto.kitchenId;
    }

    Object.assign(stove, updateStoveDto);
    return this.stoveRepository.save(stove);
  }

  async removeStove(id: string): Promise<void> {
    const stove = await this.findStoveById(id);
    await this.stoveRepository.remove(stove);
  }

  // --- BURNER METHODS ---

  async createBurner(createBurnerDto: CreateBurnerDto): Promise<Burner> {
    const { stoveId, ...burnerData } = createBurnerDto;

    const stove = await this.findStoveById(stoveId);

    // Validate position limit
    const existingBurner = await this.burnerRepository.findOne({
      where: { stove: { id: stoveId }, position: burnerData.position },
    });

    if (existingBurner) {
      throw new ConflictException(
        `Burner position ${burnerData.position} is already taken on this stove.`,
      );
    }

    const newBurner = this.burnerRepository.create({
      ...burnerData,
      stove,
    });

    return this.burnerRepository.save(newBurner);
  }

  async findAllBurners(): Promise<Burner[]> {
    return this.burnerRepository.find({
      relations: ['stove', 'stove.kitchen'],
    });
  }

  async findBurnerById(id: string): Promise<Burner> {
    const burner = await this.burnerRepository.findOne({
      where: { id },
      relations: ['stove', 'stove.kitchen'],
    });

    if (!burner) {
      throw new NotFoundException(`Burner with ID ${id} not found`);
    }

    return burner;
  }

  async updateBurner(
    id: string,
    updateBurnerDto: UpdateBurnerDto,
  ): Promise<Burner> {
    const burner = await this.findBurnerById(id);

    // Check if position is being updated and if it conflicts
    if (
      updateBurnerDto.position &&
      updateBurnerDto.position !== burner.position
    ) {
      const existingBurner = await this.burnerRepository.findOne({
        where: {
          stove: { id: burner.stove.id },
          position: updateBurnerDto.position,
        },
      });

      if (existingBurner) {
        throw new ConflictException(
          `Burner position ${updateBurnerDto.position} is already taken on this stove.`,
        );
      }
    }

    if (updateBurnerDto.stoveId) {
      const stove = await this.findStoveById(updateBurnerDto.stoveId);
      burner.stove = stove;
      delete updateBurnerDto.stoveId;
    }

    Object.assign(burner, updateBurnerDto);
    return this.burnerRepository.save(burner);
  }

  async removeBurner(id: string): Promise<void> {
    const burner = await this.findBurnerById(id);
    await this.burnerRepository.remove(burner);
  }
}