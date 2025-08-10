import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-opponents.ts';
import '@/ai/flows/generate-match-description.ts';
import '@/ai/flows/summarize-disputes.ts';
