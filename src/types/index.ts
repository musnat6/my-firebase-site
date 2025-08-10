
export interface PlayerRef {
    uid: string;
    username: string;
    profilePic: string;
}

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
  description: string;
  type: '1v1' | 'Mini Tournament';
  entryFee: number;
  players: PlayerRef[]; // array of player objects
  status: 'open' | 'inprogress' | 'pending_confirmation' | 'completed' | 'disputed';
  winner?: PlayerRef;
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
  username: string;
  amount: number;
  txId: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: number;
  handledBy?: string;
}

export interface Withdrawal {
  withdrawalId: string;
  userId: string;
  username: string;
  amount: number;
  bkashNumber: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: number;
  handledBy?: string;
}
