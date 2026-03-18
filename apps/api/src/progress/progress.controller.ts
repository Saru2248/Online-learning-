import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  // POST /api/progress
  @Post()
  @ApiOperation({ summary: 'Update lesson watch progress' })
  update(@Body() dto: UpdateProgressDto, @Request() req) {
    return this.progressService.updateProgress(req.user.id, dto);
  }

  // GET /api/progress/:courseId
  @Get(':courseId')
  @ApiOperation({ summary: 'Get progress for a specific course' })
  getCourseProgress(@Param('courseId') courseId: string, @Request() req) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }
}
