
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, Loader2, Save, Trash2, UserX } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, runTransaction, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Deposit, Withdrawal, User, Match, PlayerRef, PaymentSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DisputeSummarizer } from '@/components/dispute-summarizer';
import { AdminDataTable } from '@/components/admin-data-table';
import { useAllUsers } from '@/hooks/use-all-users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

function SettingsTab() {
  const [settings, setSettings] = useState<PaymentSettings>({ number: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'payment');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as PaymentSettings);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const settingsRef = doc(db, 'settings', 'payment');
    try {
      await setDoc(settingsRef, settings, { merge: true });
      toast({ title: 'Settings Saved', description: 'Payment number has been updated.', className: 'bg-green-600 text-white' });
    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if(loading) {
     return (
        <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>Update the number where users send their deposits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="bKashNumber">bKash Deposit Number</Label>
            <Input 
                id="bKashNumber"
                value={settings.number}
                onChange={(e) => setSettings({ ...settings, number: e.target.value })}
            />
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { users, loading: usersLoading } = useAllUsers();

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && user.role === 'admin') {
        setDataLoading(true);
        const depositsUnsub = onSnapshot(query(collection(db, 'deposits'), orderBy('timestamp', 'desc')), (snapshot) => {
            setDeposits(snapshot.docs.map(doc => ({ depositId: doc.id, ...doc.data() } as Deposit)));
            setDataLoading(false);
        });

        const withdrawalsUnsub = onSnapshot(query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc')), (snapshot) => {
            setWithdrawals(snapshot.docs.map(doc => ({ withdrawalId: doc.id, ...doc.data() } as Withdrawal)));
            setDataLoading(false);
        });

        const matchesUnsub = onSnapshot(query(collection(db, 'matches'), orderBy('createdAt', 'desc')), (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ matchId: doc.id, ...doc.data() } as Match)));
            setDataLoading(false);
        });

        return () => {
            depositsUnsub();
            withdrawalsUnsub();
            matchesUnsub();
        };
    }
  }, [user]);

  const handleDepositAction = async (depositId: string, newStatus: 'approved' | 'declined') => {
    setIsSubmitting(prev => ({ ...prev, [depositId]: true }));
    const depositRef = doc(db, 'deposits', depositId);
    const deposit = deposits.find(d => d.depositId === depositId);
    if (!deposit) return;

    try {
      if (newStatus === 'approved') {
        const userRef = doc(db, 'users', deposit.userId);
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw new Error("User does not exist!");
          }
          const newBalance = (userDoc.data().balance || 0) + deposit.amount;
          transaction.update(userRef, { balance: newBalance });
          transaction.update(depositRef, { status: newStatus, handledBy: user?.uid });
        });
        toast({ title: 'Deposit Approved', description: `User balance updated successfully.`, className: 'bg-green-600 text-white' });
      } else {
        await updateDoc(depositRef, { status: newStatus, handledBy: user?.uid });
        toast({ title: 'Deposit Declined', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error processing deposit: ", error);
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsSubmitting(prev => ({ ...prev, [depositId]: false }));
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, newStatus: 'approved' | 'declined') => {
    setIsSubmitting(prev => ({ ...prev, [withdrawalId]: true }));
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
    const withdrawal = withdrawals.find(w => w.withdrawalId === withdrawalId);
    if (!withdrawal) return;
    
    const userRef = doc(db, 'users', withdrawal.userId);

    try {
        if (newStatus === 'approved') {
            await updateDoc(withdrawalRef, { status: newStatus, handledBy: user?.uid });
            toast({ title: 'Withdrawal Approved', description: 'User balance not changed. Send payment manually.', className: 'bg-green-600 text-white' });
        } else {
            // If declined, refund the money to user's balance
             await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User not found!");
                const newBalance = (userDoc.data().balance || 0) + withdrawal.amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(withdrawalRef, { status: newStatus, handledBy: user?.uid });
             });

            toast({ title: 'Withdrawal Declined', description: 'The withdrawal has been declined and funds returned to the user.', variant: 'destructive' });
        }
    } catch (error) {
        console.error("Error processing withdrawal: ", error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsSubmitting(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };
  
  const handleDeclareWinner = async (matchId: string, winner: PlayerRef, players: PlayerRef[], entryFee: number) => {
    const submittingKey = `${matchId}-${winner.uid}`;
    setIsSubmitting(prev => ({ ...prev, [submittingKey]: true }));

    const matchRef = doc(db, 'matches', matchId);
    let winnerPrize = 0; // Declare winnerPrize in the outer scope

    try {
        await runTransaction(db, async (transaction) => {
            // --- 1. READ PHASE ---
            const winnerRef = doc(db, 'users', winner.uid);
            const winnerDoc = await transaction.get(winnerRef);
            if (!winnerDoc.exists()) {
                throw new Error(`Winner (${winner.username}) not found!`);
            }
            
            const loserRefs = players.filter(p => p.uid !== winner.uid).map(p => doc(db, 'users', p.uid));
            const loserDocs = await Promise.all(loserRefs.map(ref => transaction.get(ref)));

            // --- 2. CALCULATION PHASE ---
            const prizePool = entryFee * players.length;
            const commission = prizePool * 0.10; // 10% commission
            winnerPrize = prizePool - commission; // Assign value to the outer scope variable

            const currentBalance = winnerDoc.data().balance || 0;
            const newBalance = currentBalance + winnerPrize;

            const currentStats = winnerDoc.data().stats || { wins: 0, losses: 0, earnings: 0 };
            const newStats = { 
                ...currentStats,
                wins: currentStats.wins + 1,
                earnings: currentStats.earnings + winnerPrize,
            };

            // --- 3. WRITE PHASE ---
            // Update winner's balance and stats
            transaction.update(winnerRef, { 
                balance: newBalance,
                stats: newStats,
            });

            // Update stats for all other players (as losses)
            loserDocs.forEach((loserDoc, index) => {
                if (loserDoc.exists()) {
                    const loserRef = loserRefs[index];
                    const currentLoserStats = loserDoc.data().stats || { wins: 0, losses: 0, earnings: 0 };
                    const newLoserStats = { ...currentLoserStats, losses: currentLoserStats.losses + 1 };
                    transaction.update(loserRef, { stats: newLoserStats });
                }
            });
            
            // Update match status
            transaction.update(matchRef, { status: 'completed', winner: winner });
        });

        toast({
            title: 'Winner Declared!',
            description: `${winner.username} has been awarded ${winnerPrize}৳.`,
            className: 'bg-green-600 text-white'
        });

    } catch (error) {
        console.error("Error declaring winner:", error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsSubmitting(prev => ({ ...prev, [submittingKey]: false }));
    }
};

  const handleDeleteMatch = async (matchId: string) => {
    setIsSubmitting(prev => ({...prev, [`delete-${matchId}`]: true}));
    
    const matchRef = doc(db, 'matches', matchId);

    try {
      await runTransaction(db, async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists()) {
          throw new Error("Match not found!");
        }

        const matchData = matchDoc.data() as Match;

        // If the match is open, refund all players
        if (matchData.status === 'open' && matchData.players.length > 0) {
          const entryFee = matchData.entryFee;
          const playerRefs = matchData.players.map(player => doc(db, 'users', player.uid));
          const playerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));

          playerDocs.forEach((playerDoc, index) => {
              if (playerDoc.exists()) {
                  const currentBalance = playerDoc.data().balance || 0;
                  const newBalance = currentBalance + entryFee;
                  transaction.update(playerRefs[index], { balance: newBalance });
              }
          });
        }
        // Finally, delete the match document itself
        transaction.delete(matchRef);
      });

      toast({
        title: 'Match Deleted',
        description: 'The match has been removed and any entry fees refunded.',
        className: 'bg-green-600 text-white'
      });

    } catch (error) {
      console.error("Error deleting match:", error);
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSubmitting(prev => ({...prev, [`delete-${matchId}`]: false}));
    }
  }


  if (loading || !user || user.role !== 'admin') {
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
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'declined':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Declined</Badge>;
    }
  };

  const depositsColumns = [
    { accessorKey: 'username', header: 'User' },
    { accessorKey: 'amount', header: 'Amount (৳)' },
    { accessorKey: 'txId', header: 'Transaction ID' },
    { id: 'status', header: 'Status', cell: (info: any) => getStatusBadge(info.row.original.status as any) },
    { id: 'actions', header: 'Actions', cell: (info: any) => {
        const d = info.row.original;
        return d.status === 'pending' && (
         <div className="space-x-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDepositAction(d.depositId, 'approved')} disabled={isSubmitting[d.depositId]}>Approve</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDepositAction(d.depositId, 'declined')} disabled={isSubmitting[d.depositId]}>Decline</Button>
         </div>
       )}
    },
  ];

  const withdrawalsColumns = [
    { accessorKey: 'username', header: 'User' },
    { accessorKey: 'amount', header: 'Amount (৳)' },
    { accessorKey: 'bkashNumber', header: 'bKash Number' },
    { id: 'status', header: 'Status', cell: (info: any) => getStatusBadge(info.row.original.status as any) },
    { id: 'actions', header: 'Actions', cell: (info: any) => {
        const w = info.row.original;
        return w.status === 'pending' && (
         <div className="space-x-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleWithdrawalAction(w.withdrawalId, 'approved')} disabled={isSubmitting[w.withdrawalId]}>Approve</Button>
            <Button variant="destructive" size="sm" onClick={() => handleWithdrawalAction(w.withdrawalId, 'declined')} disabled={isSubmitting[w.withdrawalId]}>Decline</Button>
         </div>
       )}
    },
  ];

  const playersColumns = [
    { accessorKey: 'username', header: 'Site Username' },
    { accessorKey: 'efootballUsername', header: 'Game Username' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'balance', header: 'Balance (৳)' },
    { id: 'wins', header: 'Wins', cell: (info: any) => info.row.original.stats?.wins ?? 0 },
    { id: 'losses', header: 'Losses', cell: (info: any) => info.row.original.stats?.losses ?? 0 },
    { id: 'earnings', header: 'Earnings (৳)', cell: (info: any) => info.row.original.stats?.earnings ?? 0 },
    { accessorKey: 'role', header: 'Role' },
  ];

  const matchesColumns = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'entryFee', header: 'Fee (৳)' },
    { id: 'players', header: 'Players', cell: (info: any) => `${info.row.original.players.length} / ${info.row.original.type === '1v1' ? 2 : 8}` },
    { id: 'status', header: 'Status', cell: (info: any) => <Badge variant="secondary" className="capitalize">{info.row.original.status}</Badge> },
    { id: 'winner', header: 'Winner', cell: (info: any) => info.row.original.winner?.username || 'N/A'},
    { id: 'actions', header: 'Actions', cell: (info: any) => {
        const m = info.row.original as Match;
        const submissions = m.resultSubmissions ? Object.values(m.resultSubmissions) : [];
        return (
            <div className="space-x-2 flex">
                {(m.status === 'inprogress' || m.status === 'disputed') && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={submissions.length === 0}>
                                View Results {submissions.length > 0 && `(${submissions.length})`}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Resolve Match: {m.title}</DialogTitle>
                                <DialogDescription>Review player submissions and declare a winner. The prize pool will be automatically distributed with a 10% commission.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                {m.players.map(player => {
                                    const submission = m.resultSubmissions?.[player.uid];
                                    return (
                                        <Card key={player.uid}>
                                            <CardHeader className="flex-row items-center justify-between">
                                                <CardTitle>{player.username}</CardTitle>
                                                {(m.status === 'inprogress' || m.status === 'disputed') && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleDeclareWinner(m.matchId, player, m.players, m.entryFee)} 
                                                        disabled={isSubmitting[`${m.matchId}-${player.uid}`]}
                                                    >
                                                        {isSubmitting[`${m.matchId}-${player.uid}`] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Declare Winner
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent>
                                                {submission ? (
                                                    <div className="space-y-4">
                                                        <Button asChild variant="secondary">
                                                            <a href={submission.screenshotUrl} target="_blank" rel="noopener noreferrer">View Screenshot</a>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-center h-24 text-muted-foreground">
                                                        <UserX className="h-8 w-8 mb-2" />
                                                        <p>No submission from this player.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                            <DialogFooter>
                                <div className="text-sm text-muted-foreground">
                                    Match Status: <Badge variant="secondary" className="capitalize">{m.status}</Badge>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" disabled={isSubmitting[`delete-${m.matchId}`]}>
                        {isSubmitting[`delete-${m.matchId}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the match. 
                          If the match is 'open', player entry fees will be refunded automatically.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMatch(m.matchId)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
            </div>
        )
    }}
  ];


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <h1 className="text-xl font-headline font-bold">Admin Panel</h1>
             <Button onClick={() => router.push('/')} variant="outline">Back to Site</Button>
        </header>
      <main className="flex-1 space-y-6 p-4 md:p-6">
         <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Responsibility</AlertTitle>
          <AlertDescription>
            You are responsible for all manual transactions and match resolutions. Use player eFootball usernames to verify screenshot results. Declaring a match winner is final and will automatically transfer funds.
          </AlertDescription>
        </Alert>
        <Tabs defaultValue="deposits" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
                <TabsList>
                    <TabsTrigger value="deposits">Deposits</TabsTrigger>
                    <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                    <TabsTrigger value="players">Players</TabsTrigger>
                    <TabsTrigger value="matches">Matches</TabsTrigger>
                    <TabsTrigger value="disputes">Disputes</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="mt-6">
                <TabsContent value="deposits">
                    <AdminDataTable
                    columns={depositsColumns}
                    data={deposits}
                    loading={dataLoading}
                    title="Deposit Approvals"
                    description="Review and approve or decline manual bKash deposits."
                    searchColumn="username"
                    searchText="Search by username..."
                    />
                </TabsContent>

                <TabsContent value="withdrawals">
                    <AdminDataTable
                        columns={withdrawalsColumns}
                        data={withdrawals}
                        loading={dataLoading}
                        title="Withdrawal Approvals"
                        description="Review and process player withdrawal requests."
                        searchColumn="username"
                        searchText="Search by username..."
                    />
                </TabsContent>

                <TabsContent value="players">
                    <AdminDataTable
                        columns={playersColumns}
                        data={users}
                        loading={usersLoading}
                        title="Player Management"
                        description="View and manage all registered players."
                        searchColumn="username"
                        searchText="Search by username..."
                        />
                </TabsContent>

                <TabsContent value="matches">
                    <AdminDataTable
                        columns={matchesColumns}
                        data={matches}
                        loading={dataLoading}
                        title="Match History"
                        description="View all created matches."
                        searchColumn="title"
                        searchText="Search by title..."
                        />
                </TabsContent>

                <TabsContent value="disputes">
                    <DisputeSummarizer />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab />
                </TabsContent>
            </div>
        </Tabs>
      </main>
    </div>
  );
}
