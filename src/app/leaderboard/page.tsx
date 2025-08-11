
'use client';

import { LeaderboardTable } from '@/components/leaderboard-table';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';

export default function LeaderboardPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
             <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-headline font-bold">Leaderboard</h1>
                 <Button onClick={() => router.push('/')} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-6">
                <LeaderboardTable />
            </main>
        </div>
    );
}
