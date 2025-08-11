'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest possible opponents
 * based on a player's win/loss ratio and a provided list of active players.
 *
 * - suggestOpponents - A function that suggests opponents for a player.
 * - SuggestOpponentsInput - The input type for the suggestOpponents function.
 * - SuggestOpponentsOutput - The return type for the suggestOpponents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { UserSchema } from '@/types/zod';

const SuggestOpponentsInputSchema = z.object({
  userId: z.string().describe('The ID of the player requesting opponent suggestions.'),
  winLossRatio: z.number().describe('The win/loss ratio of the player (wins / losses).'),
  gameType: z.string().describe('The type of game the player wants to play (e.g., "1v1", "Mini Tournament").'),
  numOpponents: z.number().default(3).describe('The number of opponents to suggest (default: 3).'),
  activePlayers: z.array(UserSchema).describe("A list of currently active players to choose from."),
});
export type SuggestOpponentsInput = z.infer<typeof SuggestOpponentsInputSchema>;

const OpponentSuggestionSchema = z.object({
  userId: z.string().describe('The ID of the suggested opponent.'),
  username: z.string().describe('The username of the suggested opponent.'),
  winLossRatio: z.number().describe('The win/loss ratio of the suggested opponent.'),
  stats: z.object({
    wins: z.number().describe('The number of wins of the suggested opponent.'),
    losses: z.number().describe('The number of losses of the suggested opponent.'),
    earnings: z.number().describe('The total earnings of the suggested opponent.'),
  }).optional(),
  profilePic: z.string().optional().describe('The profile picture URL of the suggested opponent')
});

const SuggestOpponentsOutputSchema = z.array(OpponentSuggestionSchema);
export type SuggestOpponentsOutput = z.infer<typeof SuggestOpponentsOutputSchema>;

export async function suggestOpponents(input: SuggestOpponentsInput): Promise<SuggestOpponentsOutput> {
  return suggestOpponentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOpponentsPrompt',
  input: { schema: SuggestOpponentsInputSchema },
  output: { schema: SuggestOpponentsOutputSchema },
  prompt: `You are an AI that suggests potential opponents for a player in an online gaming platform.

The player has a win/loss ratio of {{winLossRatio}} and wants to play a game of type {{gameType}}.

From the following list of active players, suggest {{numOpponents}} opponents with similar win/loss ratios to provide a challenging and fair match.

Prioritize players whose win/loss ratio is closest to the requesting player's ratio.

Available Active Players:
\`\`\`json
{{{json activePlayers}}}
\`\`\`

Output the suggestions as a JSON array of opponents, including their userId, username, and winLossRatio.
Make sure that all opponents in the list are valid and active players in the system.

`,
});

const suggestOpponentsFlow = ai.defineFlow(
  {
    name: 'suggestOpponentsFlow',
    inputSchema: SuggestOpponentsInputSchema,
    outputSchema: SuggestOpponentsOutputSchema,
  },
  async (input) => {
    // Transform activePlayers to include their winLossRatio for the prompt
    const playersWithRatio = input.activePlayers.map(p => ({
        ...p,
        winLossRatio: p.stats.losses > 0 ? p.stats.wins / p.stats.losses : p.stats.wins,
    }));
  
    const { output } = await prompt({ ...input, activePlayers: playersWithRatio });
    return output!;
  }
);

    