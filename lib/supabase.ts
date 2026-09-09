import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ajikchaxkmxcyuecqmce.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_zvsYIB7hcM3KHDlNmUqFXg_J0H7RI1k";

export const supabase = createClient(supabaseUrl, supabaseKey);
