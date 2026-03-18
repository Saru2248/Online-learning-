import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, courseId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { userId_courseId: { userId, courseId } } });
      return { wishlisted: false };
    }

    await this.prisma.wishlist.create({ data: { userId, courseId } });
    return { wishlisted: true };
  }

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
