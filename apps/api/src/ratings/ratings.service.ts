// Ratings, Wishlist, Quiz, Certificates, Users stub modules

// ─── ratings.service.ts ───
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, courseId: string, rating: number, review?: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('You must be enrolled to rate this course');

    const existing = await this.prisma.rating.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('You have already rated this course');

    const ratingRecord = await this.prisma.rating.create({
      data: { userId, courseId, rating, review },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Recalculate average rating
    await this.recalcAvgRating(courseId);
    return ratingRecord;
  }

  async getForCourse(courseId: string, page = 1, limit = 10) {
    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where: { courseId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.rating.count({ where: { courseId } }),
    ]);
    return { data: ratings, meta: { total, page, limit } };
  }

  private async recalcAvgRating(courseId: string) {
    const ratingAgg = await this.prisma.rating.aggregate({
      where: { courseId },
      _avg: { rating: true }
    });
    
    const totalRatings = await this.prisma.rating.count({ where: { courseId } });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        avgRating: Math.round((ratingAgg._avg.rating || 0) * 10) / 10,
        totalRatings,
      },
    });
  }
}
