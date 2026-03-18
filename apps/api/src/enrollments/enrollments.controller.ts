import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  // POST /api/enrollments/:courseId
  @Post(':courseId')
  @ApiOperation({ summary: 'Enroll in a course' })
  enroll(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.enroll(req.user.id, courseId);
  }

  // GET /api/enrollments
  @Get()
  @ApiOperation({ summary: 'Get all my enrolled courses' })
  getMyEnrollments(@Request() req) {
    return this.enrollmentsService.getUserEnrollments(req.user.id);
  }

  // GET /api/enrollments/:courseId/check
  @Get(':courseId/check')
  @ApiOperation({ summary: 'Check if enrolled in a specific course' })
  checkEnrollment(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.checkEnrollment(req.user.id, courseId);
  }

  // DELETE /api/enrollments/:courseId
  @Delete(':courseId')
  @ApiOperation({ summary: 'Drop a course' })
  drop(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentsService.drop(req.user.id, courseId);
  }
}
