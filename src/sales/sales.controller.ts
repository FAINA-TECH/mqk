// src/sales/sales.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales' })
  @ApiBody({
    type: CreateSaleDto,
    description: 'Json structure for dsales object',
  })
  create(@Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Sales' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':salesId')
  @ApiOperation({ summary: 'Get a Sales by id' })
  findOne(@Param('salesId') salesId: string) {
    return this.salesService.findOne(salesId);
  }

  @Patch(':salesId')
  @ApiOperation({ summary: 'Update a Sales by id' })
  update(
    @Param('salesId') salesId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(salesId, updateSaleDto);
  }

  @Delete(':salesId')
  @ApiOperation({ summary: 'Delete a Sales by id' })
  remove(@Param('salesId') salesId: string) {
    return this.salesService.remove(salesId);
  }
}
