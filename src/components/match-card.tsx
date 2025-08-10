
'use client';

import type { Match, PlayerRef } from "@/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Swords, Gamepad2, Trophy, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { doc, updateDoc, arrayUnion, runTransaction, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const getStatusBadgeVariant = (status: Match['status']) => {
    switch (status) {
      case 'open':
        return 'secondary'
      case 'inprogress':
        return 'default'
      case 'completed':
        return 'outline'
      default:
        return 'destructive'
    }
  }

  const handleJoinMatch = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to join.", variant: "destructive" });
      return;
    }
    
    setIsJoining(true);
    const matchRef = doc(db, 'matches', match.matchId);
    const userRef = doc(db, 'users', user.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found!");

            const matchDoc = await transaction.get(matchRef);
            if (!matchDoc.exists()) throw new Error("Match not found!");

            const currentMatch = matchDoc.data() as Match;
            if (currentMatch.players.some(p => p.uid === user.uid)) {
                throw new Error("You are already in this match.");
            }
            if (currentMatch.players.length >= (currentMatch.type === '1v1' ? 2 : 8)) {
                throw new Error("This match is already full.");
            }

            const currentBalance = userDoc.data().balance || 0;
            if (currentBalance < match.entryFee) {
                throw new Error(`Insufficient funds. You need ${match.entryFee}৳ to join.`);
            }

            // Deduct balance
            const newBalance = currentBalance - match.entryFee;
            transaction.update(userRef, { balance: newBalance });

            // Add player to match
            const newPlayer: PlayerRef = { uid: user.uid, username: user.username, profilePic: user.profilePic };
            const updatedPlayers = [...currentMatch.players, newPlayer];
            
            let newStatus = currentMatch.status;
            if (updatedPlayers.length === (currentMatch.type === '1v1' ? 2 : 8)) {
                newStatus = 'inprogress';
            }

            transaction.update(matchRef, { players: updatedPlayers, status: newStatus });
        });

        toast({ title: "Successfully Joined!", description: "Good luck in your match.", className: "bg-green-600 text-white" });
        if(match.players.length + 1 === (match.type === '1v1' ? 2 : 8)) {
            router.push(`/match/${match.matchId}`);
        }

    } catch (error) {
        console.error("Error joining match:", error);
        toast({ title: "Error Joining Match", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsJoining(false);
    }
  }

  const userIsInMatch = user && match.players.some(p => p.uid === user.uid);
  const isFull = match.players.length >= (match.type === '1v1' ? 2 : 8);

  const getIcon = () => {
    switch (match.type) {
        case '1v1':
            return <Swords className="h-12 w-12 text-primary/80" />;
        case 'Mini Tournament':
            return <Trophy className="h-12 w-12 text-primary/80" />;
        default:
            return <Gamepad2 className="h-12 w-12 text-primary/80" />;
    }
  }
  
  const handleCardClick = () => {
    router.push(`/match/${match.matchId}`);
  };

  return (
    <Card 
        className="flex flex-col h-full hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 overflow-hidden bg-card cursor-pointer"
        onClick={handleCardClick}
    >
        <div className="aspect-video bg-muted/50 flex items-center justify-center">
            {getIcon()}
        </div>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl mb-1">{match.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(match.status)} className="capitalize shrink-0">{match.status.replace('_', ' ')}</Badge>
        </div>
        <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm pt-1">
            <span className="flex items-center gap-1.5"><Swords size={16} /> {match.type}</span>
            <span className="flex items-center gap-1.5"><Users size={16} /> {match.players.length} / {match.type === '1v1' ? 2 : 8}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">{match.description}</p>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 pt-4 border-t">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="text-2xl font-bold font-headline text-primary">{match.entryFee}৳</p>
        </div>
        <Button 
          className="w-full mt-2" 
          disabled={match.status !== 'open' || userIsInMatch || isFull || isJoining} 
          variant="default"
          onClick={(e) => {
              e.stopPropagation(); // prevent card click event
              handleJoinMatch();
          }}
        >
          {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {userIsInMatch ? 'Joined' : isFull ? 'Match Full' : 'Join Match'}
        </Button>
      </CardFooter>
    </Card>
  )
}
