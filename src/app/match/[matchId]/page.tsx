
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
=======
import { doc, onSnapshot } from 'firebase/firestore';
>>>>>>> origin/main
import { db } from '@/lib/firebase';
import type { Match, User, ResultSubmission, PlayerRef } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
<<<<<<< HEAD
import { Loader2, Swords, Upload, Home, ArrowLeft, UserX, UserCheck } from 'lucide-react';
=======
import { Loader2, Swords, Upload, Home, ArrowLeft, UserX } from 'lucide-react';
>>>>>>> origin/main
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
<<<<<<< HEAD
=======
import { updateDoc } from 'firebase/firestore';
>>>>>>> origin/main

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
<<<<<<< HEAD
    const isCurrentUser = player.uid === user.uid;

    const handleSubmitResult = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || !user || !match || !isCurrentUser) return;
=======

    const handleSubmitResult = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || !user || !match) return;
>>>>>>> origin/main

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            
<<<<<<< HEAD
            const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
            if (!apiKey) {
                throw new Error("ImgBB API key is not configured. Please add it to your environment variables.");
            }

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
=======
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
>>>>>>> origin/main
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                const screenshotUrl = data.data.url;
<<<<<<< HEAD
=======

>>>>>>> origin/main
                const newSubmission: ResultSubmission = {
                    submittedBy: player.uid,
                    screenshotUrl,
                    submittedAt: Date.now(),
                };
                
                const matchRef = doc(db, 'matches', match.matchId);
<<<<<<< HEAD

                await runTransaction(db, async (transaction) => {
                  const matchDoc = await transaction.get(matchRef);
                  if (!matchDoc.exists()) {
                    throw new Error("Match not found!");
                  }
                  
                  const currentMatch = matchDoc.data() as Match;
                  const currentSubmissions = currentMatch.resultSubmissions || {};
                  
                  // Count submissions from *other* players who have already submitted.
                  const otherSubmissionsCount = Object.keys(currentSubmissions).filter(key => key !== player.uid && currentSubmissions[key]).length;

                  // Change status to 'disputed' only when the second player submits.
                  // If first player submits, status remains 'inprogress'.
                  const newStatus = otherSubmissionsCount >= 1 ? 'disputed' : 'inprogress';

                  transaction.update(matchRef, {
                    [`resultSubmissions.${player.uid}`]: newSubmission,
                    status: newStatus
                  });
=======
                await updateDoc(matchRef, {
                    [`resultSubmissions.${player.uid}`]: newSubmission,
                    status: 'disputed'
>>>>>>> origin/main
                });

                toast({ title: 'Result Submitted', description: 'Your result has been submitted for admin review.', className: 'bg-green-600 text-white' });
            } else {
                throw new Error(data.error?.message || 'Image upload failed.');
            }

        } catch (error) {
            console.error("Error submitting result: ", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: 'Submission Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
<<<<<<< HEAD
    // UI for a player who has already submitted
=======
>>>>>>> origin/main
    if (playerSubmission) {
        return (
            <Card className="bg-muted/50">
                <CardHeader>
<<<<<<< HEAD
                    <CardTitle className="text-lg">{isCurrentUser ? "Your Submission" : `${player.username}'s Submission`}</CardTitle>
=======
                    <CardTitle className="text-lg">{player.username}'s Submission</CardTitle>
>>>>>>> origin/main
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

<<<<<<< HEAD
    // This logic ensures the submission form is ALWAYS shown if the current user hasn't submitted,
    // even if the match is 'disputed'. This fixes the mobile bug.
    if (!isCurrentUser) {
=======
    if (player.uid !== user.uid) {
>>>>>>> origin/main
         return (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">{player.username}'s Submission</CardTitle>
                </CardHeader>
<<<<<<< HEAD
                <CardContent className="flex flex-col items-center justify-center text-center h-24 text-muted-foreground">
                    <UserX className="h-8 w-8 mb-2" />
                    <p>Waiting for submission...</p>
=======
                <CardContent className="flex items-center justify-center h-24">
                   <p className="text-muted-foreground">Waiting for submission...</p>
>>>>>>> origin/main
                </CardContent>
            </Card>
        )
    }

<<<<<<< HEAD
    // UI for the current user to submit their result
=======
>>>>>>> origin/main
    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Your Result</CardTitle>
<<<<<<< HEAD
                <CardDescription>Upload a screenshot of the final score screen.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitResult}>
                <CardContent className="space-y-4">
                    <Alert variant="default" className="border-primary/50">
                        <UserCheck className="h-4 w-4" />
                        <AlertTitle className="font-bold">Crucial: Screenshot Requirement</AlertTitle>
                        <AlertDescription>
                            The screenshot **must** clearly show the final score and **both players' in-game usernames**. Results cannot be verified otherwise.
=======
                <CardDescription>Upload a screenshot of the final score screen. An admin will verify the winner.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitResult}>
                <CardContent className="space-y-4">
                    <Alert>
                        <Upload className="h-4 w-4" />
                        <AlertTitle>Screenshot Requirement</AlertTitle>
                        <AlertDescription>
                            Please upload a clear, uncropped screenshot of the final match result screen showing both players' names and the final score.
>>>>>>> origin/main
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


function PlayerAvatar({ player }: { player: PlayerRef }) {
  const [playerData, setPlayerData] = useState<User | null>(null);

  useEffect(() => {
    if (!player?.uid) return;
    const playerRef = doc(db, 'users', player.uid);
    const unsubscribe = onSnapshot(playerRef, (doc) => {
      if (doc.exists()) {
        setPlayerData(doc.data() as User);
      }
    });
    return () => unsubscribe();
  }, [player?.uid]);

  const username = playerData?.username || player.username;
  const profilePic = playerData?.profilePic;

  return (
<<<<<<< HEAD
    <div className="flex flex-col items-center gap-2 relative text-center w-24">
=======
    <div className="flex flex-col items-center gap-2 relative">
>>>>>>> origin/main
      <Avatar className="h-20 w-20 border-4 border-primary/20">
        <AvatarImage src={profilePic} alt={username} />
        <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'P'}</AvatarFallback>
      </Avatar>
<<<<<<< HEAD
      <span className="font-bold text-lg truncate w-full">{username || 'Player'}</span>
=======
      <span className="font-bold text-lg">{username || 'Player'}</span>
>>>>>>> origin/main
    </div>
  );
}


export default function MatchDetailPage({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
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
<<<<<<< HEAD
  const canSubmitResult = userIsInMatch && (match.status === 'inprogress' || match.status === 'disputed' || match.status === 'completed');
=======
  const isMatchInProgress = match.status === 'inprogress';
>>>>>>> origin/main
  
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
<<<<<<< HEAD
                     <div className="flex items-start justify-around relative">
                        {match.players.map((p, index) => (
                           <React.Fragment key={p.uid}>
                                <PlayerAvatar player={p} />
                                { index === 0 && match.players.length > 1 && <Swords className="h-12 w-12 text-muted-foreground mt-8" />}
=======
                     <div className="flex items-center justify-around">
                        {match.players.map((p, index) => (
                           <React.Fragment key={p.uid}>
                                <PlayerAvatar player={p} />
                                { index === 0 && match.players.length > 1 && <Swords className="h-12 w-12 text-muted-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" />}
>>>>>>> origin/main
                            </React.Fragment>
                        ))}
                         {match.players.length === 1 && (
                            <>
<<<<<<< HEAD
                                <Swords className="h-12 w-12 text-muted-foreground mt-8" />
                                <div className="flex flex-col items-center gap-2 text-center w-24">
=======
                                <Swords className="h-12 w-12 text-muted-foreground" />
                                <div className="flex flex-col items-center gap-2">
>>>>>>> origin/main
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

<<<<<<< HEAD
            {canSubmitResult && (
=======
            {userIsInMatch && isMatchInProgress && (
>>>>>>> origin/main
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
