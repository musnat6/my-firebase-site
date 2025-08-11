
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { useAuth } from './use-auth';

export function useAllUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('username'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
      } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { users, loading };
}
