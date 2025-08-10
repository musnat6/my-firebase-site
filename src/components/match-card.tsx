import type { Match } from "@/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Swords, Award } from "lucide-react"
import Image from "next/image"

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const getStatusBadgeVariant = (status: Match['status']) => {
    switch (status) {
      case 'open':
        return 'secondary'
      case 'inprogress':
        return 'default'
      case 'completed':
        return 'outline'
      default:
        return 'destructive'
    }
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-accent/20 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="aspect-video bg-muted relative">
            <Image src="https://placehold.co/600x400" alt={match.title} fill className="object-cover" data-ai-hint="esports stadium" />
        </div>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl mb-1">{match.title}</CardTitle>
            <Badge variant={getStatusBadgeVariant(match.status)} className="capitalize shrink-0">{match.status.replace('_', ' ')}</Badge>
        </div>
        <CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm pt-1">
            <span className="flex items-center gap-1.5"><Swords size={16} /> {match.type}</span>
            <span className="flex items-center gap-1.5"><Users size={16} /> {match.players.length} / {match.type === '1v1' ? 2 : 8}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="text-2xl font-bold font-headline text-primary">{match.entryFee}৳</p>
        </div>
        <Button className="w-full mt-2" disabled={match.status !== 'open'} variant="default">
          Join Match
        </Button>
      </CardFooter>
    </Card>
  )
}
