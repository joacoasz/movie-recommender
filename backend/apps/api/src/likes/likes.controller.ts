import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';

@UseGuards(JwtAuthGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.likesService.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateLikeDto) {
    return this.likesService.create(user.userId, dto);
  }

  @Delete(':tmdbMovieId')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('tmdbMovieId') tmdbMovieId: string) {
    return this.likesService.remove(user.userId, Number(tmdbMovieId));
  }
}
