
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, runTransaction, getFirestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Deposit, Withdrawal } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { DisputeSummarizer } from '@/components/dispute-summarizer';


export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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
      const depositsUnsub = onSnapshot(collection(db, 'deposits'), (snapshot) => {
        setDeposits(snapshot.docs.map(doc => ({ depositId: doc.id, ...doc.data() } as Deposit)));
      });

      const withdrawalsUnsub = onSnapshot(collection(db, 'withdrawals'), (snapshot) => {
        setWithdrawals(snapshot.docs.map(doc => ({ withdrawalId: doc.id, ...doc.data() } as Withdrawal)));
      });

      return () => {
        depositsUnsub();
        withdrawalsUnsub();
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
          transaction.update(depositRef, { status: newStatus });
        });
        toast({ title: 'Deposit Approved', description: `User balance updated successfully.` });
      } else {
        await updateDoc(depositRef, { status: newStatus });
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

    try {
        if (newStatus === 'approved') {
             await updateDoc(withdrawalRef, { status: newStatus });
             toast({ title: 'Withdrawal Approved', description: 'Remember to send the payment manually.' });
        } else {
            // If declined, refund the amount to the user's balance.
            const userRef = doc(db, 'users', withdrawal.userId);
             await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "User not found!";
                }
                const newBalance = userDoc.data().balance + withdrawal.amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(withdrawalRef, { status: newStatus });
            });
            toast({ title: 'Withdrawal Declined', description: 'The amount has been refunded to the user.' });
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
      <div className="flex h-screen items-center justify-center">
        <p>Loading or unauthorized...</p>
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <h1 className="text-xl font-headline font-bold">Admin Panel</h1>
             <Button onClick={() => router.push('/')}>Back to Site</Button>
        </header>
      <main className="flex-1 space-y-6 p-4 md:p-6">
         <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Responsibility</AlertTitle>
          <AlertDescription>
            You are responsible for manually verifying all transactions. Ensure you have received payment before approving deposits and sent payment before approving withdrawals.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="deposits">
          <TabsList>
            <TabsTrigger value="deposits">Deposit Approvals</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawal Approvals</TabsTrigger>
            <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
            <TabsTrigger value="players" disabled>Player Management</TabsTrigger>
            <TabsTrigger value="matches" disabled>Match History</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deposits</CardTitle>
                <CardDescription>Review and approve or decline manual bKash deposits.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                       <TableHead>Screenshot</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((d) => (
                      <TableRow key={d.depositId}>
                        <TableCell className="font-code">{d.userId}</TableCell>
                        <TableCell>{d.amount}৳</TableCell>
                        <TableCell className="font-code">{d.txId}</TableCell>
                        <TableCell>{getStatusBadge(d.status as any)}</TableCell>
                         <TableCell><Button variant="outline" size="sm" onClick={() => window.open(d.screenshotUrl, '_blank')}>View</Button></TableCell>
                        <TableCell className="space-x-2">
                           {d.status === 'pending' && (
                             <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDepositAction(d.depositId, 'approved')} disabled={isSubmitting[d.depositId]}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDepositAction(d.depositId, 'declined')} disabled={isSubmitting[d.depositId]}>Decline</Button>
                             </>
                           )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
             <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription>Review and process player withdrawal requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>bKash Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.withdrawalId}>
                        <TableCell className="font-code">{w.userId}</TableCell>
                        <TableCell>{w.amount}৳</TableCell>
                        <TableCell className="font-code">{w.bkashNumber}</TableCell>
                        <TableCell>{getStatusBadge(w.status as any)}</TableCell>
                        <TableCell className="space-x-2">
                           {w.status === 'pending' && (
                             <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleWithdrawalAction(w.withdrawalId, 'approved')} disabled={isSubmitting[w.withdrawalId]}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleWithdrawalAction(w.withdrawalId, 'declined')} disabled={isSubmitting[w.withdrawalId]}>Decline</Button>
                             </>
                           )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
            <TabsContent value="disputes">
                <DisputeSummarizer />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
