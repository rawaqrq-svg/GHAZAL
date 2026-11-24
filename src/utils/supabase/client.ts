import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ebygsibxdxjxaetrqrya.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_sGe982LRaxveX8O67APzgQ_ojL_YMev';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
