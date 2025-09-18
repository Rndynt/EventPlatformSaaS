// Simple bridge to start Next.js development server
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Next.js development server on port 5000...');

// Start Next.js in the project root
const projectRoot = path.resolve(__dirname, '..');
const nextProcess = exec('npx next dev -p 5000 -H 0.0.0.0', {
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