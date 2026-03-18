// ─────────────────────────────────────────────────────────────────────
//  Interactions Service — Event tracking for recommendation engine
// ─────────────────────────────────────────────────────────────────────

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionType } from '@prisma/client';

interface LogInteractionDto {
  userId: string;
  courseId?: string;
  lessonId?: string;
  type: InteractionType;
  metadata?: Record<string, any>;
}

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  // ─── Log any interaction event ───────────────────────────────────
  async log(dto: LogInteractionDto) {
    return this.prisma.interaction.create({
      data: {
        userId: dto.userId,
        courseId: dto.courseId || null,
        lessonId: dto.lessonId || null,
        type: dto.type,
        metadata: dto.metadata || {},
      },
    });
  }

  // ─── Get user interactions (for recommendation engine) ───────────
  async getUserInteractions(userId: string, limit = 100) {
    return this.prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        course: { select: { id: true, title: true, tags: true } },
      },
    });
  }

  // ─── Get all interactions (for training ML model) ─────────────────
  async getAllInteractions(params: {
    type?: InteractionType;
    since?: Date;
    limit?: number;
  }) {
    return this.prisma.interaction.findMany({
      where: {
        ...(params.type && { type: params.type }),
        ...(params.since && { createdAt: { gte: params.since } }),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 10000,
      select: {
        userId: true,
        courseId: true,
        type: true,
        createdAt: true,
        metadata: true,
      },
    });
  }

  // ─── Log from HTTP request (controller handler) ──────────────────
  async logFromRequest(
    userId: string,
    body: { courseId?: string; type: InteractionType; metadata?: any },
  ) {
    return this.log({
      userId,
      courseId: body.courseId,
      type: body.type,
      metadata: body.metadata,
    });
  }
}
