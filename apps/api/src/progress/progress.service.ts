// ─────────────────────────────────────────────────────────────────────
//  Progress Service — Track lesson completion
// ─────────────────────────────────────────────────────────────────────

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionsService } from '../interactions/interactions.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private interactions: InteractionsService,
  ) {}

  // ─── Update lesson progress ──────────────────────────────────────
  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { section: { select: { courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const courseId = lesson.section.courseId;
    const wasCompleted = dto.isCompleted && dto.watchedSeconds >= lesson.duration * 60 * 0.8;

    // Upsert progress record
    const progress = await this.prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
      create: {
        userId,
        lessonId: dto.lessonId,
        courseId,
        isCompleted: wasCompleted,
        watchedSeconds: dto.watchedSeconds || 0,
        completedAt: wasCompleted ? new Date() : null,
      },
      update: {
        watchedSeconds: {
          // Keep maximum watched seconds
          set: Math.max(dto.watchedSeconds || 0, 0),
        },
        isCompleted: wasCompleted,
        completedAt: wasCompleted ? new Date() : undefined,
      },
    });

    // Log WATCH interaction
    await this.interactions.log({
      userId,
      courseId,
      type: 'WATCH',
      metadata: {
        lessonId: dto.lessonId,
        watchedSeconds: dto.watchedSeconds,
        isCompleted: wasCompleted,
      },
    });

    // If lesson completed, check if entire course is done
    if (wasCompleted) {
      await this.checkCourseCompletion(userId, courseId);
    }

    return progress;
  }

  // ─── Get course progress ─────────────────────────────────────────
  async getCourseProgress(userId: string, courseId: string) {
    const [allLessons, completedProgress] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { section: { courseId } },
        select: { id: true, title: true, duration: true, order: true },
      }),
      this.prisma.progress.findMany({
        where: { userId, courseId },
      }),
    ]);

    const progressMap = new Map(
      completedProgress.map((p) => [p.lessonId, p]),
    );

    const lessons = allLessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) || null,
    }));

    const completed = completedProgress.filter((p) => p.isCompleted).length;
    const percentage = allLessons.length > 0
      ? Math.round((completed / allLessons.length) * 100)
      : 0;

    return {
      courseId,
      totalLessons: allLessons.length,
      completedLessons: completed,
      percentage,
      lessons,
    };
  }

  // ─── Check and mark course complete ─────────────────────────────
  private async checkCourseCompletion(userId: string, courseId: string) {
    const [total, completed] = await Promise.all([
      this.prisma.lesson.count({ where: { section: { courseId } } }),
      this.prisma.progress.count({ where: { userId, courseId, isCompleted: true } }),
    ]);

    if (total > 0 && total === completed) {
      // Mark enrollment as completed
      await this.prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Award skills from the course
      await this.awardCourseSkills(userId, courseId);

      // Generate certificate
      await this.issueCertificate(userId, courseId);

      // Log COMPLETE interaction
      await this.interactions.log({
        userId,
        courseId,
        type: 'COMPLETE',
      });
    }
  }

  // ─── Award skills from completed course ──────────────────────────
  private async awardCourseSkills(userId: string, courseId: string) {
    const courseSkills = await this.prisma.courseSkill.findMany({
      where: { courseId },
    });

    for (const { skillId } of courseSkills) {
      await this.prisma.userSkill.upsert({
        where: { userId_skillId: { userId, skillId } },
        create: { userId, skillId, source: `course:${courseId}` },
        update: { level: { increment: 1 } },
      });
    }
  }

  // ─── Issue certificate ───────────────────────────────────────────
  private async issueCertificate(userId: string, courseId: string) {
    await this.prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        // In production: generate PDF and upload to S3
        certificateUrl: `/certificates/${userId}-${courseId}.pdf`,
      },
      update: {},
    });
  }
}
