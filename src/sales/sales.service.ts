// src/sales/sales.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}
  create(createSaleDto: CreateSaleDto) {
    const newSales = this.salesRepository.create(createSaleDto);
    return this.salesRepository.save(newSales);
  }

  findAll() {
    return this.salesRepository.find();
  }

  findOne(salesId: string): Promise<Sale> {
    return this.salesRepository.findOne({ where: { salesId } });
  }

  async update(salesId: string, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    await this.salesRepository.update({ salesId }, updateSaleDto);
    return this.salesRepository.findOne({ where: { salesId } });
  }

  async remove(salesId: string) {
    await this.salesRepository.delete({ salesId });
    return `Price ${salesId} has been deleted`;
  }
}
