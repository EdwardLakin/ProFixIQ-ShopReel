import 'dotenv/config';

console.log('[assembly-worker] started');

setInterval(() => {
  console.log('[assembly-worker] heartbeat');
}, 5000);
