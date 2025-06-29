import { useEffect, useState } from 'react';
import { createBrowserClient, supabaseUrl, supabaseAnonKey } from '@/src/lib/supabase';

/**
 * Custom hook to fetch and manage the user's subscription from Supabase.
 * @param userId The user's ID
 */
const useSubscription = (userId: string | null | undefined) => {
  const [subscription, setSubscription] = useState('free');

  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
    supabase
      .from('profiles')
      .select('subscription')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.subscription) setSubscription(data.subscription);
      });
  }, [userId]);

  return subscription;
};

export default useSubscription; 