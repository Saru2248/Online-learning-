import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Quiz and Certificates are lightweight modules - full implementation below

@Module({
  imports: [PrismaModule],
  providers: [],
})
export class QuizModule {}
