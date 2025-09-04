// This file has been removed - using Supabase instead
// All Firebase functionality has been migrated to Supabase
// Please use SupabaseAuthProvider instead

export const FirebaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => {
  throw new Error('FirebaseAuthProvider is deprecated. Please use SupabaseAuthProvider instead.');
};

export {};