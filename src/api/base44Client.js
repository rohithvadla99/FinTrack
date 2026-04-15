// Replaced @base44/sdk with local storage backend — no cloud, no restrictions
import { localStore } from './localStore';

export const base44 = localStore;
