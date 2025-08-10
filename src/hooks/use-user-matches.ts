
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Match } from '@/types';
import { useAuth } from './use-auth';

export function useUserMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({
        matchId: doc.id,
        ...doc.data(),
      } as Match));
      setMatches(matchesData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { matches, loading };
}

    