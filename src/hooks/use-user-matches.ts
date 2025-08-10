
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match } from '@/types';

export function useUserMatches(userId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (userId) {
        // Query for matches where the user is a player
        q = query(
            collection(db, 'matches'), 
            where('players', 'array-contains', { uid: userId, username: 'dummy', profilePic: 'dummy' }), // dummy values needed for object match
            orderBy('createdAt', 'desc')
        );
         // The above is a simplification because Firestore can't query partial objects in an array.
         // A more robust solution for production would involve a subcollection or duplicating player uids in a simple array.
         // For this project, we'll fetch all and filter client-side if a specific user is requested.
         q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));

    } else {
        // Fetch all matches if no user ID is provided
        q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));
    }


    const unsubscribe = onSnapshot(q, (snapshot) => {
      let matchesData = snapshot.docs.map(doc => ({
        matchId: doc.id,
        ...doc.data(),
      } as Match));
      
      // Client-side filter if a userId is provided, as array-contains with objects is tricky
      if (userId) {
          matchesData = matchesData.filter(match => match.players.some(p => p.uid === userId));
      }

      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { matches, loading };
}
