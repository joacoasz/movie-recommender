import { Controller, Get, MessageEvent, Post, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';
import { RecommendationEventsService } from './recommendation-events.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly recommendationEvents: RecommendationEventsService,
  ) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.recommendationsService.list(user.userId);
  }

  @Post()
  request(@CurrentUser() user: CurrentUserPayload) {
    return this.recommendationsService.request(user.userId);
  }

  // EventSource no permite mandar headers custom, así que a esta ruta el JWT
  // le llega por query param (`?token=`) en vez de Authorization — ver JwtStrategy.
  @Sse('stream')
  stream(@CurrentUser() user: CurrentUserPayload): Observable<MessageEvent> {
    const subject = this.recommendationEvents.subscribe(user.userId);
    return subject.asObservable().pipe(
      map((event) => ({ data: event })),
      finalize(() => this.recommendationEvents.unsubscribe(user.userId, subject)),
    );
  }
}
