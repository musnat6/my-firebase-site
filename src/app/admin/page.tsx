
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, Loader2, Save, Trophy } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, runTransaction, query, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Deposit, Withdrawal, User, Match, PaymentSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DisputeSummarizer } from '@/components/dispute-summarizer';
import { AdminDataTable } from '@/components/admin-data-table';
import { useAllUsers } from '@/hooks/use-all-users';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("User not found!");
                
                const currentBalance = userDoc.data().balance || 0;
                if (currentBalance < withdrawal.amount) throw new Error("User has insufficient funds.");

                const newBalance = currentBalance - withdrawal.amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(withdrawalRef, { status: newStatus, handledBy: user?.uid });
            });
            toast({ title: 'Withdrawal Approved', description: 'User balance deducted. Send payment manually.', className: 'bg-green-600 text-white' });
        } else {
            // If declined, refund the money to user's balance
            await updateDoc(withdrawalRef, { status: newStatus, handledBy: user?.uid });
            toast({ title: 'Withdrawal Declined', description: 'The withdrawal request has been declined.', variant: 'destructive' });
        }
    } catch (error) {
        console.error("Error processing withdrawal: ", error);
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsSubmitting(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };


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
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'declined':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Declined</Badge>;
    }
  };

  const depositsColumns = [
    { accessorKey: 'username', header: 'User' },
    { accessorKey: 'amount', header: 'Amount (৳)' },
    { accessorKey: 'txId', header: 'Transaction ID' },
    { id: 'status', header: 'Status', cell: (info: any) => getStatusBadge(info.row.original.status as any) },
    { id: 'screenshot', header: 'Screenshot', cell: (info: any) => <Button variant="outline" size="sm" onClick={() => window.open(info.row.original.screenshotUrl, '_blank')} disabled={!info.row.original.screenshotUrl || info.row.original.screenshotUrl === 'disabled_for_now'}>View</Button> },
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
    { accessorKey: 'username', header: 'Username' },
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
    { accessorKey: 'status', header: 'Status' },
    { id: 'winner', header: 'Winner', cell: (info: any) => info.row.original.winner?.username || 'N/A'},
    { id: 'submissions', header: 'Submissions', cell: (info: any) => {
        const m = info.row.original as Match;
        const submissions = m.resultSubmissions ? Object.values(m.resultSubmissions) : [];
        if (submissions.length === 0) {
            return <span className="text-muted-foreground">N/A</span>;
        }
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View Results ({submissions.length})</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Match Results: {m.title}</DialogTitle>
                        <DialogDescription>Review player submissions to resolve this match.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {m.players.map(player => {
                            const submission = m.resultSubmissions?.[player.uid];
                            const opponent = m.players.find(p => p.uid !== player.uid);
                            return (
                                <Card key={player.uid}>
                                    <CardHeader>
                                        <CardTitle>{player.username}'s Submission</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {submission ? (
                                            <div className="space-y-4">
                                                <Button asChild variant="secondary">
                                                    <a href={submission.screenshotUrl} target="_blank" rel="noopener noreferrer">View Screenshot</a>
                                                </Button>
                                                {submission.aiAnalysis && (
                                                     <Alert className="bg-primary/5 border-primary/20">
                                                        <Trophy className="h-4 w-4 text-primary" />
                                                        <AlertTitle className="text-primary">AI Detected Winner: {submission.aiAnalysis.winner.username}</AlertTitle>
                                                        <AlertDescription className="mt-2 space-y-2">
                                                            <p><strong className="font-semibold">Reasoning:</strong> {submission.aiAnalysis.reasoning}</p>
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No submission from this player.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
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
            You are responsible for all manual transactions. Verify payments before approving deposits and send payments before approving withdrawals.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="deposits">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </main>
    </div>
  );
}
