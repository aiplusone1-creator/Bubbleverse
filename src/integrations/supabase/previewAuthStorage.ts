/** Storage accepted by Supabase's `auth.storage` option; standard localStorage implementation for web browsers. */
export interface PreviewAuthStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * Returns standard localStorage for persistent browser sessions.
 * Independent of any legacy preview editor iframe brokers.
 */
export function brokeredPreviewStorage(): PreviewAuthStorage | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
}
