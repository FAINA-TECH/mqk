import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SaleTransaction,
  PaymentMethod,
} from './entities/sale-transaction.entity';
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

  async generateDummyData(
    kitchenId: string,
    month: number, // 1-12
    year: number,
    averageDailyCustomers: number,
  ): Promise<{ count: number; message: string }> {
    const burners = await this.burnerRepository.find({
      where: { stove: { kitchen: { id: kitchenId } } },
      relations: ['stove', 'stove.kitchen', 'stove.kitchen.worker'],
    });

    if (burners.length === 0) {
      throw new NotFoundException(`No burners found for kitchen ${kitchenId}`);
    }

    const kitchen = burners[0].stove.kitchen;
    const worker = kitchen.worker;

    if (!worker || !worker.phone) {
      throw new ConflictException(
        'Kitchen attendant (worker) does not have a phone number configured.',
      );
    }

    const attendantPhone = worker.phone;
    const transactions: SaleTransaction[] = [];

    // Calculate days in month. Date(year, monthIndex + 1, 0).getDate()
    let daysInMonth = new Date(year, month, 0).getDate();

    // If generating for current month, stop at yesterday
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
      daysInMonth = Math.min(daysInMonth, now.getDate() - 1);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      // Operating 6 times a week (Mon-Sat). Skip Sunday (0).
      if (dayOfWeek === 0) continue;

      // Randomize customers around average (±20%)
      const variance = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      const numCustomers = Math.floor(averageDailyCustomers * variance);

      // Weighted hours for meal peaks: Breakfast (6-9), Lunch (11-14), Supper (17-20)
      const timeWeights: number[] = [];
      [6, 7, 8, 9].forEach((h) => timeWeights.push(h, h, h)); // Breakfast
      [10].forEach((h) => timeWeights.push(h)); // Mid-morning
      [11, 12, 13, 14].forEach((h) => timeWeights.push(h, h, h)); // Lunch
      [15, 16].forEach((h) => timeWeights.push(h)); // Afternoon
      [17, 18, 19, 20].forEach((h) => timeWeights.push(h, h, h, h)); // Supper

      for (let i = 0; i < numCustomers; i++) {
        // Pick random burner
        const burner = burners[Math.floor(Math.random() * burners.length)];

        // Random duration: multiples of 30 mins, avg ~60 mins
        // 30m (20%), 60m (50%), 90m (20%), 120m (10%)
        const randDuration = Math.random();
        let durationMinutes = 60;
        if (randDuration < 0.2) durationMinutes = 30;
        else if (randDuration < 0.7) durationMinutes = 60;
        else if (randDuration < 0.9) durationMinutes = 90;
        else durationMinutes = 120;

        // Calculate amount
        let amount = 0;
        const hours = Math.floor(durationMinutes / 60);
        const remainingMinutes = durationMinutes % 60;

        if (hours > 0) amount += hours * burner.hourlyRate;
        if (remainingMinutes > 0) amount += burner.partialRate;

        // Peak times
        const hour =
          timeWeights[Math.floor(Math.random() * timeWeights.length)];
        const minute = Math.floor(Math.random() * 60);

        const transactionDate = new Date(year, month - 1, day, hour, minute);

        const transaction = this.saleTransactionRepository.create({
          burner,
          phone: attendantPhone,
          durationMinutes,
          amount,
          runtype: 'M',
          paymentMethod: PaymentMethod.CASH,
          createdAt: transactionDate,
        });

        transactions.push(transaction);
      }
    }

    await this.saleTransactionRepository.save(transactions);

    return {
      count: transactions.length,
      message: `Generated ${transactions.length} dummy transactions for ${year}-${month}`,
    };
  }

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
