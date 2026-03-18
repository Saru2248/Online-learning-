import {
  IsString, IsNumber, IsEnum, IsOptional, IsBoolean,
  IsArray, MinLength, MaxLength, Min, Max
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ example: 'Complete React Development Course' })
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Learn React from scratch to advanced...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDesc?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  previewVideo?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: CourseLevel, default: 'BEGINNER' })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty({ required: false, default: 'English' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ required: false, example: ['react', 'javascript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Array of skill IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];
}
