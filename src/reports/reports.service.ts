import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    for (const dateKey in grouped) {
      const totalMinutes = grouped[dateKey].transactions.reduce(
        (sum, t) => sum + Number(t.durationMinutes),
        0,
      );
      grouped[dateKey].totalCookingHours = (totalMinutes / 60).toFixed(2);
    }

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

    const transactions = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.burner', 'burner')
      .leftJoin('burner.stove', 'stove')
      .leftJoin('stove.kitchen', 'kitchen')
      .select([
        'transaction.transactionId',
        'transaction.amount',
        'transaction.durationMinutes',
        'transaction.phone',
        'transaction.paymentMethod',
        'transaction.runtype',
        'transaction.createdByName',
        'transaction.createdAt',
        'burner.id',
        'burner.name',
        'burner.position',
        'stove.id',
        'stove.name',
        'kitchen.id',
        'kitchen.name',
      ])
      .where('kitchen.id IN (:...kitchenIds)', { kitchenIds })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();

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
      dailySales: this.groupTransactionsByDate(transactions),
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
      relations: ['worker'],
    });

    if (!kitchen) return { error: 'Kitchen not found' };

    const transactions = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.burner', 'burner')
      .leftJoin('burner.stove', 'stove')
      .leftJoin('stove.kitchen', 'kitchen')
      .select([
        'transaction.transactionId',
        'transaction.amount',
        'transaction.durationMinutes',
        'transaction.phone',
        'transaction.paymentMethod',
        'transaction.runtype',
        'transaction.createdByName',
        'transaction.createdAt',
        'burner.id',
        'burner.name',
        'burner.position',
        'stove.id',
        'stove.name',
      ])
      .where('kitchen.id = :kitchenId', { kitchenId })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();

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
      kitchen: {
        id: kitchen.id,
        name: kitchen.name,
        location: kitchen.location,
      },
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales: this.groupTransactionsByDate(transactions),
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

    const transactions = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.burner', 'burner')
      .select([
        'transaction.transactionId',
        'transaction.amount',
        'transaction.durationMinutes',
        'transaction.phone',
        'transaction.paymentMethod',
        'transaction.runtype',
        'transaction.createdByName',
        'transaction.createdAt',
      ])
      .where('burner.id = :burnerId', { burnerId })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();

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
      burner: {
        id: burner.id,
        name: burner.name,
        position: burner.position,
        stove: burner.stove.name,
        kitchen: burner.stove.kitchen.name,
      },
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales: this.groupTransactionsByDate(transactions),
    };
  }

  async getOverallReport(startDate: string, endDate: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const transactions = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.burner', 'burner')
      .leftJoin('burner.stove', 'stove')
      .leftJoin('stove.kitchen', 'kitchen')
      .select([
        'transaction.transactionId',
        'transaction.amount',
        'transaction.durationMinutes',
        'transaction.phone',
        'transaction.paymentMethod',
        'transaction.runtype',
        'transaction.createdByName',
        'transaction.createdAt',
        'burner.id',
        'burner.name',
        'stove.id',
        'stove.name',
        'kitchen.id',
        'kitchen.name',
      ])
      .where('transaction.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();

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
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales: this.groupTransactionsByDate(transactions),
    };
  }

  async getMultipleBurnersReport(
    burnerIds: string[],
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const transactions = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.burner', 'burner')
      .leftJoin('burner.stove', 'stove')
      .select([
        'transaction.transactionId',
        'transaction.amount',
        'transaction.durationMinutes',
        'transaction.phone',
        'transaction.paymentMethod',
        'transaction.runtype',
        'transaction.createdByName',
        'transaction.createdAt',
        'burner.id',
        'burner.name',
        'burner.position',
        'stove.id',
        'stove.name',
      ])
      .where('burner.id IN (:...burnerIds)', { burnerIds })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('transaction.createdAt', 'ASC')
      .getMany();

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
      burnerIds,
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: totalTransactions,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales: this.groupTransactionsByDate(transactions),
    };
  }
}
