
'use client';

import { useUserMatches } from '@/hooks/use-user-matches';
import { MatchCard } from '@/components/match-card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';

export default function MatchesPage() {
    const { matches, loading } = useUserMatches();
    const router = useRouter();

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-headline font-bold">All Matches</h1>
                <Button onClick={() => router.push('/')} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-6">
                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                           <Card key={i} className="h-[380px]">
                                <CardContent className="p-6 h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                           </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {matches.map((match) => (
                            <MatchCard key={match.matchId} match={match} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

    