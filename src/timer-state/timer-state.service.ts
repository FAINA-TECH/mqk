import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Burner } from '../kitchen/entities/burner.entity';
import { SaleTransaction } from '../sale-transaction/entities/sale-transaction.entity';
import { getTimerState as getSocketTimerState, getRecentlyCompletedTimer } from '../sockets/burners';

@Injectable()
export class TimerStateService {
  private readonly logger = new Logger(TimerStateService.name);

  constructor(
    @InjectRepository(Burner)
    private burnerRepository: Repository<Burner>,
    @InjectRepository(SaleTransaction)
    private saleTransactionRepository: Repository<SaleTransaction>,
  ) {}

  async getTimerState(burnerId: string) {
    this.logger.log(`Checking timer state for burner: ${burnerId}`);
    
    const burner = await this.burnerRepository.findOne({
      where: { id: burnerId },
      relations: ['stove']
    });

    if (!burner) {
      this.logger.error(`Burner not found: ${burnerId}`);
      throw new NotFoundException(`Burner with ID ${burnerId} not found`);
    }

    this.logger.log(`Burner found: ${burner.name}, PayGo: ${burner.isConnectedToPaygo}`);

    if (burner.isConnectedToPaygo) {
      // Use socket state
      const paygoState = await this.getPaygoTimerState(burnerId);
      this.logger.log(`PayGo timer state:`, paygoState);
      return paygoState;
    } else {
      const regularState = await this.getRegularTimerState(burnerId);
      this.logger.log(`Regular timer state:`, regularState);
      return regularState;
    }
  }

  async getPaygoTimerState(burnerId: string) {
    this.logger.log(`Getting PayGo timer state for: ${burnerId}`);
    
    // Get timer state from the socket system (in-memory)
    const timerState = getSocketTimerState(burnerId);
    this.logger.log(`Socket timer state:`, timerState);
    
    const ownershipInfo = timerState.ownershipInfo || {};

    // Check for recently completed timer
    const recentlyCompleted = getRecentlyCompletedTimer(burnerId);
    this.logger.log(`Recently completed timer:`, recentlyCompleted);

    const result = {
      burnerId: burnerId,
      remainingTime: timerState.remainingTime || 0,
      totalTime: timerState.totalTime || 0,
      isActive: timerState.burnerIsRunning || false,
      isPaused: timerState.burnerIsPaused || false,
      type: 'paygo',
      ownedBy: ownershipInfo.userId || null,
      ownerName: ownershipInfo.userName || null,
      ownerPhone: ownershipInfo.customerPhone || null,
      ownerSessionId: ownershipInfo.sessionId || null,
      // Add recently completed info
      recentlyCompleted: !!recentlyCompleted,
      completedAt: recentlyCompleted?.completedAt || null,
      inCooldown: recentlyCompleted ? (Date.now() - recentlyCompleted.completedAt < 30000) : false,
      cooldownRemaining: recentlyCompleted ? Math.max(0, Math.ceil((30000 - (Date.now() - recentlyCompleted.completedAt)) / 1000)) : 0,
    };
    
    this.logger.log(`PayGo result:`, result);
    return result;
  }

  private async getRegularTimerState(burnerId: string) {
    this.logger.log(`Getting regular timer state for: ${burnerId}`);
    
    const activeTransaction = await this.saleTransactionRepository
      .createQueryBuilder('transaction')
      .innerJoin('transaction.burner', 'burner')
      .where('burner.id = :burnerId', { burnerId })
      .andWhere('burner.isActive = :isActive', { isActive: true })
      .orderBy('transaction.createdAt', 'DESC')
      .getOne();

    this.logger.log(`Active transaction found:`, !!activeTransaction);

    if (activeTransaction) {
      const now = new Date();
      const transactionStart = new Date(activeTransaction.createdAt);
      const durationMs = activeTransaction.durationMinutes * 60 * 1000;
      const elapsedMs = now.getTime() - transactionStart.getTime();
      const remainingMs = Math.max(0, durationMs - elapsedMs);

      const isActive = remainingMs > 0;
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      const result = {
        burnerId,
        remainingTime: remainingSeconds,
        totalTime: activeTransaction.durationMinutes * 60,
        isActive,
        isPaused: false,
        startedAt: activeTransaction.createdAt,
        customerPhone: activeTransaction.phone,
        transactionId: activeTransaction.transactionId,
        type: 'regular',
        ownedBy: activeTransaction.createdByUserId || null,
        ownerName: activeTransaction.createdByName || null,
        ownerPhone: activeTransaction.phone,
        ownerSessionId: activeTransaction.createdBySessionId || null,
        recentlyCompleted: false,
        completedAt: null,
        inCooldown: false,
        cooldownRemaining: 0,
      };
      
      this.logger.log(`Regular timer result:`, result);
      return result;
    }

    const emptyResult = {
      burnerId,
      remainingTime: 0,
      totalTime: 0,
      isActive: false,
      isPaused: false,
      startedAt: null,
      customerPhone: null,
      type: 'regular',
      ownedBy: null,
      ownerName: null,
      ownerPhone: null,
      ownerSessionId: null,
      recentlyCompleted: false,
      completedAt: null,
      inCooldown: false,
      cooldownRemaining: 0,
    };
    
    this.logger.log(`Empty timer result:`, emptyResult);
    return emptyResult;
  }
}