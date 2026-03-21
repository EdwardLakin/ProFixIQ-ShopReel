function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  pollIntervalMs: Number(process.env.ASSEMBLY_POLL_INTERVAL_MS ?? 5000),
  workerId: process.env.ASSEMBLY_WORKER_ID ?? "railway-worker-1"
};
