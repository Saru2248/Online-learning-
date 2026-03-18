// ─────────────────────────────────────────────────────────────────────
//  Courses Service — CRUD, publishing, search indexing
// ─────────────────────────────────────────────────────────────────────

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SearchService } from '../search/search.service';
import slugify from 'slugify';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  // ─── Create Course ───────────────────────────────────────────────
  async create(dto: CreateCourseDto, instructorId: string) {
    const slug = slugify(dto.title, { lower: true, strict: true }) + '-' + Date.now();

    const course = await this.prisma.course.create({
      data: {
        ...dto,
        slug,
        instructorId,
        courseSkills: dto.skillIds
          ? {
              create: dto.skillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
      },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        category: true,
        courseSkills: { include: { skill: true } },
      },
    });

    // Index in Meilisearch for full-text search
    await this.searchService.indexCourse(course);
    return course;
  }

  // ─── Find All Courses ────────────────────────────────────────────
  async findAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    minPrice?: number;
    maxPrice?: number;
    instructorId?: string;
  }) {
    const { page = 1, limit = 12, category, level, minPrice, maxPrice, instructorId } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
      ...(category && { category: { slug: category } }),
      ...(level && { level }),
      ...(instructorId && { instructorId }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          courseSkills: { include: { skill: true } },
          _count: { select: { enrollments: true, ratings: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Find One Course ─────────────────────────────────────────────
  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, avatar: true, bio: true },
        },
        category: true,
        courseSkills: { include: { skill: true } },
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                duration: true,
                type: true,
                isFree: true,
                order: true,
              },
            },
            quizzes: { select: { id: true, title: true } },
          },
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: {
          select: { enrollments: true, ratings: true, sections: true },
        },
      },
    });

    if (!course) throw new NotFoundException(`Course not found`);

    // Increment view count
    await this.prisma.course.update({
      where: { id },
      data: { totalViews: { increment: 1 } },
    });

    return course;
  }

  // ─── Update Course ───────────────────────────────────────────────
  async update(id: string, dto: UpdateCourseDto, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.skillIds && {
          courseSkills: {
            deleteMany: {},
            create: dto.skillIds.map((skillId) => ({ skillId })),
          },
        }),
      },
    });

    // Re-index in search
    await this.searchService.indexCourse(updated);
    return updated;
  }

  // ─── Publish / Unpublish ─────────────────────────────────────────
  async publish(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== userId) throw new ForbiddenException();

    return this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
  }

  // ─── Get Trending Courses ────────────────────────────────────────
  async getTrending(limit = 8) {
    // Get courses with most interactions in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trending = await this.prisma.interaction.groupBy({
      by: ['courseId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        courseId: { not: null },
      },
      _count: { courseId: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: limit,
    });

    const courseIds = trending
      .map((t) => t.courseId)
      .filter(Boolean) as string[];

    return this.prisma.course.findMany({
      where: { id: { in: courseIds }, status: 'PUBLISHED' },
      include: {
        instructor: { select: { id: true, name: true, avatar: true } },
        courseSkills: { include: { skill: true } },
      },
    });
  }

  // ─── Delete Course ───────────────────────────────────────────────
  async remove(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    if (course.instructorId !== userId) throw new ForbiddenException();

    await this.prisma.course.delete({ where: { id } });
    await this.searchService.removeCourse(id);
    return { message: 'Course deleted' };
  }
}
