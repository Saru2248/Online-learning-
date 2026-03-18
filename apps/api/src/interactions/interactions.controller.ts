import { Controller, Post, Get, Body, Request, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InteractionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

class LogInteractionBody {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ enum: InteractionType })
  @IsEnum(InteractionType)
  type: InteractionType;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

@ApiTags('interactions')
@Controller('interactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a user interaction event' })
  log(@Body() body: LogInteractionBody, @Request() req) {
    return this.interactionsService.logFromRequest(req.user.id, body);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my recent interactions' })
  getMyInteractions(@Request() req, @Query('limit') limit?: number) {
    return this.interactionsService.getUserInteractions(req.user.id, +limit || 100);
  }
}
