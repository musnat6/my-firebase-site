
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import {
  Banknote,
  Bell,
  Home,
  Landmark,
  PlusCircle,
  Swords,
  Trophy,
  Users,
  Wallet,
  Crown,
  ShieldOff,
  DollarSign,
  ShieldCheck,
  Loader2,
  BarChart,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchCard } from '@/components/match-card';
import { UserNav } from '@/components/user-nav';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match } from '@/types';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { useUserMatches } from '@/hooks/use-user-matches';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { matches, loading: matchesLoading } = useUserMatches();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxId, setDepositTxId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBkash, setWithdrawBkash] = useState('');
  const [matchTitle, setMatchTitle] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && withdrawAmount) {
      const amount = Number(withdrawAmount);
      if (amount > user.balance) {
        setWithdrawError(`You cannot withdraw more than your balance of ${user.balance}৳.`);
      } else if (amount <= 0) {
        setWithdrawError('Withdrawal amount must be positive.');
      } else {
        setWithdrawError('');
      }
    } else {
      setWithdrawError('');
    }
  }, [withdrawAmount, user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const opponentSuggestions = [
    {
      userId: 'player123',
      username: 'GameMaster',
      winLossRatio: 1.2,
      stats: { wins: 60, losses: 50, earnings: 30000 },
      profilePic: 'https://placehold.co/80x80',
    },
    {
      userId: 'player456',
      username: 'ProGamer90',
      winLossRatio: 0.9,
      stats: { wins: 45, losses: 50, earnings: 15000 },
      profilePic: 'https://placehold.co/80x80',
    },
    {
      userId: 'player789',
      username: 'NoobSlayer',
      winLossRatio: 1.1,
      stats: { wins: 55, losses: 50, earnings: 25000 },
      profilePic: 'https://placehold.co/80x80',
    },
  ];

  const handleQuickAction = (action: string) => {
    setOpenDialog(action);
  };

  const closeDialog = () => {
    setOpenDialog(null);
    setDepositAmount('');
    setDepositTxId('');
    setWithdrawAmount('');
    setWithdrawBkash('');
    setWithdrawError('');
    setMatchTitle('');
    setEntryFee('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (openDialog === 'withdraw' && withdrawError)) return;
    setIsSubmitting(true);

    try {
      if (openDialog === 'deposit') {
        await addDoc(collection(db, 'deposits'), {
          userId: user.uid,
          amount: Number(depositAmount),
          txId: depositTxId,
          screenshotUrl: 'disabled_for_now',
          status: 'pending',
          timestamp: Date.now(),
        });
      } else if (openDialog === 'withdraw') {
        if (Number(withdrawAmount) > user.balance) {
          toast({ title: 'Error', description: 'Insufficient balance.', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
        await addDoc(collection(db, 'withdrawals'), {
          userId: user.uid,
          amount: Number(withdrawAmount),
          bkashNumber: withdrawBkash,
          status: 'pending',
          timestamp: Date.now(),
        });
      } else if (openDialog === 'createMatch') {
        await addDoc(collection(db, 'matches'), {
          title: matchTitle,
          entryFee: Number(entryFee),
          type: '1v1',
          status: 'open',
          players: [user.uid],
          createdAt: Date.now(),
        });
      }

      toast({
        title: 'Success!',
        description: 'Your request has been submitted successfully.',
      });
      closeDialog();
    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        title: 'Submission Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = (path: string) => {
    setActiveTab(path);
    router.push(`/${path}`);
  };

  return (
    <SidebarProvider>
      <div className="relative min-h-screen w-full md:grid md:grid-cols-[auto_1fr]">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Arena Clash" width={32} height={32} data-ai-hint="logo" />
              <h1 className="text-xl font-headline font-bold">Arena Clash</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'home'} onClick={() => router.push('/')}>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'matches'} onClick={() => navigate('matches')}>
                  <Swords />
                  <span>Matches</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'leaderboard'} onClick={() => navigate('leaderboard')}>
                  <BarChart />
                  <span>Leaderboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={activeTab === 'wallet'} onClick={() => navigate('wallet')}>
                  <Wallet />
                  <span>Wallet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => router.push('/admin')}>
                    <ShieldCheck />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
                <CardDescription>Contact support for any issues.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold md:text-xl font-headline truncate">
                Welcome, {user.username}!
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <UserNav />
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.balance}৳</div>
                  <p className="text-xs text-muted-foreground">Available to play</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wins</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.stats.wins}</div>
                  <p className="text-xs text-muted-foreground">Total matches won</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Losses</CardTitle>
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.stats.losses}</div>
                  <p className="text-xs text-muted-foreground">Total matches lost</p>
                </CardContent>
              </Card>
              <Card className="bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <Trophy className="h-4 w-4 text-primary-foreground/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.stats.earnings}৳</div>
                  <p className="text-xs text-primary-foreground/80">Lifetime winnings</p>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get into the game or manage your funds.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleQuickAction('createMatch')}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Create New Match
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleQuickAction('deposit')}>
                    <Landmark className="mr-2 h-5 w-5" /> Deposit Funds
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleQuickAction('withdraw')}>
                    <Banknote className="mr-2 h-5 w-5" /> Withdraw Winnings
                  </Button>
                  <Button size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary" onClick={() => handleQuickAction('suggestOpponents')}>
                    <Users className="mr-2 h-5 w-5" /> Suggest Opponents
                  </Button>
                </CardContent>
              </Card>
            </section>

            <Tabs defaultValue="matches" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matches">Live Matches</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              </TabsList>
              <TabsContent value="matches">
                {matchesLoading ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                     {[...Array(4)].map((_, i) => (
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
              </TabsContent>
              <TabsContent value="leaderboard">
                <LeaderboardTable />
              </TabsContent>
            </Tabs>
            
            <Dialog open={openDialog !== null} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {openDialog === 'createMatch' && 'Create New Match'}
                    {openDialog === 'deposit' && 'Manual bKash Deposit'}
                    {openDialog === 'withdraw' && 'Withdraw Winnings'}
                    {openDialog === 'suggestOpponents' && 'AI Opponent Suggestions'}
                  </DialogTitle>
                   <DialogDescription>
                    {openDialog === 'createMatch' && 'Set up a new match for others to join.'}
                    {openDialog === 'deposit' && 'Send bKash payment and submit details for verification.'}
                    {openDialog === 'withdraw' && `Request to withdraw your winnings to your bKash account. Current Balance: ${user.balance}৳`}
                    {openDialog === 'suggestOpponents' && 'Based on your win/loss ratio, here are some suitable opponents.'}
                  </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleFormSubmit}>
                    <div className="py-4 space-y-4">
                    {openDialog === 'deposit' && (
                        <>
                         <Alert>
                            <AlertTitle className="font-bold">Payment Instructions</AlertTitle>
                            <AlertDescription>
                                1. Send your payment to the bKash number: <strong className="font-code">01860151497</strong>
                                <br/>
                                2. Enter the amount and the Transaction ID (TrxID) below.
                            </AlertDescription>
                        </Alert>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (৳)</Label>
                            <Input id="amount" placeholder="Enter amount" type="number" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="trxId">bKash Transaction ID (TrxID)</Label>
                            <Input id="trxId" placeholder="e.g., 9C7B8A1D2E" required value={depositTxId} onChange={(e) => setDepositTxId(e.target.value)} />
                        </div>
                        </>
                    )}
                    {openDialog === 'withdraw' && (
                        <>
                        <div className="grid gap-2">
                            <Label htmlFor="withdraw-amount">Amount (৳)</Label>
                            <Input id="withdraw-amount" placeholder="Enter amount to withdraw" type="number" required value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                             {withdrawError && <p className="text-sm text-red-600">{withdrawError}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bkash-number">Your bKash Number</Label>
                            <Input id="bkash-number" placeholder="e.g., 01xxxxxxxxx" required value={withdrawBkash} onChange={(e) => setWithdrawBkash(e.target.value)} />
                        </div>
                        </>
                    )}
                     {openDialog === 'createMatch' && (
                        <>
                        <div className="grid gap-2">
                            <Label htmlFor="title">Match Title</Label>
                            <Input id="title" placeholder="e.g., Weekend Warriors" required value={matchTitle} onChange={(e) => setMatchTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="entry-fee">Entry Fee (minimum 50৳)</Label>
                            <Input id="entry-fee" placeholder="50" type="number" min="50" required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
                        </div>
                        </>
                    )}
                    {openDialog === 'suggestOpponents' && (
                        <div className="grid gap-4">
                        {opponentSuggestions.map((opp) => (
                            <Card key={opp.userId}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex-grow">
                                <h3 className="font-bold text-lg">{opp.username}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span>W/L: {opp.winLossRatio}</span>
                                    <span>Wins: {opp.stats.wins}</span>
                                    <span>Earnings: {opp.stats.earnings}৳</span>
                                </div>
                                </div>
                                <Button size="sm">Challenge</Button>
                            </CardContent>
                            </Card>
                        ))}
                        </div>
                    )}
                    </div>
                     <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} type="button">Cancel</Button>
                         {openDialog !== 'suggestOpponents' ? (
                            <Button type="submit" disabled={isSubmitting || !!withdrawError}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {openDialog === 'createMatch' ? 'Create Match' : 'Submit for Approval'}
                            </Button>
                         ) : (
                            <Button onClick={closeDialog} type="button">Close</Button>
                         )}
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

    