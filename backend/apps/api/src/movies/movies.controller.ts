import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MoviesService } from './movies.service';

@UseGuards(JwtAuthGuard)
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  list(@Query('page') page?: string, @Query('query') query?: string) {
    return this.moviesService.list(page ? Number(page) : 1, query);
  }

  @Get(':id')
  getDetails(@Param('id') id: string) {
    return this.moviesService.getDetails(Number(id));
  }
}
