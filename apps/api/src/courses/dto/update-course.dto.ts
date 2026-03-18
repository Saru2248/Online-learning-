import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

// PartialType makes all fields optional for updates
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
