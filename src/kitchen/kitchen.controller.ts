import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { CreateKitchenDto } from './dto/create-kitchen.dto';
import { CreateStoveDto } from './dto/create-stove.dto';
import { CreateBurnerDto } from './dto/create-burner.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('kitchens')
@Controller('kitchens')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  // Kitchens
  @Post()
  @ApiOperation({ summary: 'Create a new kitchen' })
  createKitchen(@Body() createKitchenDto: CreateKitchenDto) {
    return this.kitchenService.createKitchen(createKitchenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all kitchens' })
  findAllKitchens() {
    return this.kitchenService.findAllKitchens();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a kitchen by ID' })
  findKitchenById(@Param('id') id: string) {
    return this.kitchenService.findKitchenById(id);
  }

  @Put(':id/worker')
  @ApiOperation({ summary: 'Assign a worker a kitchen' })
  assignWorker(
    @Param('id') id: string,
    @Body() assignWorkerDto: AssignWorkerDto,
  ) {
    return this.kitchenService.assignWorker(id, assignWorkerDto.workerNationalId);
  }

  // Stoves
  @Post('stove')
  @ApiOperation({ summary: 'Create a new stove' })
  createStove(@Body() createStoveDto: CreateStoveDto) {
    return this.kitchenService.createStove(createStoveDto);
  }

  @Get('stove/all')
  @ApiOperation({ summary: 'Get all stoves' })
  findAllStoves() {
    return this.kitchenService.findAllStoves();
  }

  // Burners
  @Post('burner')
  @ApiOperation({ summary: 'Create a new burner for a stove' })
  createBurner(@Body() createBurnerDto: CreateBurnerDto) {
    return this.kitchenService.createBurner(createBurnerDto);
  }

  @Get('burner/:id')
  @ApiOperation({ summary: 'Get a burner by ID' })
  findBurnerById(@Param('id') id: string) {
    return this.kitchenService.findBurnerById(id);
  }

  @Get('worker/:nationalId')
  @ApiOperation({ summary: 'Get kitchens by worker national ID' })
  findKitchensByWorker(@Param('nationalId') nationalId: string) {
    return this.kitchenService.findKitchensByWorker(nationalId);
  }
}