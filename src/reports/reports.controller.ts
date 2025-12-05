// src/reports/reports.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('worker')
  @ApiOperation({ summary: 'Get report for a specific worker by date range' })
  @ApiQuery({
    name: 'nationalId',
    required: true,
    type: String,
    example: 'KEN12345678',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getWorkerReport(
    @Query('nationalId') nationalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getWorkerReport(nationalId, startDate, endDate);
  }

  @Get('kitchen')
  @ApiOperation({ summary: 'Get report for a specific kitchen by date range' })
  @ApiQuery({
    name: 'kitchenId',
    required: true,
    type: String,
    example: 'kitchen-123',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getKitchenReport(
    @Query('kitchenId') kitchenId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getKitchenReport(kitchenId, startDate, endDate);
  }

  @Get('burner')
  @ApiOperation({ summary: 'Get report for a specific burner by date range' })
  @ApiQuery({
    name: 'burnerId',
    required: true,
    type: String,
    example: 'burner-456',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getBurnerReport(
    @Query('burnerId') burnerId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getBurnerReport(burnerId, startDate, endDate);
  }

  @Get('multiple-burners')
  @ApiOperation({ summary: 'Get report for multiple burners by date range' })
  @ApiQuery({
    name: 'burnerIds',
    required: true,
    type: [String],
    isArray: true,
    example: 'burner-123,burner-456',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getMultipleBurnersReport(
    @Query('burnerIds') burnerIds: string | string[],
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Handle string or array input for burnerIds
    const burnerIdArray = Array.isArray(burnerIds)
      ? burnerIds
      : typeof burnerIds === 'string'
        ? burnerIds.split(',').map((id) => id.trim())
        : [];

    return this.reportsService.getMultipleBurnersReport(
      burnerIdArray,
      startDate,
      endDate,
    );
  }

  @Get('overall')
  @ApiOperation({ summary: 'Get overall report by date range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2025-03-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getOverallReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getOverallReport(startDate, endDate);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily sales breakdown for a specific date' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    example: '2025-03-30',
  })
  getDailySalesReport(@Query('date') date: string) {
    // Use the same date for both start and end to get just one day
    return this.reportsService.getOverallReport(date, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Get monthly sales breakdown' })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2025 })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 3 })
  getMonthlySalesReport(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    return this.reportsService.getOverallReport(startDate, endDate);
  }
}
