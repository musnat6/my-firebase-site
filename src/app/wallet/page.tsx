
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home, Landmark, Banknote, Loader2, PlusCircle, MinusCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import type { Deposit, Withdrawal } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type Transaction = (Deposit | Withdrawal) & { type: 'deposit' | 'withdrawal' };

export default function WalletPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [txLoading, setTxLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setTxLoading(true);

        const depositsQuery = query(
            collection(db, 'deposits'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );
        
        const withdrawalsQuery = query(
            collection(db, 'withdrawals'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubDeposits = onSnapshot(depositsQuery, (snapshot) => {
            const userDeposits = snapshot.docs.map(doc => ({ ...doc.data({ serverTimestamps: 'estimate' }), type: 'deposit' } as Transaction));
            setTransactions(prev => 
                [...userDeposits, ...prev.filter(t => t.type !== 'deposit')]
                .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
            );
             setTxLoading(false);
        });

        const unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
            const userWithdrawals = snapshot.docs.map(doc => ({ ...doc.data({ serverTimestamps: 'estimate' }), type: 'withdrawal' } as Transaction));
            setTransactions(prev => 
                [...userWithdrawals, ...prev.filter(t => t.type !== 'withdrawal')]
                .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
            );
            setTxLoading(false);
        });
        
        return () => {
            unsubDeposits();
            unsubWithdrawals();
        };

    }, [user]);

    if (loading || !user) {
        return (
          <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    const getStatusBadge = (status: 'pending' | 'approved' | 'declined') => {
        switch (status) {
          case 'pending':
            return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
          case 'approved':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
          case 'declined':
            return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">Declined</Badge>;
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-headline font-bold">My Wallet</h1>
                <Button onClick={() => router.push('/')} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </header>
            <main className="flex-1 space-y-6 p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Wallet Overview</CardTitle>
                        <CardDescription>Your current balance and quick actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className="text-4xl font-bold">{user.balance}৳</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" onClick={() => router.push('/')}><Landmark className="mr-2"/> Deposit</Button>
                            <Button size="lg" variant="outline" onClick={() => router.push('/')}><Banknote className="mr-2"/> Withdraw</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>A record of your recent deposits and withdrawals.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {txLoading ? (
                             <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : transactions.length > 0 ? (
                            <ul className="space-y-4">
                                {transactions.map((tx, index) => (
                                    <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                                        <div className="flex items-center gap-4">
                                            {tx.type === 'deposit' ? 
                                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full"><PlusCircle className="text-green-600 dark:text-green-400"/></div> :
                                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full"><MinusCircle className="text-red-600 dark:text-red-400"/></div>
                                            }
                                            <div>
                                                <p className="font-semibold capitalize">{tx.type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {tx.timestamp ? format(tx.timestamp.toDate(), "MMM d, yyyy 'at' h:mm a") : 'Date unavailable'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-lg ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'deposit' ? '+' : '-'}{tx.amount}৳
                                            </p>
                                            {getStatusBadge(tx.status as any)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
