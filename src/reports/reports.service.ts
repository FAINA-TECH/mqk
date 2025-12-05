// src/reports/reports.service.ts
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

  // Date range helper
  private getDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return { start, end };
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

    if (!worker) {
      return { error: 'Worker not found' };
    }

    const kitchenIds = worker.kitchens.map((kitchen) => kitchen.id);

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          kitchen: {
            id: In(kitchenIds),
          },
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.kitchen'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.durationMinutes),
      0,
    );

    // Group by kitchen
    const kitchenStats = {};
    transactions.forEach((transaction) => {
      const kitchenId = transaction.burner.kitchen.id;
      const kitchenName = transaction.burner.kitchen.name;

      if (!kitchenStats[kitchenId]) {
        kitchenStats[kitchenId] = {
          kitchenName,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      kitchenStats[kitchenId].salesCount += 1;
      kitchenStats[kitchenId].totalAmount += Number(transaction.amount);
      kitchenStats[kitchenId].totalMinutes += Number(
        transaction.durationMinutes,
      );
    });

    return {
      worker: {
        nationalId: worker.nationalId,
        name: worker.name,
      },
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalMinutes,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      kitchens: Object.values(kitchenStats),
    };
  }

  // 2. Kitchen Report
  async getKitchenReport(
    kitchenId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const kitchen = await this.kitchenRepository.findOne({
      where: { id: kitchenId },
      relations: ['worker', 'burners'],
    });

    if (!kitchen) {
      return { error: 'Kitchen not found' };
    }

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          kitchen: {
            id: kitchenId,
          },
        },
        createdAt: Between(start, end),
      },
      relations: ['burner'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.durationMinutes),
      0,
    );

    // Group by burner
    const burnerStats = {};
    transactions.forEach((transaction) => {
      const burnerId = transaction.burner.id;
      const burnerName = transaction.burner.name;

      if (!burnerStats[burnerId]) {
        burnerStats[burnerId] = {
          burnerName,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      burnerStats[burnerId].salesCount += 1;
      burnerStats[burnerId].totalAmount += Number(transaction.amount);
      burnerStats[burnerId].totalMinutes += Number(transaction.durationMinutes);
    });

    // Payment method breakdown
    const cashSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'cash',
    );
    const mobileSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'mobile_money',
    );
    const cashAmount = cashSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const mobileAmount = mobileSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    return {
      kitchen: {
        id: kitchen.id,
        name: kitchen.name,
        location: kitchen.location,
        worker: kitchen.worker
          ? {
              nationalId: kitchen.worker.nationalId,
              name: kitchen.worker.name,
            }
          : null,
      },
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalMinutes,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      paymentBreakdown: {
        cash: {
          salesCount: cashSales.length,
          totalAmount: cashAmount,
        },
        mobileMoney: {
          salesCount: mobileSales.length,
          totalAmount: mobileAmount,
        },
      },
      burners: Object.values(burnerStats),
    };
  }

  // 3. Burner Report
  async getBurnerReport(burnerId: string, startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
      relations: ['kitchen', 'kitchen.worker'],
    });

    if (!burner) {
      return { error: 'Burner not found' };
    }

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          id: burnerId,
        },
        createdAt: Between(start, end),
      },
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.durationMinutes),
      0,
    );

    // Payment method breakdown
    const cashSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'cash',
    );
    const mobileSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'mobile_money',
    );
    const cashAmount = cashSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const mobileAmount = mobileSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    // Daily breakdown
    const dailyStats = {};
    transactions.forEach((transaction) => {
      const date = transaction.createdAt.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      dailyStats[date].salesCount += 1;
      dailyStats[date].totalAmount += Number(transaction.amount);
      dailyStats[date].totalMinutes += Number(transaction.durationMinutes);
    });

    return {
      burner: {
        id: burner.id,
        name: burner.name,
        hourlyRate: burner.hourlyRate,
        partialRate: burner.partialRate,
        kitchen: {
          id: burner.kitchen.id,
          name: burner.kitchen.name,
          worker: burner.kitchen.worker
            ? {
                nationalId: burner.kitchen.worker.nationalId,
                name: burner.kitchen.worker.name,
              }
            : null,
        },
      },
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalMinutes,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      paymentBreakdown: {
        cash: {
          salesCount: cashSales.length,
          totalAmount: cashAmount,
        },
        mobileMoney: {
          salesCount: mobileSales.length,
          totalAmount: mobileAmount,
        },
      },
      dailyBreakdown: Object.values(dailyStats).sort((a: any, b: any) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  // 4. Multiple Burners Report
  async getMultipleBurnersReport(
    burnerIds: string[],
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const burners = await this.burnerRepository.find({
      where: { id: In(burnerIds) },
      relations: ['kitchen'],
    });

    if (burners.length === 0) {
      return { error: 'No burners found' };
    }

    const transactions = await this.saleTransactionRepository.find({
      where: {
        burner: {
          id: In(burners.map((b) => b.id)),
        },
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.kitchen'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.durationMinutes),
      0,
    );

    // Group by burner
    const burnerStats = {};
    transactions.forEach((transaction) => {
      const burnerId = transaction.burner.id;
      const burnerName = transaction.burner.name;
      const kitchenName = transaction.burner.kitchen.name;

      if (!burnerStats[burnerId]) {
        burnerStats[burnerId] = {
          burnerId,
          burnerName,
          kitchenName,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      burnerStats[burnerId].salesCount += 1;
      burnerStats[burnerId].totalAmount += Number(transaction.amount);
      burnerStats[burnerId].totalMinutes += Number(transaction.durationMinutes);
    });

    return {
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalBurners: burners.length,
        totalSales: totalTransactions,
        totalAmount,
        totalMinutes,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      burners: Object.values(burnerStats),
    };
  }

  // 5. Overall Summary Report
  async getOverallReport(startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const transactions = await this.saleTransactionRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      relations: ['burner', 'burner.kitchen'],
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const totalMinutes = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.durationMinutes),
      0,
    );

    // Kitchen breakdown
    const kitchenStats = {};
    transactions.forEach((transaction) => {
      const kitchenId = transaction.burner.kitchen.id;
      const kitchenName = transaction.burner.kitchen.name;

      if (!kitchenStats[kitchenId]) {
        kitchenStats[kitchenId] = {
          kitchenId,
          kitchenName,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      kitchenStats[kitchenId].salesCount += 1;
      kitchenStats[kitchenId].totalAmount += Number(transaction.amount);
      kitchenStats[kitchenId].totalMinutes += Number(
        transaction.durationMinutes,
      );
    });

    // Payment method breakdown
    const cashSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'cash',
    );
    const mobileSales = transactions.filter(
      (transaction) => transaction.paymentMethod === 'mobile_money',
    );
    const cashAmount = cashSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    const mobileAmount = mobileSales.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );

    // Daily breakdown
    const dailyStats = {};
    transactions.forEach((transaction) => {
      const date = transaction.createdAt.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          salesCount: 0,
          totalAmount: 0,
          totalMinutes: 0,
        };
      }

      dailyStats[date].salesCount += 1;
      dailyStats[date].totalAmount += Number(transaction.amount);
      dailyStats[date].totalMinutes += Number(transaction.durationMinutes);
    });

    return {
      dateRange: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalMinutes,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      paymentBreakdown: {
        cash: {
          salesCount: cashSales.length,
          totalAmount: cashAmount,
        },
        mobileMoney: {
          salesCount: mobileSales.length,
          totalAmount: mobileAmount,
        },
      },
      kitchens: Object.values(kitchenStats),
      dailyBreakdown: Object.values(dailyStats).sort((a: any, b: any) =>
        a.date.localeCompare(b.date),
      ),
    };
  }
}
