// src/kitchen/kitchen.controller.ts
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
import { CreateBurnerDto } from './dto/create-burner.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('kitchens')
@Controller('kitchens')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new kitchen' })
  createKitchen(@Body() createKitchenDto: CreateKitchenDto) {
    return this.kitchenService.createKitchen(createKitchenDto);
  }

  @Put(':id/worker')
  @ApiOperation({ summary: 'Assign a worker a kitchen' })
  assignWorker(
    @Param('id') id: string,
    @Body() assignWorkerDto: AssignWorkerDto,
  ) {
    return this.kitchenService.assignWorker(
      id,
      assignWorkerDto.workerNationalId,
    );
  }

  @Delete(':id/worker')
  @ApiOperation({ summary: 'Unassign worker from a kitchen' })
  unassignWorker(@Param('id') id: string) {
    return this.kitchenService.assignWorker(id, null);
  }

  @Post('burner')
  @ApiOperation({ summary: 'Create a new burner' })
  createBurner(@Body() createBurnerDto: CreateBurnerDto) {
    return this.kitchenService.createBurner(createBurnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all kitchens' })
  findAllKitchens() {
    return this.kitchenService.findAllKitchens();
  }

  @Get('worker/:nationalId')
  @ApiOperation({ summary: 'Get kitchens by worker national ID' })
  findKitchensByWorker(@Param('nationalId') nationalId: string) {
    return this.kitchenService.findKitchensByWorker(nationalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a kitchen by ID' })
  findKitchenById(@Param('id') id: string) {
    return this.kitchenService.findKitchenById(id);
  }

  @Get('burner/:id')
  @ApiOperation({ summary: 'Get a burner by ID' })
  findBurnerById(@Param('id') id: string) {
    return this.kitchenService.findBurnerById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a kitchen by ID' })
  updateKitchen(@Param('id') id: string, @Body() updateKitchenDto: any) {
    return this.kitchenService.updateKitchen(id, updateKitchenDto);
  }

  @Put('burner/:id')
  @ApiOperation({ summary: 'Update a burner by ID' })
  updateBurner(@Param('id') id: string, @Body() updateBurnerDto: any) {
    return this.kitchenService.updateBurner(id, updateBurnerDto);
  }
  @Get(':id/burners')
  @ApiOperation({ summary: 'Get all burners for a specific kitchen' })
  findBurnersByKitchen(@Param('id') id: string) {
    return this.kitchenService.findBurnersByKitchenId(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a kitchen by ID' })
  removeKitchen(@Param('id') id: string) {
    return this.kitchenService.removeKitchen(id);
  }

  @Delete('burner/:id')
  @ApiOperation({ summary: 'Delete a burner by ID' })
  removeBurner(@Param('id') id: string) {
    return this.kitchenService.removeBurner(id);
  }
}
