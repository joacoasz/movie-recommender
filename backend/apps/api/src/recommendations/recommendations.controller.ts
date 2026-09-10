import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.recommendationsService.list(user.userId);
  }

  @Post()
  request(@CurrentUser() user: CurrentUserPayload) {
    return this.recommendationsService.request(user.userId);
  }
}
