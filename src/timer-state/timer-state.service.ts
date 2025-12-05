import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Burner } from '../kitchen/entities/burner.entity';
import { SaleTransaction } from '../sale-transaction/entities/sale-transaction.entity';
import { getTimerState as getPaygoTimerState } from '../sockets/burners';

@Injectable()
export class TimerStateService {
  constructor(
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    @InjectRepository(SaleTransaction)
    private saleTransactionRepository: Repository<SaleTransaction>,
  ) {}

  async getTimerState(burnerId: string) {
    // Find the burner
    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
    });

    if (!burner) {
      throw new NotFoundException(`Burner with ID ${burnerId} not found`);
    }

    if (burner.isConnectedToPaygo) {
      // For PayGo burners, get state from the socket system
      const burnerNumber = this.extractBurnerNumber(burner.name);
      if (burnerNumber) {
        const paygoDeviceId = `kitchen1burner${burnerNumber}`;
        return this.getPaygoTimerState(paygoDeviceId);
      } else {
        return {
          burnerId,
          remainingTime: 0,
          totalTime: 0,
          isActive: false,
          isPaused: false,
          startedAt: null,
          customerPhone: null,
          type: 'paygo',
          // ✅ NEW: Add ownership info
          ownedBy: null,
          ownerName: null,
          ownerPhone: null,
        };
      }
    } else {
      // For regular burners, check if there's an active sale transaction
      return this.getRegularTimerState(burnerId);
    }
  }

  async getPaygoTimerState(deviceId: string) {
    // Get timer state from the PayGo socket system
    const timerState = getPaygoTimerState(deviceId);

    // ✅ NEW: Get ownership info for PayGo timers
    const ownershipInfo = timerState.ownershipInfo || {};

    return {
      burnerId: deviceId,
      remainingTime: timerState.remainingTime || 0,
      totalTime: timerState.totalTime || 0,
      isActive: timerState.burnerIsRunning || false,
      isPaused: timerState.burnerIsPaused || false,
      type: 'paygo',
      deviceId: deviceId,
      // ✅ NEW: Add ownership info
      ownedBy: ownershipInfo.userId || null,
      ownerName: ownershipInfo.userName || null,
      ownerPhone: ownershipInfo.customerPhone || null,
      ownerSessionId: ownershipInfo.sessionId || null,
    };
  }

  private async getRegularTimerState(burnerId: string) {
    // For regular burners, check the most recent active transaction
    const activeTransaction = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.burner', 'burner')
      .where('burner.id = :burnerId', { burnerId })
      .andWhere('burner.isActive = :isActive', { isActive: true })
      .orderBy('transaction.createdAt', 'DESC')
      .getOne();

    if (activeTransaction) {
      const now = new Date();
      const transactionStart = new Date(activeTransaction.createdAt);
      const durationMs = activeTransaction.durationMinutes * 60 * 1000;
      const elapsedMs = now.getTime() - transactionStart.getTime();
      const remainingMs = Math.max(0, durationMs - elapsedMs);

      const isActive = remainingMs > 0;
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      return {
        burnerId,
        remainingTime: remainingSeconds,
        totalTime: activeTransaction.durationMinutes * 60,
        isActive,
        isPaused: false,
        startedAt: activeTransaction.createdAt,
        customerPhone: activeTransaction.phone,
        transactionId: activeTransaction.transactionId,
        type: 'regular',
        // ✅ NEW: Add ownership info
        ownedBy: activeTransaction.createdByUserId || null,
        ownerName: activeTransaction.createdByName || null,
        ownerPhone: activeTransaction.phone,
        ownerSessionId: activeTransaction.createdBySessionId || null,
      };
    }

    return {
      burnerId,
      remainingTime: 0,
      totalTime: 0,
      isActive: false,
      isPaused: false,
      startedAt: null,
      customerPhone: null,
      type: 'regular',
      // ✅ NEW: Add ownership info
      ownedBy: null,
      ownerName: null,
      ownerPhone: null,
      ownerSessionId: null,
    };
  }

  private extractBurnerNumber(burnerName: string): number | null {
    const match = burnerName.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
}
