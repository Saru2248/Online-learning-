import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ example: 'lesson-id-here' })
  @IsString()
  lessonId: string;

  @ApiProperty({ example: 1200, description: 'Seconds watched' })
  @IsNumber()
  @Min(0)
  watchedSeconds: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
