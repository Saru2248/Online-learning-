// ─────────────────────────────────────────────────────────────────────
//  Enrollments Service
// ─────────────────────────────────────────────────────────────────────

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionsService } from '../interactions/interactions.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private interactions: InteractionsService,
  ) {}

  // ─── Enroll in a Course ──────────────────────────────────────────
  async enroll(userId: string, courseId: string) {
    // Check course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, status: 'PUBLISHED' },
    });
    if (!course) throw new NotFoundException('Course not found or not published');

    // Check not already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course');

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId },
    });

    // Update course student count
    await this.prisma.course.update({
      where: { id: courseId },
      data: { totalStudents: { increment: 1 } },
    });

    // Log enrollment interaction for recommendation engine
    await this.interactions.log({
      userId,
      courseId,
      type: 'ENROLL',
      metadata: { courseTitle: course.title },
    });

    return enrollment;
  }

  // ─── Get User's Enrollments ──────────────────────────────────────
  async getUserEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, avatar: true } },
            _count: { select: { sections: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Calculate progress for each enrollment
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await this.getEnrollmentProgress(
          userId,
          enrollment.courseId,
        );
        return { ...enrollment, progress };
      }),
    );

    return enriched;
  }

  // ─── Get Progress Percentage ─────────────────────────────────────
  async getEnrollmentProgress(userId: string, courseId: string) {
    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({
        where: { section: { courseId } },
      }),
      this.prisma.progress.count({
        where: { userId, courseId, isCompleted: true },
      }),
    ]);

    const percentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { totalLessons, completedLessons, percentage };
  }

  // ─── Check Enrollment Status ─────────────────────────────────────
  async checkEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return {
      isEnrolled: !!enrollment,
      enrollment,
    };
  }

  // ─── Drop a Course ───────────────────────────────────────────────
  async drop(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    await this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: 'DROPPED' },
    });

    return { message: 'Successfully dropped the course' };
  }
}
