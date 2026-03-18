import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private recoService: RecommendationsService) {}

  // GET /api/recommendations/me  (requires auth)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get personalized recommendations for logged-in user' })
  getMyRecommendations(@Request() req, @Query('limit') limit?: number) {
    return this.recoService.getForUser(req.user.id, +limit || 10);
  }

  // GET /api/recommendations/similar/:courseId
  @Get('similar/:courseId')
  @ApiOperation({ summary: 'Get courses similar to a given course' })
  getSimilar(@Param('courseId') courseId: string, @Query('limit') limit?: number) {
    return this.recoService.getSimilar(courseId, +limit || 6);
  }

  // GET /api/recommendations/skillgap?targetRole=DataScientist
  @Get('skillgap')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get skill-gap courses for a target job role' })
  getSkillGap(@Request() req, @Query('role') role: string, @Query('limit') limit?: number) {
    return this.recoService.getSkillGap(req.user.id, role, +limit || 8);
  }
}
