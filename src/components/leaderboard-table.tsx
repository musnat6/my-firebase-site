
'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { Skeleton } from './ui/skeleton';

export function LeaderboardTable() {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('stats.earnings', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setLeaderboard(usersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching leaderboard: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Players</CardTitle>
                <CardDescription>See who is dominating the arena.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Players</CardTitle>
        <CardDescription>See who is dominating the arena.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead className="hidden text-right md:table-cell">Wins</TableHead>
              <TableHead className="hidden text-right md:table-cell">Losses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((player, index) => (
              <TableRow key={player.uid}>
                <TableCell className="font-bold text-lg">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mx-auto">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.profilePic} alt={player.username} data-ai-hint="avatar" />
                      <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium truncate">{player.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-primary">{player.stats.earnings}৳</TableCell>
                <TableCell className="hidden text-right text-green-600 md:table-cell">{player.stats.wins}</TableCell>
                <TableCell className="hidden text-right text-red-600 md:table-cell">{player.stats.losses}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    