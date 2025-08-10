'use server';

/**
 * @fileOverview An AI agent that summarizes player submitted disputes for admin review.
 *
 * - summarizeDispute - A function that handles the dispute summarization process.
 * - SummarizeDisputeInput - The input type for the summarizeDispute function.
 * - SummarizeDisputeOutput - The return type for the summarizeDispute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDisputeInputSchema = z.object({
  disputeDetails: z
    .string()
    .describe('Details of the dispute submitted by players.'),
  matchDetails: z.string().describe('Details of the match in question.'),
});
export type SummarizeDisputeInput = z.infer<typeof SummarizeDisputeInputSchema>;

const SummarizeDisputeOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the dispute.'),
  suggestedAction: z
    .string()
    .describe(
      'A suggested action for the admin to take based on the dispute summary.'
    ),
});
export type SummarizeDisputeOutput = z.infer<typeof SummarizeDisputeOutputSchema>;

export async function summarizeDispute(input: SummarizeDisputeInput): Promise<SummarizeDisputeOutput> {
  return summarizeDisputeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDisputePrompt',
  input: {schema: SummarizeDisputeInputSchema},
  output: {schema: SummarizeDisputeOutputSchema},
  prompt: `You are an AI assistant helping admins resolve disputes between players in an online gaming arena.

  Given the details of the dispute and the match, provide a concise summary of the dispute and suggest a fair action for the admin to take.

  Dispute Details: {{{disputeDetails}}}
  Match Details: {{{matchDetails}}}
  \n  Respond in the format:
  Summary: <summary of the dispute>
  Suggested Action: <suggested action for the admin>
  `,
});

const summarizeDisputeFlow = ai.defineFlow(
  {
    name: 'summarizeDisputeFlow',
    inputSchema: SummarizeDisputeInputSchema,
    outputSchema: SummarizeDisputeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
