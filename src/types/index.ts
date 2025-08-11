
import { Timestamp } from "firebase/firestore";

export interface PlayerRef {
    uid: string;
    username: string;
    profilePic: string;
}

export interface User {
  uid: string;
  username: string;
  email: string;
  efootballUsername: string;
  profilePic: string;
  balance: number;
  role: 'player' | 'admin';
  stats: {
    wins: number;
    losses: number;
    earnings: number;
  };
}

export interface ResultSubmission {
  submittedBy: string; // uid of the player who submitted
  screenshotUrl: string;
  submittedAt: number;
}

export interface Match {
  matchId: string;
  title: string;
  description: string;
  type: '1v1' | 'Mini Tournament';
  entryFee: number;
  players: PlayerRef[]; // array of player objects
  status: 'open' | 'inprogress' | 'completed' | 'disputed';
  winner?: PlayerRef;
  resultSubmissions?: { [uid: string]: ResultSubmission }; // Submissions from each player, keyed by UID
  dispute?: {
    reportedBy: string;
    reason: string;
  };
  createdAt: Timestamp;
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
  status: 'pending' | 'approved' | 'declined';
  timestamp: Timestamp;
  handledBy?: string;
}

export interface Withdrawal {
  withdrawalId: string;
  userId: string;
  username: string;
  amount: number;
  bkashNumber: string;
  status: 'pending' | 'approved' | 'declined';
  timestamp: Timestamp;
  handledBy?: string;
}

export interface PaymentSettings {
  number: string;
}

export interface AppNotification {
    id: string;
    message: string;
    type: 'new_match' | 'dispute' | 'general';
    matchId?: string;
    createdAt: Timestamp;
    readBy: string[]; // Array of user UIDs who have read the notification
    creatorId: string;
    creatorUsername: string;
}
