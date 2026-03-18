// ─────────────────────────────────────────────────────────────────────
//  Courses Controller
// ─────────────────────────────────────────────────────────────────────

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  // GET /api/courses
  @Get()
  @ApiOperation({ summary: 'Get all published courses with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'level', required: false })
  findAll(@Query() query: any) {
    return this.coursesService.findAll({
      page: +query.page || 1,
      limit: +query.limit || 12,
      category: query.category,
      level: query.level,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
    });
  }

  // GET /api/courses/trending
  @Get('trending')
  @ApiOperation({ summary: 'Get trending courses based on recent interactions' })
  getTrending(@Query('limit') limit?: number) {
    return this.coursesService.getTrending(+limit || 8);
  }

  // GET /api/courses/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get course details with sections and lessons' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  // POST /api/courses
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new course (instructors only)' })
  create(@Body() dto: CreateCourseDto, @Request() req) {
    return this.coursesService.create(dto, req.user.id);
  }

  // PUT /api/courses/:id
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a course' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Request() req) {
    return this.coursesService.update(id, dto, req.user.id);
  }

  // PATCH /api/courses/:id/publish
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish a course' })
  publish(@Param('id') id: string, @Request() req) {
    return this.coursesService.publish(id, req.user.id);
  }

  // DELETE /api/courses/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a course' })
  remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(id, req.user.id);
  }
}
