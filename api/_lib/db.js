import {createClient} from '@supabase/supabase-js';
const U=process.env.SUPABASE_URL,K=process.env.SUPABASE_SERVICE_KEY;
export const configured=!!(U&&K);
export const db=createClient(U||'http://localhost',K||'x');
