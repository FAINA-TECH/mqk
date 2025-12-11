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

    // Find the burner with relations for logging context
    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
      relations: ['stove', 'stove.kitchen'],
    });

    if (!burner) {
      throw new NotFoundException(`Burner with ID ${burnerId} not found`);
    }

    const currentTimerState =
      await this.timerStateService.getTimerState(burnerId);

    if (currentTimerState.isActive && currentTimerState.remainingTime > 0) {
      throw new ConflictException(
        `Cannot create sale: ${burner.name} (Stove: ${burner.stove?.name}) is already active.`,
      );
    }

    burner.isActive = true;
    await this.burnerRepository.save(burner);

    let amount: number;
    if (providedAmount !== undefined) {
      amount = providedAmount;
    } else {
      const hours = Math.floor(rest.durationMinutes / 60);
      const remainingMinutes = rest.durationMinutes % 60;
      amount = 0;
      if (hours > 0) amount += hours * burner.hourlyRate;
      if (remainingMinutes > 0) amount += burner.partialRate;
    }

    const transaction = this.saleTransactionRepository.create({
      ...rest,
      burner,
      amount,
    });

    return this.saleTransactionRepository.save(transaction);
  }

  async findAll(): Promise<SaleTransaction[]> {
    return this.saleTransactionRepository.find({
      relations: ['burner', 'burner.stove', 'burner.stove.kitchen'],
    });
  }

  async findOne(id: string): Promise<SaleTransaction> {
    const transaction = await this.saleTransactionRepository.findOne({
      where: { transactionId: id },
      relations: ['burner', 'burner.stove', 'burner.stove.kitchen'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async deactivateBurner(burnerId: string): Promise<void> {
    try {
      const burner = await this.burnerRepository.findOne({
        where: { id: burnerId },
      });

      if (burner) {
        burner.isActive = false;
        await this.burnerRepository.save(burner);
        console.log(`Burner ${burnerId} deactivated`);
      }
    } catch (error) {
      console.error(`Error deactivating burner ${burnerId}:`, error);
    }
  }

  cancelDeactivation(burnerId: string): void {
    const timer = this.activeTimers.get(burnerId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(burnerId);
      console.log(`Cancelled deactivation schedule for burner ${burnerId}`);
    }
  }

  async hasActiveTimer(burnerId: string): Promise<boolean> {
    const timerState = await this.timerStateService.getTimerState(burnerId);
    return timerState.isActive && timerState.remainingTime > 0;
  }
}