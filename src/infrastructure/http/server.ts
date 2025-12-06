import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';

import { typeDefs } from '../graphql/schema';
import { resolvers } from '../graphql/resolvers';
import { authMiddleware } from '../security/authMiddleware';
import { upload } from './fileUpload';
import { logger } from '../logging/logger';
import { Context } from '../../interface/graphql/Context';

dotenv.config();

export const createExpressApp = () => {
  const app = express();

  // CORS middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static('uploads'));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authenticated file upload endpoint
  app.post(
    '/upload',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({
            error: 'Authentication required. Please provide an authorization token.',
          });
        }

        const token = authHeader.startsWith('Bearer ')
          ? authHeader.replace('Bearer ', '')
          : authHeader;
        const user = await authMiddleware(token);

        if (!user) {
          return res.status(401).json({
            error: 'Invalid or expired token. Please login again.',
          });
        }

        if (user.role !== 'ADMIN') {
          return res.status(403).json({
            error: 'Only administrators can upload car images.',
          });
        }

        (req as any).user = user;
        next();
      } catch (error: any) {
        logger.error('Upload auth error:', error);
        return res.status(401).json({ error: error.message || 'Authentication failed' });
      }
    },
    upload.single('image'),
    (req: Request & { file?: Express.Multer.File }, res: Response) => {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded. Please select an image file.',
        });
      }

      try {
        logger.info(`File uploaded: ${req.file.filename}`);
        res.json({ imageUrl: `/uploads/${req.file.filename}` });
      } catch (error: any) {
        logger.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
      }
    },
    (error: any, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof Error) {
        if (error.message === 'Only images are allowed') {
          return res.status(400).json({
            error: 'Invalid file type. Only JPEG, PNG, and GIF images are allowed.',
          });
        }
        if (error.message.includes('File too large')) {
          return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
        }
      }
      logger.error('Upload middleware error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    },
  );

  return app;
};

export const startServer = async () => {
  const GRAPHQL_PORT = Number(process.env.PORT) || 4000;
  const EXPRESS_PORT = Number(process.env.EXPRESS_PORT) || 4001;

  // Start Express app for file uploads and health check
  const app = createExpressApp();
  const httpServer = http.createServer(app);
  
  httpServer.listen(EXPRESS_PORT, () => {
    logger.info(`📁 File uploads available at http://localhost:${EXPRESS_PORT}/upload`);
    logger.info(`❤️  Health check at http://localhost:${EXPRESS_PORT}/health`);
  });

  // Start Apollo Server with built-in Sandbox
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: true, // Enable introspection for Sandbox
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: GRAPHQL_PORT },
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      let token = authHeader;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
      const user = await authMiddleware(token);
      return { user };
    },
  });

  logger.info(`🚀 Apollo Server ready at ${url}`);
  logger.info(`� Open ${url} in browser for Apollo Sandbox`);
};
