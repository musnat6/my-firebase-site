export interface User {
  uid: string;
  username: string;
  email: string;
  profilePic: string;
  balance: number;
  role: 'player' | 'admin';
  stats: {
    wins: number;
    losses: number;
    earnings: number;
  };
}

export interface Match {
  matchId: string;
  title: string;
  type: '1v1' | 'Mini Tournament';
  entryFee: number;
  players: string[]; // array of user uids
  status: 'open' | 'inprogress' | 'pending_confirmation' | 'completed' | 'disputed';
  winnerId?: string;
  proofUrl?: string;
  dispute?: {
    reportedBy: string;
    reason: string;
  };
  createdAt: number; // timestamp
}

export interface LeaderboardEntry {
  userId: string;
  earnings: number;
  // Denormalized data for easy display
  username: string;
  profilePic: string;
  wins: number;
  losses: number;
}

export interface Deposit {
  depositId: string;
  userId: string;
  amount: number;
  txId: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: number;
}

export interface Withdrawal {
  withdrawalId: string;
  userId: string;
  amount: number;
  bkashNumber: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: number;
}
