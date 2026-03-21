import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function cleanup() {
  console.log("Cleaning up sessions with empty transcriptions...");
  
  // 1. Find all empty sessions
  const { data: emptySessions, error: fetchErr } = await supabase
    .from('sessions')
    .select('id')
    .or('transcription.eq.,transcription.is.null');

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }

  if (!emptySessions || emptySessions.length === 0) {
    console.log("No empty sessions found to delete.");
    return;
  }

  const ids = emptySessions.map(s => s.id);
  console.log(`Found ${ids.length} empty sessions. Cleaning up insights and actions first...`);

  // 2. Clear related insights for these sessions
  const { data: insights } = await supabase
    .from('insights')
    .select('id')
    .in('session_id', ids);

  if (insights && insights.length > 0) {
    const insightIds = insights.map(i => i.id);
    await supabase.from('patient_actions').delete().in('insight_id', insightIds);
    await supabase.from('insights').delete().in('id', insightIds);
  }

  // 3. Delete the sessions
  const { error: deleteErr } = await supabase
    .from('sessions')
    .delete()
    .in('id', ids);

  if (deleteErr) {
    console.error("Delete error:", deleteErr);
    return;
  }

  console.log(`Successfully deleted ${ids.length} empty sessions.`);
}

cleanup();
