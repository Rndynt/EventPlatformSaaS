// Simple bridge to start Next.js development server
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || '80';
console.log(`🚀 Starting Next.js development server on port ${port}...`);

// Start Next.js in the project root
const projectRoot = path.resolve(__dirname, '..');
const nextProcess = exec(`npx next dev -H 0.0.0.0 -p ${port}`, {
  cwd: projectRoot,
  env: { ...process.env, NODE_ENV: 'development' }
});

// Forward all output
nextProcess.stdout?.pipe(process.stdout);
nextProcess.stderr?.pipe(process.stderr);

// Handle process termination
nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => nextProcess.kill());
process.on('SIGINT', () => nextProcess.kill());