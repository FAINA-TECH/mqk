// src/scripted-sale/scripted-sale.controller.ts
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ScriptedSaleService } from './scripted-sale.service';
import { GenerateScriptedRunsDto } from './dto/generate-scripted-runs.dto';

@ApiTags('scripted-sales')
@Controller('scripted-sales')
export class ScriptedSaleController {
  constructor(private readonly service: ScriptedSaleService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate scripted sales for a kitchen',
    description:
      'Pass kitchenId + year + month for a full month, or kitchenId + specificDate for a single day. ' +
      'If the month is the current month, generation stops at yesterday. Sundays are skipped.',
  })
  generate(@Body() dto: GenerateScriptedRunsDto) {
    return this.service.generate(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get scripted sales for a kitchen within a date range',
  })
  @ApiQuery({
    name: 'kitchenId',
    required: true,
    example: '3d9b0421-58ac-4a1d-855a-1998a7438a4f',
  })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-31' })
  @ApiQuery({
    name: 'showTransactions',
    required: false,
    type: Boolean,
    example: false,
  })
  getByKitchen(
    @Query('kitchenId') kitchenId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('showTransactions') showTransactions?: string,
  ) {
    const detailed = showTransactions === 'true';
    return this.service.getByKitchenAndDateRange(
      kitchenId,
      startDate,
      endDate,
      detailed,
    );
  }

  @Delete('month')
  @ApiOperation({
    summary:
      'Delete scripted sales for a kitchen/month (to allow re-generation)',
  })
  @ApiQuery({ name: 'kitchenId', required: true })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 1 })
  deleteMonth(
    @Query('kitchenId') kitchenId: string,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.service.deleteForMonth(kitchenId, Number(year), Number(month));
  }
}
