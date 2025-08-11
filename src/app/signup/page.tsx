
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [efootballUsername, setEfootballUsername] = useState('');
  // A default placeholder is assigned on signup. User can change it on their profile page.
  const defaultAvatar = 'https://placehold.co/128x128.png';
  const { signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: "Password must be at least 6 characters long.",
        });
        return;
    }
    try {
      await signUpWithEmail(email, password, username, efootballUsername, defaultAvatar);
      toast({ title: 'Sign Up Successful', description: "Welcome to Efootball clash! You can set your profile picture on the profile page." });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
                <Image src="/logo.svg" alt="Efootball clash" width={40} height={40} data-ai-hint="logo" />
                <h1 className="text-3xl font-headline font-bold">Efootball clash</h1>
            </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to start playing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your Gamer Tag on this site"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="efootball-username">eFootball Game Username</Label>
              <Input
                id="efootball-username"
                type="text"
                placeholder="Your official in-game username"
                required
                value={efootballUsername}
                onChange={(e) => setEfootballUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
