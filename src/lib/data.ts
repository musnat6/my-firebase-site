import type { User, Match, LeaderboardEntry } from '@/types';

export const mockUser: User = {
  uid: 'user-123',
  username: 'Rafi',
  email: 'rafi@example.com',
  profilePic: 'https://placehold.co/100x100',
  balance: 1500,
  role: 'player',
  stats: {
    wins: 42,
    losses: 18,
    earnings: 21000,
  },
};

export const mockMatches: Match[] = [
  {
    matchId: 'match-001',
    title: 'Weekend Warriors',
    type: '1v1',
    entryFee: 100,
    players: ['user-123', 'user-456'],
    status: 'inprogress',
    createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
  },
  {
    matchId: 'match-002',
    title: 'Beginner\'s Brawl',
    type: '1v1',
    entryFee: 50,
    players: ['user-789'],
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    matchId: 'match-003',
    title: 'Pro League',
    type: 'Mini Tournament',
    entryFee: 250,
    players: ['user-101', 'user-102', 'user-103'],
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
    {
    matchId: 'match-004',
    title: 'Clash of Titans',
    type: '1v1',
    entryFee: 500,
    players: [],
    status: 'open',
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { userId: 'pro-gamer-1', username: 'Zeus', profilePic: 'https://placehold.co/40x40', earnings: 55000, wins: 120, losses: 15 },
  { userId: 'challenger-2', username: 'Athena', profilePic: 'https://placehold.co/40x40', earnings: 48000, wins: 110, losses: 25 },
  { userId: 'user-123', username: 'Rafi', profilePic: 'https://placehold.co/40x40', earnings: 21000, wins: 42, losses: 18 },
  { userId: 'rookie-4', username: 'Ares', profilePic: 'https://placehold.co/40x40', earnings: 15000, wins: 30, losses: 10 },
  { userId: 'veteran-5', username: 'Hades', profilePic: 'https://placehold.co/40x40', earnings: 12500, wins: 25, losses: 5 },
];
