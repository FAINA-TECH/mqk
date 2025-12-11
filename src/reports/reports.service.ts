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

  // 1. Worker Report
  async getWorkerReport(nationalId: string, startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const worker = await this.userRepository.findOne({
      where: { nationalId },
      relations: ['kitchens'],
    });

    if (!worker) return { error: 'Worker not found' };

    const kitchenIds = worker.kitchens.map((k) => k.id);

    // Need to join burner -> stove -> kitchen
    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          stove: {
            kitchen: {
                id: In(kitchenIds)
            }
          }
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.stove', 'burner.stove.kitchen'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalMinutes = transactions.reduce((sum, t) => sum + Number(t.durationMinutes), 0);

    return {
      worker: { name: worker.name, nationalId: worker.nationalId },
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      // ... kitchen grouping logic similar to before but accessing t.burner.stove.kitchen ...
    };
  }

  // 2. Kitchen Report
  async getKitchenReport(kitchenId: string, startDate: string, endDate: string) {
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
                kitchen: { id: kitchenId }
            }
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.stove'],
    });

    // ... calculation logic ...
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalMinutes = transactions.reduce((sum, t) => sum + Number(t.durationMinutes), 0);

    return {
        kitchen: { name: kitchen.name },
        summary: { totalSales: totalTransactions, totalAmount },
        // ...
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
    });

    // ... calculation logic ...
    return {
        burner: { name: burner.name, stove: burner.stove.name, kitchen: burner.stove.kitchen.name },
        transactions
    }
  }

  // ... other methods follow similar relation path pattern: burner.stove.kitchen
  async getOverallReport(startDate: string, endDate: string) {
      // Implement using updated relations
      const { start, end } = this.getDateRange(startDate, endDate);
      return { message: "Overall report pending implementation with new schema" };
  }
  
  async getMultipleBurnersReport(burnerIds: string[], startDate: string, endDate: string) {
      // Implement using updated relations
      return { message: "Multiple burners report pending implementation with new schema" };
  }
}