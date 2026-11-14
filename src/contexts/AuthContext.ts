import { createContext } from 'react';
import type { AuthState } from '@/features/auth/authState';

export const AuthContext = createContext<(AuthState & { signOut: () => Promise<void> }) | null>(null);
