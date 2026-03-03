import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Kitchen } from '../kitchen/entities/kitchen.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { User } from '../user/entities/user.entity';
import { SaleTransaction } from 'src/sale-transaction/entities/sale-transaction.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SaleTransaction)
    private saleTransactionRepository: Repository<SaleTransaction>,
    @InjectRepository(Kitchen)
    private kitchenRepository: Repository<Kitchen>,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private getDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Helper: group transactions by date (YYYY-MM-DD)
  private groupTransactionsByDate(transactions: SaleTransaction[]) {
    const grouped: Record<
      string,
      {
        totalSales: number;
        totalAmount: number;
        totalCookingHours: string;
        transactions: SaleTransaction[];
      }
    > = {};

    for (const t of transactions) {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          totalSales: 0,
          totalAmount: 0,
          totalCookingHours: '0.00',
          transactions: [],
        };
      }

      grouped[dateKey].totalSales += 1;
      grouped[dateKey].totalAmount += Number(t.amount);
      grouped[dateKey].transactions.push(t);
    }

    // Compute cooking hours per day
    for (const dateKey in grouped) {
      const totalMinutes = grouped[dateKey].transactions.reduce(
        (sum, t) => sum + Number(t.durationMinutes),
        0,
      );
      grouped[dateKey].totalCookingHours = (totalMinutes / 60).toFixed(2);
    }

    // Return as sorted array
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }

  // 1. Worker Report
  async getWorkerReport(
    nationalId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const worker = await this.userRepository.findOne({
      where: { nationalId },
      relations: ['kitchens'],
    });

    if (!worker) return { error: 'Worker not found' };

    const kitchenIds = worker.kitchens.map((k) => k.id);

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          stove: {
            kitchen: {
              id: In(kitchenIds),
            },
          },
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.stove', 'burner.stove.kitchen'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, t) => sum + Number(t.durationMinutes),
      0,
    );

    return {
      worker: { name: worker.name, nationalId: worker.nationalId },
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
    };
  }

  // 2. Kitchen Report — with daily breakdown
  async getKitchenReport(
    kitchenId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const kitchen = await this.kitchenRepository.findOne({
      where: { id: kitchenId },
      relations: ['worker'],
    });

    if (!kitchen) return { error: 'Kitchen not found' };

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          stove: {
            kitchen: { id: kitchenId },
          },
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.stove'],
      order: { createdAt: 'ASC' },
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, t) => sum + Number(t.durationMinutes),
      0,
    );

    // Daily breakdown
    const dailySales = this.groupTransactionsByDate(transactions);

    return {
      kitchen: { id: kitchen.id, name: kitchen.name },
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales, // <-- per-day breakdown
    };
  }

  // 3. Burner Report
  async getBurnerReport(burnerId: string, startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
      relations: ['stove', 'stove.kitchen'],
    });

    if (!burner) return { error: 'Burner not found' };

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: { id: burnerId },
        createdAt: Between(start, end),
      },
      order: { createdAt: 'ASC' },
    });

    return {
      burner: {
        name: burner.name,
        stove: burner.stove.name,
        kitchen: burner.stove.kitchen.name,
      },
      transactions,
    };
  }

  async getOverallReport(startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);
    return { message: 'Overall report pending implementation with new schema' };
  }

  async getMultipleBurnersReport(
    burnerIds: string[],
    startDate: string,
    endDate: string,
  ) {
    return {
      message: 'Multiple burners report pending implementation with new schema',
    };
  }
}
