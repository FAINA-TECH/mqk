/* eslint-disable @typescript-eslint/no-unused-vars */
// src/kitchen/kitchen.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kitchen } from './entities/kitchen.entity';
import { Burner } from './entities/burner.entity';
import { CreateKitchenDto } from './dto/create-kitchen.dto';
import { CreateBurnerDto } from './dto/create-burner.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(Kitchen)
    private kitchenRepository: Repository<Kitchen>,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    private userService: UserService,
  ) {}

  async createKitchen(createKitchenDto: CreateKitchenDto): Promise<Kitchen> {
    const { workerNationalId, ...kitchenData } = createKitchenDto;

    const newKitchen = this.kitchenRepository.create(kitchenData);

    // Only assign worker if provided
    if (workerNationalId) {
      const worker = await this.userService.findOne(workerNationalId);
      newKitchen.worker = worker;
    }

    return this.kitchenRepository.save(newKitchen);
  }

  // assign or remove a worker
  async assignWorker(
    kitchenId: string,
    workerNationalId: string | null,
  ): Promise<Kitchen> {
    const kitchen = await this.findKitchenById(kitchenId);

    if (workerNationalId === null) {
      // Remove worker assignment
      kitchen.worker = null;
    } else {
      // Assign new worker
      const worker = await this.userService.findOne(workerNationalId);
      kitchen.worker = worker;
    }

    return this.kitchenRepository.save(kitchen);
  }

  async createBurner(createBurnerDto: CreateBurnerDto): Promise<Burner> {
    const { kitchenId, ...burnerData } = createBurnerDto;

    // Find the kitchen
    const kitchen = await this.findKitchenById(kitchenId);

    const newBurner = this.burnerRepository.create({
      ...burnerData,
      kitchen,
    });

    return this.burnerRepository.save(newBurner);
  }

  async findAllKitchens(): Promise<Kitchen[]> {
    return this.kitchenRepository.find({
      relations: ['worker', 'burners'],
    });
  }

  async findKitchensByWorker(nationalId: string): Promise<Kitchen[]> {
    return this.kitchenRepository.find({
      where: { worker: { nationalId } },
      relations: ['burners'],
    });
  }

  async findKitchenById(id: string): Promise<Kitchen> {
    const kitchen = await this.kitchenRepository.findOne({
      where: { id },
      relations: ['worker', 'burners'],
    });

    if (!kitchen) {
      throw new NotFoundException(`Kitchen with ID ${id} not found`);
    }

    return kitchen;
  }

  async findBurnerById(id: string): Promise<Burner> {
    const burner = await this.burnerRepository.findOne({
      where: { id },
      relations: ['kitchen'],
    });

    if (!burner) {
      throw new NotFoundException(`Burner with ID ${id} not found`);
    }

    return burner;
  }

  async findBurnersByKitchenId(kitchenId: string): Promise<Burner[]> {
    const kitchen = await this.findKitchenById(kitchenId);
    return this.burnerRepository.find({
      where: { kitchen: { id: kitchenId } },
    });
  }

  async updateKitchen(id: string, updateKitchenDto: any): Promise<Kitchen> {
    const kitchen = await this.findKitchenById(id);

    if (updateKitchenDto.workerNationalId) {
      const worker = await this.userService.findOne(
        updateKitchenDto.workerNationalId,
      );
      await this.kitchenRepository.update(id, { worker });
      delete updateKitchenDto.workerNationalId;
    }

    if (Object.keys(updateKitchenDto).length > 0) {
      await this.kitchenRepository.update(id, updateKitchenDto);
    }

    return this.findKitchenById(id);
  }

  async updateBurner(id: string, updateBurnerDto: any): Promise<Burner> {
    const burner = await this.findBurnerById(id);

    if (updateBurnerDto.kitchenId) {
      const kitchen = await this.findKitchenById(updateBurnerDto.kitchenId);
      await this.burnerRepository.update(id, { kitchen });
      delete updateBurnerDto.kitchenId;
    }

    if (Object.keys(updateBurnerDto).length > 0) {
      await this.burnerRepository.update(id, updateBurnerDto);
    }

    return this.findBurnerById(id);
  }

  async removeKitchen(id: string): Promise<void> {
    const kitchen = await this.findKitchenById(id);
    await this.kitchenRepository.remove(kitchen);
  }

  async removeBurner(id: string): Promise<void> {
    const burner = await this.findBurnerById(id);
    await this.burnerRepository.remove(burner);
  }
}
