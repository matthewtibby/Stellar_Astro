import { useState, useEffect } from 'react';
import { SessionTemplate } from '@/types/session';
import { createClient, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

const useSessionTemplates = () => {
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  useEffect(() => {
    const fetchSessionTemplates = async () => {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabase
          .from('session_templates')
          .select('*');
        if (error) throw error;
        setSessionTemplates(data || []);
      } catch (error) {
        console.error('Error fetching session templates:', error);
      }
    };
    fetchSessionTemplates();
  }, []);
  return sessionTemplates;
};

export default useSessionTemplates; 