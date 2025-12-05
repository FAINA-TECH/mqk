import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SaleTransactionService } from './sale-transaction.service';
import { CreateSaleTransactionDto } from './dto/create-sale-transaction.dto';
import { SaleTransaction } from './entities/sale-transaction.entity';

@ApiTags('sale-transactions')
@Controller('sale-transactions')
export class SaleTransactionController {
  constructor(
    private readonly saleTransactionService: SaleTransactionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction successfully created',
    type: SaleTransaction,
  })
  create(
    @Body() createSaleTransactionDto: CreateSaleTransactionDto,
  ): Promise<SaleTransaction> {
    return this.saleTransactionService.create(createSaleTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sale transactions' })
  @ApiResponse({
    status: 200,
    description: 'Return all transactions',
    type: [SaleTransaction],
  })
  findAll(): Promise<SaleTransaction[]> {
    return this.saleTransactionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale transaction by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the transaction',
    type: SaleTransaction,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string): Promise<SaleTransaction> {
    return this.saleTransactionService.findOne(id);
  }
}
