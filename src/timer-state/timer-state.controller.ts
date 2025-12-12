import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { TimerStateService } from './timer-state.service';

@ApiTags('timer-state')
@Controller('timer-state')
export class TimerStateController {
  private readonly logger = new Logger(TimerStateController.name);

  constructor(private readonly timerStateService: TimerStateService) {}

  @Get(':burnerId')
  @ApiOperation({ summary: 'Get timer state for a specific burner' })
  @ApiParam({ name: 'burnerId', description: 'The ID of the burner' })
  @ApiResponse({ status: 200, description: 'Timer state retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Burner not found' })
  async getTimerState(@Param('burnerId') burnerId: string) {
    try {
      this.logger.log(`Getting timer state for burner: ${burnerId}`);
      const timerState = await this.timerStateService.getTimerState(burnerId);
      this.logger.log(`Timer state result:`, timerState);
      return timerState;
    } catch (error) {
      this.logger.error(`Error getting timer state for ${burnerId}:`, error.stack);
      
      if (error.message.includes('not found')) {
        throw new HttpException(
          error.message,
          HttpStatus.NOT_FOUND,
        );
      }
      
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
      this.logger.log(`Getting PayGo timer state for device: ${deviceId}`);
      const timerState = await this.timerStateService.getPaygoTimerState(deviceId);
      this.logger.log(`PayGo timer state result:`, timerState);
      return timerState;
    } catch (error) {
      this.logger.error(`Error getting PayGo timer state for ${deviceId}:`, error.stack);
      throw new HttpException(
        error.message || 'Failed to get PayGo timer state',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}