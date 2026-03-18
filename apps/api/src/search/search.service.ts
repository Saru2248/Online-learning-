// ─────────────────────────────────────────────────────────────────────
//  Search Service — Meilisearch integration
// ─────────────────────────────────────────────────────────────────────

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private readonly INDEX_NAME = 'courses';

  constructor(private config: ConfigService) {
    this.client = new MeiliSearch({
      host: config.get('MEILISEARCH_URL', 'http://localhost:7700'),
      apiKey: config.get('MEILISEARCH_KEY', 'masterKey'),
    });
  }

  // ─── Configure Meilisearch on startup ───────────────────────────
  async onModuleInit() {
    try {
      const index = this.client.index(this.INDEX_NAME);

      // Set searchable attributes (ordered by importance)
      await index.updateSearchableAttributes([
        'title',
        'shortDesc',
        'description',
        'tags',
        'skills',
        'instructorName',
        'categoryName',
      ]);

      // Set filterable attributes for faceted search
      await index.updateFilterableAttributes([
        'level',
        'categoryId',
        'price',
        'status',
        'skills',
        'language',
        'avgRating',
      ]);

      // Set sortable attributes
      await index.updateSortableAttributes([
        'price',
        'avgRating',
        'totalStudents',
        'createdAt',
      ]);

      this.logger.log('✅ Meilisearch initialized');
    } catch (error) {
      this.logger.error('❌ Meilisearch init failed:', error.message);
    }
  }

  // ─── Index a single course ───────────────────────────────────────
  async indexCourse(course: any) {
    try {
      const doc = {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDesc: course.shortDesc,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        level: course.level,
        status: course.status,
        language: course.language,
        tags: course.tags,
        avgRating: course.avgRating,
        totalStudents: course.totalStudents,
        categoryId: course.categoryId,
        categoryName: course.category?.name || '',
        instructorId: course.instructorId,
        instructorName: course.instructor?.name || '',
        skills: course.courseSkills?.map((cs: any) => cs.skill.name) || [],
        createdAt: course.createdAt?.toISOString(),
      };

      await this.client.index(this.INDEX_NAME).addDocuments([doc]);
    } catch (error) {
      this.logger.error(`Failed to index course ${course.id}:`, error.message);
    }
  }

  // ─── Search courses ──────────────────────────────────────────────
  async search(params: {
    query: string;
    level?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const { query, level, categoryId, minPrice, maxPrice, minRating, sortBy, page = 1, limit = 12 } = params;

    // Build Meilisearch filter string
    const filters: string[] = ['status = PUBLISHED'];

    if (level) filters.push(`level = ${level}`);
    if (categoryId) filters.push(`categoryId = ${categoryId}`);
    if (minPrice !== undefined) filters.push(`price >= ${minPrice}`);
    if (maxPrice !== undefined) filters.push(`price <= ${maxPrice}`);
    if (minRating !== undefined) filters.push(`avgRating >= ${minRating}`);

    // Build sort
    const sort: string[] = [];
    if (sortBy === 'price_asc') sort.push('price:asc');
    else if (sortBy === 'price_desc') sort.push('price:desc');
    else if (sortBy === 'rating') sort.push('avgRating:desc');
    else if (sortBy === 'popular') sort.push('totalStudents:desc');
    else if (sortBy === 'newest') sort.push('createdAt:desc');

    return this.client.index(this.INDEX_NAME).search(query, {
      filter: filters.join(' AND '),
      sort: sort.length ? sort : undefined,
      offset: (page - 1) * limit,
      limit,
      attributesToHighlight: ['title', 'shortDesc'],
      attributesToRetrieve: [
        'id', 'title', 'slug', 'shortDesc', 'thumbnail', 'price',
        'level', 'avgRating', 'totalStudents', 'instructorName',
        'categoryName', 'skills', 'language',
      ],
    });
  }

  // ─── Remove course from index ────────────────────────────────────
  async removeCourse(courseId: string) {
    await this.client.index(this.INDEX_NAME).deleteDocument(courseId);
  }

  // ─── Bulk index all courses (for initial setup) ──────────────────
  async bulkIndex(courses: any[]) {
    const docs = courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDesc: course.shortDesc,
      description: course.description,
      thumbnail: course.thumbnail,
      price: course.price,
      level: course.level,
      status: course.status,
      tags: course.tags,
      avgRating: course.avgRating,
      totalStudents: course.totalStudents,
      categoryId: course.categoryId,
      categoryName: course.category?.name || '',
      instructorId: course.instructorId,
      instructorName: course.instructor?.name || '',
      skills: course.courseSkills?.map((cs: any) => cs.skill.name) || [],
      createdAt: course.createdAt?.toISOString(),
    }));

    await this.client.index(this.INDEX_NAME).addDocuments(docs);
    this.logger.log(`Indexed ${docs.length} courses`);
  }
}
