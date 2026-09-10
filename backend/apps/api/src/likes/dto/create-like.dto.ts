import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLikeDto {
  @IsInt()
  tmdbMovieId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  posterPath?: string;
}
