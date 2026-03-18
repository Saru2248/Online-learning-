// ─────────────────────────────────────────────────────────────────────
//  Root App Module — Assembles all feature modules
// ─────────────────────────────────────────────────────────────────────

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { RatingsModule } from './ratings/ratings.module';
import { SearchModule } from './search/search.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InteractionsModule } from './interactions/interactions.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { QuizModule } from './quiz/quiz.module';
import { CertificatesModule } from './certificates/certificates.module';

@Module({
  imports: [
    // ─── Config: loads .env globally ─────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Rate Limiting: 100 requests per 60 seconds ───────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ─── Core Infrastructure ──────────────────────────────────────
    PrismaModule,

    // ─── Feature Modules ──────────────────────────────────────────
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    RatingsModule,
    SearchModule,
    RecommendationsModule,
    InteractionsModule,
    WishlistModule,
    QuizModule,
    CertificatesModule,
  ],
})
export class AppModule {}
