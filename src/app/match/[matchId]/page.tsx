
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase';
import type { Match, User, ResultSubmission, PlayerRef } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Swords, Upload, Home, ArrowLeft, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ResultSubmissionCard({ 
    match, 
    player, 
    user,
}: { 
    match: Match, 
    player: PlayerRef, 
    user: User 
}) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const playerSubmission = match.resultSubmissions?.[player.uid];

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

        try {
            const photoDataUri = await fileToDataUri(selectedFile);
            const storage = getStorage();
            const screenshotRef = ref(storage, `match-results/${match.matchId}/${player.uid}_${Date.now()}`);
            
            await uploadString(screenshotRef, photoDataUri, 'data_url');
            const screenshotUrl = await getDownloadURL(screenshotRef);

            const newSubmission: ResultSubmission = {
                submittedBy: player.uid,
                screenshotUrl,
                submittedAt: Date.now(),
                confirmedByOpponent: false
            };
            
            const matchRef = doc(db, 'matches', match.matchId);
            await updateDoc(matchRef, {
                [`resultSubmissions.${player.uid}`]: newSubmission
            });

            toast({ title: 'Result Submitted', description: 'Your result has been submitted for admin review.', className: 'bg-green-600 text-white' });

        } catch (error) {
            let errorMessage = "An unknown error occurred during submission.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String((error as { message: unknown }).message);
            }
            
            toast({
                title: 'Submission Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (playerSubmission) {
        return (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">{player.username}'s Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm">Submitted at: {new Date(playerSubmission.submittedAt).toLocaleString()}</p>
                    <Button asChild variant="secondary">
                      <a href={playerSubmission.screenshotUrl} target="_blank" rel="noopener noreferrer">View Screenshot</a>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (player.uid !== user.uid) {
         return (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">{player.username}'s Submission</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-24">
                   <p className="text-muted-foreground">Waiting for submission...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Your Result</CardTitle>
                <CardDescription>Upload a screenshot of the final score screen. An admin will verify the winner.</CardDescription>
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
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="screenshot">Screenshot File</Label>
                        <Input id="screenshot" type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required accept="image/*" />
                    </div>
                    <Button type="submit" disabled={isSubmitting || !selectedFile}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Submitting...' : 'Submit Result'}
                    </Button>
                </CardContent>
            </form>
        </Card>
    );
}


export default function MatchDetailPage() {
  const { matchId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  
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


  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!match || !user) {
    return null; // Or a not found component
  }
  
  const userIsInMatch = match.players.some(p => p.uid === user.uid);
  const isMatchInProgress = match.status === 'inprogress';
  const [player1, player2] = match.players;

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
                        {match.players.map((p, index) => (
                           <div key={p.uid} className="flex flex-col items-center gap-2">
                                <Avatar className="h-20 w-20 border-4 border-primary/20">
                                    <AvatarImage src={p.profilePic} alt={p.username} />
                                    <AvatarFallback>{p.username ? p.username.charAt(0) : 'P'}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-lg">{p.username || 'Player'}</span>
                                { (index === 0 && match.players.length > 1) && <Swords className="h-12 w-12 text-muted-foreground absolute" />}
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
                 <div className="grid md:grid-cols-2 gap-6">
                    {match.players.map(player => (
                        <ResultSubmissionCard key={player.uid} match={match} player={player} user={user} />
                    ))}
                </div>
            )}
        </main>
    </div>
  );
}
