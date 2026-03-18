import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Post(':courseId')
  @ApiOperation({ summary: 'Toggle course in wishlist' })
  toggle(@Param('courseId') courseId: string, @Request() req) {
    return this.wishlistService.toggle(req.user.id, courseId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my wishlist' })
  getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.id);
  }
}
