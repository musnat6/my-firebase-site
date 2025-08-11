'use server';

/**
 * @fileOverview Generates a match description based on the entry fee and game type.
 *
 * - generateMatchDescription - A function that generates a match description.
 * - GenerateMatchDescriptionInput - The input type for the generateMatchDescription function.
 * - GenerateMatchDescriptionOutput - The return type for the generateMatchDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMatchDescriptionInputSchema = z.object({
  entryFee: z.number().describe('The entry fee for the match.'),
  gameType: z.string().describe('The type of game (e.g., 1v1, Mini Tournament).'),
});
export type GenerateMatchDescriptionInput = z.infer<typeof GenerateMatchDescriptionInputSchema>;

const GenerateMatchDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated description for the match.'),
});
export type GenerateMatchDescriptionOutput = z.infer<typeof GenerateMatchDescriptionOutputSchema>;

export async function generateMatchDescription(input: GenerateMatchDescriptionInput): Promise<GenerateMatchDescriptionOutput> {
  return generateMatchDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMatchDescriptionPrompt',
  input: {schema: GenerateMatchDescriptionInputSchema},
  output: {schema: GenerateMatchDescriptionOutputSchema},
  prompt: `You are a creative copywriter specializing in generating engaging descriptions for online gaming matches. Given the entry fee and game type, generate a short, exciting, and enticing description to attract players to join the match.\n\nEntry Fee: {{{entryFee}}} Taka\nGame Type: {{{gameType}}}\n\nDescription: `,
});

const generateMatchDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMatchDescriptionFlow',
    inputSchema: GenerateMatchDescriptionInputSchema,
    outputSchema: GenerateMatchDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
