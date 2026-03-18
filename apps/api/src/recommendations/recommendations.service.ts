// ─────────────────────────────────────────────────────────────────────
//  Recommendations Service — Proxy to FastAPI ML service
// ─────────────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly recoUrl: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.recoUrl = config.get('RECO_SERVICE_URL', 'http://localhost:8000');
  }

  // ─── Get personalized recommendations for a user ─────────────────
  async getForUser(userId: string, limit = 10) {
    try {
      const response = await fetch(
        `${this.recoUrl}/recommend/user?user_id=${userId}&limit=${limit}`,
      );
      if (!response.ok) throw new Error('Reco service error');

      const { recommendations } = await response.json();
      const courseIds: string[] = recommendations.map((r: any) => r.course_id);

      // Fetch full course details from PostgreSQL
      return this.getCourseDetails(courseIds);
    } catch (error) {
      this.logger.warn('Reco service unavailable, falling back to popular courses');
      return this.getPopularCourses(limit);
    }
  }

  // ─── Get similar courses ─────────────────────────────────────────
  async getSimilar(courseId: string, limit = 6) {
    try {
      const response = await fetch(
        `${this.recoUrl}/recommend/similar?course_id=${courseId}&limit=${limit}`,
      );
      if (!response.ok) throw new Error('Reco service error');

      const { recommendations } = await response.json();
      const courseIds: string[] = recommendations.map((r: any) => r.course_id);

      return this.getCourseDetails(courseIds);
    } catch (error) {
      this.logger.warn('Similar courses fallback to random published');
      return this.prisma.course.findMany({
        where: { status: 'PUBLISHED', id: { not: courseId } },
        take: limit,
        include: {
          instructor: { select: { id: true, name: true } },
        },
      });
    }
  }

  // ─── Skill-gap recommendations ───────────────────────────────────
  async getSkillGap(userId: string, targetRole: string, limit = 8) {
    try {
      const response = await fetch(
        `${this.recoUrl}/recommend/skillgap?user_id=${userId}&target_role=${targetRole}&limit=${limit}`,
      );
      if (!response.ok) throw new Error('Reco service error');

      const data = await response.json();
      const courseIds: string[] = (data.recommendations || []).map((r: any) => r.course_id);
      const courses = await this.getCourseDetails(courseIds);

      return {
        missingSkills: data.missing_skills || [],
        courses,
      };
    } catch (error) {
      this.logger.warn('Skill gap service unavailable');
      return { missingSkills: [], courses: [] };
    }
  }

  // ─── Fallback: popular courses ────────────────────────────────────
  private async getPopularCourses(limit: number) {
    return this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ totalStudents: 'desc' }, { avgRating: 'desc' }],
      take: limit,
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
        courseSkills: { include: { skill: true } },
      },
    });
  }

  // ─── Fetch full course details by IDs ────────────────────────────
  private async getCourseDetails(courseIds: string[]) {
    if (!courseIds.length) return [];

    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds }, status: 'PUBLISHED' },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
        courseSkills: { include: { skill: true } },
      },
    });

    // Preserve recommendation order
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    return courseIds.map((id) => courseMap.get(id)).filter(Boolean);
  }
}
