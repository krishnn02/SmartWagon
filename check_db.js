const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from("brake_fault_event")
    .select("*")
    .eq("device_id", "Raspberry4_7")
    .order("timestamp", { ascending: false })
    .limit(50);
  
  if (error) {
    console.error(error);
  } else {
    console.log("Found", data.length, "faults for Raspberry4_7.");
    if(data.length > 0) {
      console.log(data);
    }
  }
}

check();
