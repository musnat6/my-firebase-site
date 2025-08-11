
'use client';

import Image from 'next/image';
import { avatars } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelectAvatar: (src: string) => void;
}

export function AvatarSelector({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) {
  return (
    <Card>
        <CardContent className="p-4">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {avatars.map((avatar) => (
                <div
                key={avatar.id}
                className={cn(
                    'rounded-full cursor-pointer transition-all duration-200 aspect-square relative overflow-hidden',
                    selectedAvatar === avatar.src
                    ? 'ring-4 ring-primary ring-offset-2'
                    : 'hover:scale-105'
                )}
                onClick={() => onSelectAvatar(avatar.src)}
                >
                <Image
                    src={avatar.src}
                    alt={avatar.hint}
                    data-ai-hint={avatar.hint}
                    fill
                    className="object-cover"
                />
                </div>
            ))}
            </div>
        </CardContent>
    </Card>
  );
}
