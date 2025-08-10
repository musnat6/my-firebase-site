
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

// Mock data - replace with Firestore data
const mockDeposits = [
    { depositId: 'dep1', userId: 'user1', amount: 500, txId: '8N3J4K5L6M', status: 'pending' },
    { depositId: 'dep2', userId: 'user2', amount: 100, txId: '9P7Q8R1S2T', status: 'approved' },
];

const mockWithdrawals = [
    { withdrawalId: 'wd1', userId: 'user3', amount: 1000, bkashNumber: '01xxxxxxxxx', status: 'pending' },
    { withdrawalId: 'wd2', userId: 'user4', amount: 200, bkashNumber: '01xxxxxxxxx', status: 'declined' },
];


export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

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
            <TabsTrigger value="players">Player Management</TabsTrigger>
            <TabsTrigger value="matches">Match History</TabsTrigger>
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
                    {mockDeposits.map((d) => (
                      <TableRow key={d.depositId}>
                        <TableCell className="font-code">{d.userId}</TableCell>
                        <TableCell>{d.amount}৳</TableCell>
                        <TableCell className="font-code">{d.txId}</TableCell>
                        <TableCell>{getStatusBadge(d.status as any)}</TableCell>
                         <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
                        <TableCell className="space-x-2">
                           {d.status === 'pending' && (
                             <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                                <Button variant="destructive" size="sm">Decline</Button>
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
                    {mockWithdrawals.map((w) => (
                      <TableRow key={w.withdrawalId}>
                        <TableCell className="font-code">{w.userId}</TableCell>
                        <TableCell>{w.amount}৳</TableCell>
                        <TableCell className="font-code">{w.bkashNumber}</TableCell>
                        <TableCell>{getStatusBadge(w.status as any)}</TableCell>
                        <TableCell className="space-x-2">
                           {w.status === 'pending' && (
                             <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                                <Button variant="destructive" size="sm">Decline</Button>
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
        </Tabs>
      </main>
    </div>
  );
}
