// src/timer-state/timer-state.controller.ts
import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { TimerStateService } from './timer-state.service';

@ApiTags('timer-state')
@Controller('timer-state')
export class TimerStateController {
  constructor(private readonly timerStateService: TimerStateService) {}

  @Get(':burnerId')
  @ApiOperation({ summary: 'Get timer state for a specific burner' })
  @ApiParam({
    name: 'burnerId',
    description: 'Burner ID to check timer state for',
  })
  @ApiResponse({
    status: 200,
    description: 'Timer state retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        burnerId: { type: 'string' },
        remainingTime: { type: 'number' },
        totalTime: { type: 'number' },
        isActive: { type: 'boolean' },
        isPaused: { type: 'boolean' },
        startedAt: { type: 'string', format: 'date-time' },
        customerPhone: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Burner not found' })
  async getTimerState(@Param('burnerId') burnerId: string) {
    try {
      const timerState = await this.timerStateService.getTimerState(burnerId);
      return timerState;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get timer state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('paygo/:deviceId')
  @ApiOperation({ summary: 'Get PayGo timer state for a specific device' })
  @ApiParam({
    name: 'deviceId',
    description: 'PayGo device ID to check timer state for',
  })
  @ApiResponse({
    status: 200,
    description: 'PayGo timer state retrieved successfully',
  })
  async getPaygoTimerState(@Param('deviceId') deviceId: string) {
    try {
      const timerState =
        await this.timerStateService.getPaygoTimerState(deviceId);
      return timerState;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get PayGo timer state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
