// src/scripted-sale/scripted-sale.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  ScriptedSaleTransaction,
  ScriptedPaymentMethod,
} from './entities/scripted-sale-transaction.entity';
import { Burner } from '../kitchen/entities/burner.entity';
import { Kitchen } from '../kitchen/entities/kitchen.entity';
import { GenerateScriptedRunsDto } from './dto/generate-scripted-runs.dto';

// Target monthly revenues per kitchen (KSH)
const KITCHEN_MONTHLY_TARGETS: Record<string, number> = {
  '3d9b0421-58ac-4a1d-855a-1998a7438a4f': 40500, //soweto 88
  'aaba202a-97bc-4330-a7db-50e68c8f6d7a': 55500, //Soweto Kibagare
  '86615649-9f97-4638-9a6d-449f6d14fd24': 20000, //Rasta Stage
};
const DEFAULT_MONTHLY_TARGET = 30000;

// Meal-peak weighted hour pool
function buildHourPool(): number[] {
  const pool: number[] = [];

  // Opening hour 8 (light — people just arriving)
  for (let i = 0; i < 2; i++) pool.push(8);

  // Breakfast peak 9–10
  [9, 10].forEach((h) => {
    for (let i = 0; i < 4; i++) pool.push(h);
  });

  // Mid-morning 11 (moderate)
  for (let i = 0; i < 2; i++) pool.push(11);

  // Lunch peak 12–14 (congested, 12–13 heaviest)
  [12, 13].forEach((h) => {
    for (let i = 0; i < 7; i++) pool.push(h);
  });
  [14].forEach((h) => {
    for (let i = 0; i < 4; i++) pool.push(h);
  });

  // Afternoon lull 15–16 (very light)
  [15, 16].forEach((h) => pool.push(h));

  // Supper peak 17–19 (heaviest period of day)
  [17, 18, 19].forEach((h) => {
    for (let i = 0; i < 7; i++) pool.push(h);
  });

  // Winding down 20 (light — last few customers)
  for (let i = 0; i < 2; i++) pool.push(20);

  // Occasional late stragglers 21 — kitchen slightly extended, rare
  pool.push(21);

  return pool;
}
const HOUR_POOL = buildHourPool();

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussianRandom(mean: number, std: number): number {
  // Box-Muller transform
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.round(mean + z * std);
}

@Injectable()
export class ScriptedSaleService {
  constructor(
    @InjectRepository(ScriptedSaleTransaction)
    private scriptedRepo: Repository<ScriptedSaleTransaction>,
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    @InjectRepository(Kitchen)
    private kitchenRepository: Repository<Kitchen>,
  ) {}

  // ─── Core generation for a list of dates ──────────────────────────────────

  private async generateForDates(
    kitchenId: string,
    dates: Date[],
    monthlyTarget: number,
    workingDaysInMonth: number,
  ): Promise<ScriptedSaleTransaction[]> {
    // Load burners for this kitchen
    const burners = await this.burnerRepository.find({
      where: { stove: { kitchen: { id: kitchenId } } },
      relations: ['stove', 'stove.kitchen', 'stove.kitchen.worker'],
    });

    if (!burners.length) {
      throw new NotFoundException(`No burners found for kitchen ${kitchenId}`);
    }

    const kitchen = burners[0].stove.kitchen;
    const worker = kitchen.worker;

    if (!worker?.phone) {
      throw new ConflictException(
        'Kitchen attendant has no phone number configured.',
      );
    }

    const attendantPhone = worker.phone;

    // Average revenue per working day
    const dailyTargetRevenue = monthlyTarget / workingDaysInMonth;

    // Average sale value — weighted mix of 30m/60m/90m sessions
    // 30m=20, 60m=30, 90m=50 → weighted avg ≈ (0.25*20 + 0.50*30 + 0.25*50) = 32.5
    const avgSaleValue = 32.5;
    const baseDailyCustomers = Math.round(dailyTargetRevenue / avgSaleValue);

    const transactions: ScriptedSaleTransaction[] = [];

    for (const date of dates) {
      // Skip Sundays
      if (date.getDay() === 0) continue;

      // Day-of-week multiplier: Mon/Tue lighter, Wed-Fri normal, Sat busier
      const dow = date.getDay();
      const dowMultiplier =
        dow === 6
          ? 1.25 // Saturday: busy
          : dow === 5
            ? 1.1 // Friday: slightly busy
            : dow === 1
              ? 0.8 // Monday: slower start
              : 1.0;

      // Gaussian variance around base, ±25% std dev
      const targetCustomers = Math.max(
        2,
        gaussianRandom(
          baseDailyCustomers * dowMultiplier,
          baseDailyCustomers * 0.25,
        ),
      );

      // Distribute customers across burners — cap per burner per hour to avoid congestion
      // But allow bunching at peak hours naturally
      for (let i = 0; i < targetCustomers; i++) {
        const burner = pickRandom(burners);

        // Duration distribution: 30m(25%), 60m(50%), 90m(25%)
        const r = Math.random();
        const durationMinutes = r < 0.25 ? 30 : r < 0.75 ? 60 : 90;

        // Amount based on burner rates
        let amount = 0;
        const hours = Math.floor(durationMinutes / 60);
        const remainder = durationMinutes % 60;
        if (hours > 0) amount += hours * Number(burner.hourlyRate);
        if (remainder > 0) amount += Number(burner.partialRate);

        // Pick a realistic hour (meal-peak weighted)
        const hour = pickRandom(HOUR_POOL);
        const minute = Math.floor(Math.random() * 60);

        const transactionDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          hour,
          minute,
        );

        const tx = this.scriptedRepo.create({
          burner,
          kitchenId,
          phone: attendantPhone,
          durationMinutes,
          amount,
          paymentMethod: ScriptedPaymentMethod.CASH,
          runtype: 'S',
          transactionDate,
        });

        transactions.push(tx);
      }
    }

    return transactions;
  }

  // ─── Get all working days in a month (Mon–Sat) ────────────────────────────

  private getWorkingDays(
    year: number,
    month: number,
    capToYesterday = false,
  ): Date[] {
    const days: Date[] = [];
    const now = new Date();
    const lastDay = capToYesterday
      ? Math.min(new Date(year, month, 0).getDate(), now.getDate() - 1)
      : new Date(year, month, 0).getDate();

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      if (date.getDay() !== 0) days.push(date); // exclude Sundays
    }
    return days;
  }

  // ─── Public: generate for month ────────────────────────────────────────────

  async generateForMonth(
    kitchenId: string,
    year: number,
    month: number,
  ): Promise<{ count: number; message: string }> {
    const now = new Date();
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth() + 1;

    if (isCurrentMonth && now.getDate() === 1) {
      throw new BadRequestException(
        'Cannot generate for current month: no completed days yet.',
      );
    }

    // Check for existing data to avoid duplicates
    const firstDay = new Date(year, month - 1, 1);
    firstDay.setHours(0, 0, 0, 0);
    const lastDayDate = new Date(year, month, 0);
    lastDayDate.setHours(23, 59, 59, 999);

    const existing = await this.scriptedRepo.count({
      where: {
        kitchenId,
        transactionDate: Between(firstDay, lastDayDate),
      },
    });

    if (existing > 0) {
      throw new ConflictException(
        `Scripted data already exists for kitchen ${kitchenId} in ${year}-${month}. Delete it first.`,
      );
    }

    const allWorkingDays = this.getWorkingDays(year, month, false);
    const workingDaysInFullMonth = allWorkingDays.length;
    const datesToGenerate = this.getWorkingDays(year, month, isCurrentMonth);

    const monthlyTarget =
      KITCHEN_MONTHLY_TARGETS[kitchenId] ?? DEFAULT_MONTHLY_TARGET;

    const transactions = await this.generateForDates(
      kitchenId,
      datesToGenerate,
      monthlyTarget,
      workingDaysInFullMonth, // use full month denominator so per-day target is correct
    );

    await this.scriptedRepo.save(transactions, { chunk: 500 });

    return {
      count: transactions.length,
      message: `Generated ${transactions.length} scripted transactions for kitchen ${kitchenId} — ${year}-${String(month).padStart(2, '0')}`,
    };
  }

  // ─── Public: generate for a specific date ──────────────────────────────────

  async generateForDate(
    kitchenId: string,
    specificDate: string,
  ): Promise<{ count: number; message: string }> {
    const date = new Date(specificDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${specificDate}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date >= today) {
      throw new BadRequestException(
        'Can only generate scripted sales for past dates (before today).',
      );
    }

    if (date.getDay() === 0) {
      throw new BadRequestException('No sales on Sundays.');
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.scriptedRepo.count({
      where: {
        kitchenId,
        transactionDate: Between(dayStart, dayEnd),
      },
    });

    if (existing > 0) {
      throw new ConflictException(
        `Scripted data already exists for kitchen ${kitchenId} on ${specificDate}.`,
      );
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const allWorkingDays = this.getWorkingDays(year, month, false);
    const monthlyTarget =
      KITCHEN_MONTHLY_TARGETS[kitchenId] ?? DEFAULT_MONTHLY_TARGET;

    const transactions = await this.generateForDates(
      kitchenId,
      [date],
      monthlyTarget,
      allWorkingDays.length,
    );

    await this.scriptedRepo.save(transactions, { chunk: 500 });

    return {
      count: transactions.length,
      message: `Generated ${transactions.length} scripted transactions for kitchen ${kitchenId} on ${specificDate}`,
    };
  }

  // ─── Public: unified entry point ───────────────────────────────────────────

  async generate(
    dto: GenerateScriptedRunsDto,
  ): Promise<{ count: number; message: string }> {
    if (dto.specificDate) {
      return this.generateForDate(dto.kitchenId, dto.specificDate);
    }

    if (!dto.year || !dto.month) {
      throw new BadRequestException(
        'Provide either specificDate or both year and month.',
      );
    }

    return this.generateForMonth(dto.kitchenId, dto.year, dto.month);
  }

  // ─── Public: get scripted sales by kitchen + date range ────────────────────

  async getByKitchenAndDateRange(
    kitchenId: string,
    startDate: string,
    endDate: string,
    showTransactions = false,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const kitchen = await this.kitchenRepository.findOne({
      where: { id: kitchenId },
    });

    const kitchenName = kitchen?.name ?? kitchenId;

    const transactions = await this.scriptedRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.burner', 'burner')
      .leftJoinAndSelect('burner.stove', 'stove')
      .where('tx.kitchenId = :kitchenId', { kitchenId })
      .andWhere('tx.transactionDate BETWEEN :start AND :end', { start, end })
      .orderBy('tx.transactionDate', 'ASC')
      .getMany();

    const totalAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);
    const totalMinutes = transactions.reduce(
      (s, t) => s + Number(t.durationMinutes),
      0,
    );

    const grouped: Record<
      string,
      {
        totalSales: number;
        totalAmount: number;
        totalMinutes: number;
        burners: Record<
          string,
          {
            burnerId: string;
            burnerName: string;
            stoveName: string;
            totalSales: number;
            totalAmount: number;
            totalMinutes: number;
            transactions: {
              id: string;
              transactionDate: Date;
              durationMinutes: number;
              amount: number;
              paymentMethod: string;
              phone: string;
            }[];
          }
        >;
      }
    > = {};

    for (const t of transactions) {
      const dateKey = new Date(t.transactionDate).toISOString().split('T')[0];
      const burnerId = t.burner?.id ?? 'unknown';
      const burnerName = t.burner?.name ?? 'Unknown Burner';
      const stoveName = t.burner?.stove?.name ?? 'Unknown Stove';

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          totalSales: 0,
          totalAmount: 0,
          totalMinutes: 0,
          burners: {},
        };
      }

      grouped[dateKey].totalSales += 1;
      grouped[dateKey].totalAmount += Number(t.amount);
      grouped[dateKey].totalMinutes += Number(t.durationMinutes);

      if (!grouped[dateKey].burners[burnerId]) {
        grouped[dateKey].burners[burnerId] = {
          burnerId,
          burnerName,
          stoveName,
          totalSales: 0,
          totalAmount: 0,
          totalMinutes: 0,
          transactions: [],
        };
      }

      grouped[dateKey].burners[burnerId].totalSales += 1;
      grouped[dateKey].burners[burnerId].totalAmount += Number(t.amount);
      grouped[dateKey].burners[burnerId].totalMinutes += Number(
        t.durationMinutes,
      );

      grouped[dateKey].burners[burnerId].transactions.push({
        id: t.id,
        transactionDate: t.transactionDate,
        durationMinutes: Number(t.durationMinutes),
        amount: Number(t.amount),
        paymentMethod: t.paymentMethod,
        phone: t.phone,
      });
    }

    const dailySales = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        totalSales: data.totalSales,
        totalAmount: data.totalAmount,
        totalCookingHours: (data.totalMinutes / 60).toFixed(2),
        burners: Object.values(data.burners)
          .sort((a, b) => a.burnerName.localeCompare(b.burnerName))
          .map((b) => ({
            burnerId: b.burnerId,
            burnerName: b.burnerName,
            stoveName: b.stoveName,
            totalSales: b.totalSales,
            totalAmount: b.totalAmount,
            totalCookingHours: (b.totalMinutes / 60).toFixed(2),
            ...(showTransactions && {
              transactions: b.transactions.sort(
                (a, b) =>
                  new Date(a.transactionDate).getTime() -
                  new Date(b.transactionDate).getTime(),
              ),
            }),
          })),
      }));

    return {
      kitchenId,
      kitchenName,
      dateRange: { startDate: start, endDate: end },
      summary: {
        totalSales: transactions.length,
        totalAmount,
        totalCookingHours: (totalMinutes / 60).toFixed(2),
      },
      dailySales,
    };
  }
  // ─── Public: delete scripted data for kitchen + month (for re-generation) ──

  async deleteForMonth(
    kitchenId: string,
    year: number,
    month: number,
  ): Promise<{ deleted: number }> {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    const result = await this.scriptedRepo
      .createQueryBuilder()
      .delete()
      .from(ScriptedSaleTransaction)
      .where('kitchenId = :kitchenId', { kitchenId })
      .andWhere('transactionDate BETWEEN :start AND :end', { start, end })
      .execute();

    return { deleted: result.affected ?? 0 };
  }
}
