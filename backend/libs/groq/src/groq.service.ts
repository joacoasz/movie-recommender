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

const SYSTEM_PROMPT =
  'Sos un sistema de recomendación de películas. Respondé siempre con un único objeto JSON ' +
  'válido y nada más, con el formato exacto {"title": string, "reason": string}. ' +
  '"title" es el nombre de la película recomendada y "reason" es una explicación breve, ' +
  'en español, de por qué se la recomendás a este usuario.';

@Injectable()
export class GroqService {
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({ apiKey: this.configService.get<string>('GROQ_API_KEY') });
    this.model = this.configService.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-120b';
  }

  async generateRecommendation(input: RecommendationInput): Promise<RecommendationResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: this.buildUserPrompt(input) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq no devolvió contenido en la respuesta');
    }

    const parsed: unknown = JSON.parse(content);
    if (!this.isRecommendationResult(parsed)) {
      throw new Error('La respuesta de Groq no tiene el formato esperado {title, reason}');
    }

    return parsed;
  }

  private buildUserPrompt({ username, likedMovies }: RecommendationInput): string {
    if (likedMovies.length === 0) {
      return `El usuario "${username}" todavía no marcó ninguna película como "me gusta". Recomendale una película popular y aclamada para empezar.`;
    }

    const titles = likedMovies.map((movie) => movie.title).join(', ');
    return `El usuario "${username}" marcó que le gustaron estas películas: ${titles}. Recomendale una película distinta a esas que probablemente le guste, basándote en el tipo de películas que disfruta.`;
  }

  private isRecommendationResult(value: unknown): value is RecommendationResult {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as RecommendationResult).title === 'string' &&
      typeof (value as RecommendationResult).reason === 'string'
    );
  }
}
