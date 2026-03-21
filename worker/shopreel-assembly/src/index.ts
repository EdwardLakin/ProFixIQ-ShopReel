import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WORKER_ID = `assembly-${Math.random().toString(36).slice(2)}`;

console.log(`[assembly-worker] started (${WORKER_ID})`);

async function claimJob() {
  const { data, error } = await supabase
    .from('shopreel_premium_assembly_jobs')
    .select('*')
    .eq('status', 'queued')
    .lte('run_after', new Date().toISOString())
    .is('locked_at', null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[worker] claim error', error);
    return null;
  }

  if (!data) return null;

  const { error: lockError } = await supabase
    .from('shopreel_premium_assembly_jobs')
    .update({
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .is('locked_at', null);

  if (lockError) {
    console.error('[worker] lock error', lockError);
    return null;
  }

  return data;
}

async function processJob(job: any) {
  console.log(`[worker] processing job ${job.id}`);

  try {
    // TODO: replace with real pipeline later
    await new Promise((r) => setTimeout(r, 3000));

    const { error } = await supabase
      .from('shopreel_premium_assembly_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_payload: { success: true },
      })
      .eq('id', job.id);

    if (error) throw error;

    console.log(`[worker] completed job ${job.id}`);
  } catch (err: any) {
    console.error(`[worker] failed job ${job.id}`, err);

    await supabase
      .from('shopreel_premium_assembly_jobs')
      .update({
        status: 'failed',
        error_text: err?.message || 'unknown error',
      })
      .eq('id', job.id);
  }
}

async function loop() {
  while (true) {
    try {
      const job = await claimJob();

      if (job) {
        await processJob(job);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error('[worker] loop error', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

loop();
