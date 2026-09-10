import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.like.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: CreateLikeDto) {
    return this.prisma.like.upsert({
      where: { userId_tmdbMovieId: { userId, tmdbMovieId: dto.tmdbMovieId } },
      update: {},
      create: { userId, ...dto },
    });
  }

  remove(userId: string, tmdbMovieId: number) {
    return this.prisma.like.delete({
      where: { userId_tmdbMovieId: { userId, tmdbMovieId } },
    });
  }
}
