
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import type { Match, User } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Swords, Trophy, Upload, Home, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyMatchResult, VerifyMatchResultOutput } from '@/ai/flows/verify-match-result';

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<VerifyMatchResultOutput | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof matchId !== 'string') return;

    const matchRef = doc(db, 'matches', matchId);
    const unsubscribe = onSnapshot(matchRef, (doc) => {
      if (doc.exists()) {
        setMatch({ matchId: doc.id, ...doc.data() } as Match);
      } else {
        toast({ title: 'Error', description: 'Match not found.', variant: 'destructive' });
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, router, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitResult = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !user || !match) return;

    setIsSubmitting(true);
    setAiResult(null);

    try {
      const photoDataUri = await fileToDataUri(selectedFile);
      
      const opponent = match.players.find(p => p.uid !== user.uid);
      if (!opponent) throw new Error("Opponent not found");

      setIsVerifying(true);
      const result = await verifyMatchResult({
        player1: { uid: user.uid, username: user.username },
        player2: { uid: opponent.uid, username: opponent.username },
        screenshotDataUri: photoDataUri,
      });
      setAiResult(result);
      setIsVerifying(false);

      toast({ title: 'AI Verification Complete', description: 'The AI has analyzed the result.', className: 'bg-green-600 text-white' });

      // In a real scenario, you might auto-approve based on AI confidence
      // or flag for admin review. For now, we just display the result.
      // You could add a button to "Confirm & Finalize" which then updates the DB.

    } catch (error) {
      console.error('Error submitting result:', error);
      toast({
        title: 'Submission Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setIsVerifying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return null; // Or a not found component
  }
  
  const userIsInMatch = user && match.players.some(p => p.uid === user.uid);
  const isMatchInProgress = match.status === 'inprogress';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <Button onClick={() => router.back()} variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-headline font-bold truncate">{match.title}</h1>
            <Button onClick={() => router.push('/')} variant="outline" size="icon">
                <Home className="h-4 w-4" />
            </Button>
        </header>
        <main className="flex-1 space-y-6 p-4 md:p-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl">{match.title}</CardTitle>
                        <span className="text-muted-foreground text-sm">Entry Fee: <strong className="text-primary font-bold">{match.entryFee}৳</strong></span>
                    </div>
                    <CardDescription>{match.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-around">
                        {match.players.map((player) => (
                            <div key={player.uid} className="flex flex-col items-center gap-2">
                                <Avatar className="h-20 w-20 border-4 border-primary/20">
                                    <AvatarImage src={player.profilePic} alt={player.username} />
                                    <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-lg">{player.username}</span>
                            </div>
                        ))}
                         {match.players.length === 1 && (
                            <>
                                <Swords className="h-12 w-12 text-muted-foreground" />
                                <div className="flex flex-col items-center gap-2">
                                    <Avatar className="h-20 w-20 border-4 border-dashed">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    </Avatar>
                                    <span className="font-bold text-lg text-muted-foreground">Waiting...</span>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {userIsInMatch && isMatchInProgress && (
                <Card>
                    <CardHeader>
                        <CardTitle>Submit Match Result</CardTitle>
                        <CardDescription>Upload a screenshot of the final score screen to verify the winner.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmitResult}>
                        <CardContent className="space-y-4">
                             <Alert>
                                <Upload className="h-4 w-4" />
                                <AlertTitle>Screenshot Requirement</AlertTitle>
                                <AlertDescription>
                                    Please upload a clear, uncropped screenshot of the final match result screen showing both players' names and the final score.
                                </AlertDescription>
                            </Alert>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="screenshot">Screenshot File</Label>
                                <Input id="screenshot" type="file" onChange={handleFileChange} required accept="image/*" />
                            </div>
                             <Button type="submit" disabled={isSubmitting || !selectedFile}>
                                {(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isVerifying ? 'AI is Verifying...' : isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            )}

             {aiResult && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Verification Result</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="bg-primary/5 border-primary/20">
                            <Trophy className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary">Winner Detected: {aiResult.winner.username}</AlertTitle>
                            <AlertDescription className="mt-2 space-y-2">
                                <p><strong className="font-semibold">AI's Reasoning:</strong> {aiResult.reasoning}</p>
                            </AlertDescription>
                        </Alert>
                        <div className="flex gap-4">
                            <Button>Confirm and Finalize Result</Button>
                            <Button variant="destructive">Dispute Result</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </main>
    </div>
  );
}
