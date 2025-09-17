import next from 'next';
import { type Express } from 'express';
import { log } from './vite';

const dev = process.env.NODE_ENV === 'development';

export async function setupNextJs(app: Express) {
  log('Setting up Next.js...', 'next');
  
  const nextApp = next({ 
    dev,
    dir: '.',
    conf: {
      // Next.js configuration
      experimental: {
        serverComponentsExternalPackages: ['@neondatabase/serverless']
      },
      images: {
        domains: [
          'images.unsplash.com',
          'pixabay.com'
        ],
        remotePatterns: [
          {
            protocol: 'https',
            hostname: '**',
          },
        ],
      },
    }
  });

  const handle = nextApp.getRequestHandler();
  
  await nextApp.prepare();
  log('Next.js prepared successfully', 'next');

  // Handle all non-API routes with Next.js
  app.get('*', (req, res) => {
    // Skip API routes - they're handled by Express
    if (req.path.startsWith('/api')) {
      return;
    }
    
    return handle(req, res);
  });

  return nextApp;
}