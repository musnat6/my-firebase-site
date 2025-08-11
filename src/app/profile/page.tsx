
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarSelector } from '@/components/avatar-selector';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { toast } = useToast();
    
    const [username, setUsername] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setProfilePic(user.profilePic || '');
        }
    }, [user]);

    if (loading || !user) {
        return (
          <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !username) return;
        setIsSubmitting(true);

        const userRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userRef, {
                username: username,
                profilePic: profilePic
            });
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved.',
                className: 'bg-green-600 text-white'
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: 'Update Failed',
                description: (error as Error).message,
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
                <h1 className="text-xl font-headline font-bold">My Profile</h1>
                <Button onClick={() => router.push('/')} variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>
            </header>
            <main className="flex-1 p-4 md:p-6 flex justify-center items-start">
                <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile</CardTitle>
                            <CardDescription>Update your username and profile picture.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profilePic} alt={username} />
                                    <AvatarFallback className="text-3xl">{username?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-2 w-full">
                                    <Label htmlFor="username">Username</Label>
                                    <Input 
                                        id="username" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                             <div className="grid gap-2">
                                <Label>Choose Your Avatar</Label>
                                <AvatarSelector selectedAvatar={profilePic} onSelectAvatar={setProfilePic} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user.email} disabled />
                                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}
