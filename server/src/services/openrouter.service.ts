import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterResponse<T> {
  data: T | null;
  error?: string;
}

export class OpenRouterService {
  /**
   * Generates a structured JSON response from OpenRouter
   * @param systemPrompt The instructions for the AI
   * @param userPrompt The user's input/data
   * @returns Parsed JSON of type T
   */
  static async generateStructuredResponse<T>(systemPrompt: string, userPrompt: string): Promise<OpenRouterResponse<T>> {
    if (!OPENROUTER_API_KEY) {
      console.error('Missing OPENROUTER_API_KEY environment variable.');
      return { data: null, error: 'AI integration is not configured properly.' };
    }

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://jurisai.com', // Required by OpenRouter
          'X-Title': 'JurisAI Copilot',          // Required by OpenRouter
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash', // A fast, structured JSON capable model
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API Error:', errorText);
        return { data: null, error: 'Failed to communicate with AI Provider.' };
      }

      const data = await response.json();
      const contentString = data.choices[0].message.content;

      try {
        const parsedContent = JSON.parse(contentString) as T;
        return { data: parsedContent };
      } catch (e) {
        console.error('Failed to parse OpenRouter response as JSON:', contentString);
        return { data: null, error: 'Malformed response from AI Provider.' };
      }

    } catch (error: any) {
      console.error('OpenRouter Exception:', error);
      return { data: null, error: error.message || 'An unexpected error occurred.' };
    }
  }
}
