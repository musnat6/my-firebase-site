
'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Home, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { toast } = useToast();
    
    const [username, setUsername] = useState('');
    const [efootballUsername, setEfootballUsername] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEfootballUsername(user.efootballUsername || '');
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
    
    const uploadProfilePicture = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);
        
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
        if (!apiKey) {
            throw new Error("ImgBB API key is not configured. Please add it to your environment variables.");
        }
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error(data.error?.message || 'Image upload to ImgBB failed.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !username || !efootballUsername) return;
        setIsSubmitting(true);

        const userRef = doc(db, 'users', user.uid);
        try {
            let newProfilePicUrl = profilePic;
            if (newProfilePicFile) {
                newProfilePicUrl = await uploadProfilePicture(newProfilePicFile);
                setProfilePic(newProfilePicUrl); // Update local state to show new image
            }

            await updateDoc(userRef, {
                username: username,
                efootballUsername: efootballUsername,
                profilePic: newProfilePicUrl,
            });
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved.',
                className: 'bg-green-600 text-white'
            });
            setNewProfilePicFile(null); // Reset file input
        } catch (error) {
            console.error("Error updating profile:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: 'Update Failed',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewProfilePicFile(file);
            // Show a preview of the new image
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
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
                            <CardDescription>Update your profile details. Your eFootball username is crucial for verifying match results.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profilePic} alt={username} />
                                    <AvatarFallback className="text-3xl">{username?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-2 w-full">
                                    <Label htmlFor="username">Site Username</Label>
                                    <Input 
                                        id="username" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                     <p className="text-xs text-muted-foreground">Your display name on this website.</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="efootball-username">eFootball Game Username</Label>
                                <Input 
                                    id="efootball-username" 
                                    value={efootballUsername} 
                                    onChange={(e) => setEfootballUsername(e.target.value)}
                                    required
                                />
                                 <p className="text-xs text-muted-foreground">Your exact in-game username. This is required for result verification.</p>
                            </div>

                             <div className="grid gap-2">
                                <Label htmlFor="profile-pic-upload">Upload New Profile Picture</Label>
                                <Input 
                                    id="profile-pic-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <p className="text-xs text-muted-foreground">Choose a new image to update your profile picture.</p>
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

    