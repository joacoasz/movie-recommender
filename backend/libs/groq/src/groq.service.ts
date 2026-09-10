import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface RecommendationInput {
  username: string;
  likedMovies: { title: string }[];
}

export interface RecommendationResult {
  title: string;
  reason: string;
}

@Injectable()
export class GroqService {
  private readonly client: Groq;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
  }

  async generateRecommendation(input: RecommendationInput): Promise<RecommendationResult> {
    // TODO: construir el prompt con `input.username` + `input.likedMovies`,
    // llamar a this.client.chat.completions.create(...) y parsear la respuesta a { title, reason }.
    throw new Error(`Not implemented: generateRecommendation(${input.username})`);
  }
}
