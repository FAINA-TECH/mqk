// src/sale-transaction/sale-transaction.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleTransaction } from './entities/sale-transaction.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { CreateSaleTransactionDto } from './dto/create-sale-transaction.dto';
import { TimerStateService } from '../timer-state/timer-state.service';

@Injectable()
export class SaleTransactionService {
  // ✅ Store active timers to cancel them if needed
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(SaleTransaction)
    private saleTransactionRepository: Repository<SaleTransaction>,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    private timerStateService: TimerStateService,
  ) {}

  async create(
    createSaleTransactionDto: CreateSaleTransactionDto,
  ): Promise<SaleTransaction> {
    const {
      burnerId,
      amount: providedAmount,
      ...rest
    } = createSaleTransactionDto;

    // Find the burner
    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
    });

    if (!burner) {
      throw new NotFoundException(`Burner with ID ${burnerId} not found`);
    }

    // ✅ NEW: Check if there's already an active timer on this burner
    const currentTimerState =
      await this.timerStateService.getTimerState(burnerId);

    if (currentTimerState.isActive && currentTimerState.remainingTime > 0) {
      throw new ConflictException(
        `Cannot create sale: ${burner.name} already has an active timer with ${Math.ceil(currentTimerState.remainingTime / 60)} minutes remaining. Please wait for the current timer to complete or stop it first.`,
      );
    }

    // Set burner to active
    burner.isActive = true;
    await this.burnerRepository.save(burner);

    // Use provided amount or calculate based on duration and rates
    let amount: number;

    if (providedAmount !== undefined) {
      amount = providedAmount;
    } else {
      const hours = Math.floor(rest.durationMinutes / 60);
      const remainingMinutes = rest.durationMinutes % 60;

      amount = 0;
      if (hours > 0) {
        amount += hours * burner.hourlyRate;
      }
      if (remainingMinutes > 0) {
        amount += burner.partialRate;
      }
    }

    // Create and save the transaction
    const transaction = this.saleTransactionRepository.create({
      ...rest,
      burner,
      amount,
    });

    const savedTransaction =
      await this.saleTransactionRepository.save(transaction);

    console.log(
      `Sale transaction created for ${burner.name} - Timer will be managed by socket/local system`,
    );

    return savedTransaction;
  }

  async findAll(): Promise<SaleTransaction[]> {
    return this.saleTransactionRepository.find({
      relations: ['burner', 'burner.kitchen'],
    });
  }

  async findOne(id: string): Promise<SaleTransaction> {
    const transaction = await this.saleTransactionRepository.findOne({
      where: { transactionId: id },
      relations: ['burner', 'burner.kitchen'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  // ✅ NEW: Deactivate burner (called from socket gateway when timer completes)
  async deactivateBurner(burnerId: string): Promise<void> {
    try {
      const burner = await this.burnerRepository.findOne({
        where: { id: burnerId },
      });

      if (burner) {
        burner.isActive = false;
        await this.burnerRepository.save(burner);
        console.log(`Burner ${burnerId} deactivated by timer completion`);
      }
    } catch (error) {
      console.error(`Error deactivating burner ${burnerId}:`, error);
    }
  }

  // ✅ NEW: Cancel any scheduled deactivation
  cancelDeactivation(burnerId: string): void {
    const timer = this.activeTimers.get(burnerId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(burnerId);
      console.log(`Cancelled deactivation schedule for burner ${burnerId}`);
    }
  }

  // ✅ NEW: Check if burner has active timer
  async hasActiveTimer(burnerId: string): Promise<boolean> {
    const timerState = await this.timerStateService.getTimerState(burnerId);
    return timerState.isActive && timerState.remainingTime > 0;
  }
}
