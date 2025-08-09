import type { OpenAIConfig } from '@/types';

export class OpenAIClient {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async complete(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    options: {
      responseFormat?: 'json_object';
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const {
      responseFormat,
      maxTokens = 1500,
      temperature = 0.1
    } = options;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4o-mini-2024-07-18',
          messages,
          max_tokens: maxTokens,
          temperature,
          ...(responseFormat && { response_format: { type: responseFormat } })
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async parseJSON<T>(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    maxTokens: number = 1500
  ): Promise<T> {
    const response = await this.complete(messages, {
      responseFormat: 'json_object',
      maxTokens,
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }
}