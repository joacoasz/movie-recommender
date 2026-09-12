import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { Subject } from 'rxjs';
import { RECOMMENDATION_UPDATES_CHANNEL } from '@app/database';

export interface RecommendationUpdatedEvent {
  id: string;
  userId: string;
  status: string;
  title: string | null;
  reason: string | null;
  posterPath: string | null;
  tmdbMovieId: number | null;
  overview: string | null;
}

@Injectable()
export class RecommendationEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecommendationEventsService.name);
  private readonly client: Client;
  private readonly subjectsByUserId = new Map<string, Set<Subject<RecommendationUpdatedEvent>>>();

  constructor(configService: ConfigService) {
    this.client = new Client({ connectionString: configService.getOrThrow<string>('DATABASE_URL') });
  }

  async onModuleInit() {
    await this.client.connect();
    await this.client.query(`LISTEN ${RECOMMENDATION_UPDATES_CHANNEL}`);
    this.client.on('notification', (message) => {
      if (message.channel !== RECOMMENDATION_UPDATES_CHANNEL || !message.payload) {
        return;
      }
      this.dispatch(JSON.parse(message.payload));
    });
    this.client.on('error', (error) => {
      this.logger.error('Se perdió la conexión LISTEN a Postgres', error);
    });
  }

  async onModuleDestroy() {
    await this.client.end();
  }

  subscribe(userId: string): Subject<RecommendationUpdatedEvent> {
    const subject = new Subject<RecommendationUpdatedEvent>();
    const subjects = this.subjectsByUserId.get(userId) ?? new Set();
    subjects.add(subject);
    this.subjectsByUserId.set(userId, subjects);
    return subject;
  }

  unsubscribe(userId: string, subject: Subject<RecommendationUpdatedEvent>) {
    const subjects = this.subjectsByUserId.get(userId);
    if (!subjects) {
      return;
    }
    subjects.delete(subject);
    if (subjects.size === 0) {
      this.subjectsByUserId.delete(userId);
    }
  }

  private dispatch(event: RecommendationUpdatedEvent) {
    const subjects = this.subjectsByUserId.get(event.userId);
    subjects?.forEach((subject) => subject.next(event));
  }
}
