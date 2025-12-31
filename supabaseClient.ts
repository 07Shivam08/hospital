import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjcgrmjtxdkonkoixkup.supabase.co';
const supabaseAnonKey = 'sb_publishable_hpUd2g582o8n3ojQS0LKSQ_vfD42a6n';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);