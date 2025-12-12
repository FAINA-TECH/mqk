// src/kitchen/kitchen.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { CreateKitchenDto } from './dto/create-kitchen.dto';
import { UpdateKitchenDto } from './dto/update-kitchen.dto';
import { CreateStoveDto } from './dto/create-stove.dto';
import { UpdateStoveDto } from './dto/update-stove.dto';
import { CreateBurnerDto } from './dto/create-burner.dto';
import { UpdateBurnerDto } from './dto/update-burner.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('kitchens')
@Controller('kitchens')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  // ==================== KITCHEN ENDPOINTS ====================

  @Post()
  @ApiOperation({ summary: 'Create a new kitchen' })
  @ApiResponse({ status: 201, description: 'Kitchen created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createKitchen(@Body() createKitchenDto: CreateKitchenDto) {
    return this.kitchenService.createKitchen(createKitchenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all kitchens' })
  @ApiResponse({ status: 200, description: 'Returns all kitchens' })
  findAllKitchens() {
    return this.kitchenService.findAllKitchens();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a kitchen by ID' })
  @ApiResponse({ status: 200, description: 'Returns the kitchen' })
  @ApiResponse({ status: 404, description: 'Kitchen not found' })
  findKitchenById(@Param('id') id: string) {
    return this.kitchenService.findKitchenById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a kitchen' })
  @ApiResponse({ status: 200, description: 'Kitchen updated successfully' })
  @ApiResponse({ status: 404, description: 'Kitchen not found' })
  updateKitchen(
    @Param('id') id: string,
    @Body() updateKitchenDto: UpdateKitchenDto,
  ) {
    return this.kitchenService.updateKitchen(id, updateKitchenDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a kitchen' })
  @ApiResponse({ status: 204, description: 'Kitchen deleted successfully' })
  @ApiResponse({ status: 404, description: 'Kitchen not found' })
  removeKitchen(@Param('id') id: string) {
    return this.kitchenService.removeKitchen(id);
  }

  @Put(':id/worker')
  @ApiOperation({ summary: 'Assign a worker to a kitchen' })
  @ApiResponse({ status: 200, description: 'Worker assigned successfully' })
  @ApiResponse({ status: 404, description: 'Kitchen or worker not found' })
  assignWorker(
    @Param('id') id: string,
    @Body() assignWorkerDto: AssignWorkerDto,
  ) {
    return this.kitchenService.assignWorker(
      id,
      assignWorkerDto.workerNationalId,
    );
  }

  @Get('worker/:nationalId')
  @ApiOperation({ summary: 'Get kitchens by worker national ID' })
  @ApiResponse({ status: 200, description: 'Returns kitchens for the worker' })
  findKitchensByWorker(@Param('nationalId') nationalId: string) {
    return this.kitchenService.findKitchensByWorker(nationalId);
  }

  // ==================== STOVE ENDPOINTS ====================

  @Post('stove')
  @ApiOperation({ summary: 'Create a new stove' })
  @ApiResponse({ status: 201, description: 'Stove created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Stove ID already exists' })
  createStove(@Body() createStoveDto: CreateStoveDto) {
    return this.kitchenService.createStove(createStoveDto);
  }

  @Get('stove/all')
  @ApiOperation({ summary: 'Get all stoves' })
  @ApiResponse({ status: 200, description: 'Returns all stoves' })
  findAllStoves() {
    return this.kitchenService.findAllStoves();
  }

  @Get('stove/:id')
  @ApiOperation({ summary: 'Get a stove by ID' })
  @ApiResponse({ status: 200, description: 'Returns the stove' })
  @ApiResponse({ status: 404, description: 'Stove not found' })
  findStoveById(@Param('id') id: string) {
    return this.kitchenService.findStoveById(id);
  }

  @Put('stove/:id')
  @ApiOperation({ summary: 'Update a stove' })
  @ApiResponse({ status: 200, description: 'Stove updated successfully' })
  @ApiResponse({ status: 404, description: 'Stove not found' })
  @ApiResponse({ status: 409, description: 'Stove ID already exists' })
  updateStove(
    @Param('id') id: string,
    @Body() updateStoveDto: UpdateStoveDto,
  ) {
    return this.kitchenService.updateStove(id, updateStoveDto);
  }

  @Delete('stove/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stove' })
  @ApiResponse({ status: 204, description: 'Stove deleted successfully' })
  @ApiResponse({ status: 404, description: 'Stove not found' })
  removeStove(@Param('id') id: string) {
    return this.kitchenService.removeStove(id);
  }

  // ==================== BURNER ENDPOINTS ====================

  @Post('burner')
  @ApiOperation({ summary: 'Create a new burner for a stove' })
  @ApiResponse({ status: 201, description: 'Burner created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Burner position already taken' })
  createBurner(@Body() createBurnerDto: CreateBurnerDto) {
    return this.kitchenService.createBurner(createBurnerDto);
  }

  @Get('burner/all')
  @ApiOperation({ summary: 'Get all burners' })
  @ApiResponse({ status: 200, description: 'Returns all burners' })
  findAllBurners() {
    return this.kitchenService.findAllBurners();
  }

  @Get('burner/:id')
  @ApiOperation({ summary: 'Get a burner by ID' })
  @ApiResponse({ status: 200, description: 'Returns the burner' })
  @ApiResponse({ status: 404, description: 'Burner not found' })
  findBurnerById(@Param('id') id: string) {
    return this.kitchenService.findBurnerById(id);
  }

  @Put('burner/:id')
  @ApiOperation({ summary: 'Update a burner' })
  @ApiResponse({ status: 200, description: 'Burner updated successfully' })
  @ApiResponse({ status: 404, description: 'Burner not found' })
  @ApiResponse({ status: 409, description: 'Burner position already taken' })
  updateBurner(
    @Param('id') id: string,
    @Body() updateBurnerDto: UpdateBurnerDto,
  ) {
    return this.kitchenService.updateBurner(id, updateBurnerDto);
  }

  @Delete('burner/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a burner' })
  @ApiResponse({ status: 204, description: 'Burner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Burner not found' })
  removeBurner(@Param('id') id: string) {
    return this.kitchenService.removeBurner(id);
  }
}