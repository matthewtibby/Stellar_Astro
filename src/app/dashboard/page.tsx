import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(cookies()); 