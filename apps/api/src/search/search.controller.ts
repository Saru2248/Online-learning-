import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  // GET /api/search?q=react&level=BEGINNER&sortBy=rating
  @Get()
  @ApiOperation({ summary: 'Full-text search courses with filters' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'level', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_asc', 'price_desc', 'rating', 'popular', 'newest'] })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query() query: any) {
    return this.searchService.search({
      query: query.q || '',
      level: query.level,
      categoryId: query.categoryId,
      minPrice: query.minPrice ? +query.minPrice : undefined,
      maxPrice: query.maxPrice ? +query.maxPrice : undefined,
      minRating: query.minRating ? +query.minRating : undefined,
      sortBy: query.sortBy,
      page: +query.page || 1,
      limit: +query.limit || 12,
    });
  }
}
