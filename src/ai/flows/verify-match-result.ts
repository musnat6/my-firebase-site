
'use server';
/**
 * @fileOverview An AI agent that verifies a match result from a screenshot.
 *
 * - verifyMatchResult - A function that handles the result verification.
 * - VerifyMatchResultInput - The input type for the verifyMatchResult function.
 * - VerifyMatchResultOutput - The return type for the verifyMatchResult function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerSchema = z.object({
    uid: z.string().describe('The unique ID of the player.'),
    username: z.string().describe('The username of the player.'),
});

const VerifyMatchResultInputSchema = z.object({
  player1: PlayerSchema,
  player2: PlayerSchema,
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot of the match result, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyMatchResultInput = z.infer<typeof VerifyMatchResultInputSchema>;

const VerifyMatchResultOutputSchema = z.object({
  winner: PlayerSchema.describe("The player object of the detected winner."),
  reasoning: z.string().describe('A concise explanation of how the winner was determined from the screenshot.'),
  confidence: z.number().min(0).max(1).describe('The AI\'s confidence level in its decision, from 0.0 to 1.0.'),
});
export type VerifyMatchResultOutput = z.infer<typeof VerifyMatchResultOutputSchema>;

export async function verifyMatchResult(input: VerifyMatchResultInput): Promise<VerifyMatchResultOutput> {
  return verifyMatchResultFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyMatchResultPrompt',
  input: {schema: VerifyMatchResultInputSchema},
  output: {schema: VerifyMatchResultOutputSchema},
  prompt: `You are an expert esports referee for an online gaming platform. Your task is to analyze a screenshot of a match result and determine the winner between two players.

Players:
- Player 1: {{player1.username}} (ID: {{player1.uid}})
- Player 2: {{player2.username}} (ID: {{player2.uid}})

Analyze the provided screenshot to identify the final score and declare the winner. The player with the higher score is the winner.

Your response MUST be in the specified JSON format.
- Identify the winning player and provide their full player object (uid and username) in the 'winner' field.
- In the 'reasoning' field, briefly explain how you determined the winner (e.g., "Player1 won 2-1 against Player2").
- In the 'confidence' field, provide a score from 0.0 to 1.0 indicating your confidence in the result. Be critical; if the screenshot is blurry, cropped, or ambiguous, provide a lower confidence score.

Screenshot: {{media url=screenshotDataUri}}`,
});

const verifyMatchResultFlow = ai.defineFlow(
  {
    name: 'verifyMatchResultFlow',
    inputSchema: VerifyMatchResultInputSchema,
    outputSchema: VerifyMatchResultOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("The AI failed to return a valid result.");
    }
    return output;
  }
);
