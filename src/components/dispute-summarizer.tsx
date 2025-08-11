
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { summarizeDispute, SummarizeDisputeOutput } from '@/ai/flows/summarize-disputes';
import { Loader2 } from 'lucide-react';

export function DisputeSummarizer() {
  const [disputeDetails, setDisputeDetails] = useState('');
  const [matchDetails, setMatchDetails] = useState('');
  const [result, setResult] = useState<SummarizeDisputeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const summary = await summarizeDispute({ disputeDetails, matchDetails });
      setResult(summary);
    } catch (error) {
      console.error('Error summarizing dispute:', error);
      alert('Failed to get summary. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Dispute Resolution</CardTitle>
        <CardDescription>
          Paste the details of a player dispute and the relevant match to get an AI-generated summary and suggested action.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="dispute-details">Dispute Details</Label>
            <Textarea
              id="dispute-details"
              placeholder="Enter the details submitted by the players..."
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              required
              rows={6}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="match-details">Match Details</Label>
            <Textarea
              id="match-details"
              placeholder="Provide context about the match (e.g., players involved, entry fee, time)..."
              value={matchDetails}
              onChange={(e) => setMatchDetails(e.target.value)}
              required
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Summarize Dispute
          </Button>
        </CardFooter>
      </form>
      {result && (
        <CardContent className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-2">AI Summary & Suggestion</h3>
            <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                <div>
                    <h4 className="font-semibold">Summary:</h4>
                    <p className="text-sm">{result.summary}</p>
                </div>
                 <div>
                    <h4 className="font-semibold">Suggested Action:</h4>
                    <p className="text-sm">{result.suggestedAction}</p>
                </div>
            </div>
        </CardContent>
      )}
    </Card>
  );
}
