import { z } from 'zod';

export const PlayerRefSchema = z.object({
  uid: z.string(),
  username: z.string(),
  profilePic: z.string(),
});

export const UserStatsSchema = z.object({
  wins: z.number(),
  losses: z.number(),
  earnings: z.number(),
});

export const UserSchema = z.object({
  uid: z.string(),
  username: z.string(),
  email: z.string().email(),
  profilePic: z.string().url(),
  balance: z.number(),
  role: z.enum(['player', 'admin']),
  stats: UserStatsSchema,
});

    