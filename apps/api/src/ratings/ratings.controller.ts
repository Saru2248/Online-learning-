import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CreateRatingDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1) @Max(5)
  rating: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  review?: string;
}

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post(':courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Rate a course (must be enrolled)' })
  create(@Param('courseId') courseId: string, @Body() dto: CreateRatingDto, @Request() req) {
    return this.ratingsService.create(req.user.id, courseId, dto.rating, dto.review);
  }

  @Get(':courseId')
  @ApiOperation({ summary: 'Get ratings for a course' })
  getForCourse(@Param('courseId') courseId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.ratingsService.getForCourse(courseId, +page || 1, +limit || 10);
  }
}
