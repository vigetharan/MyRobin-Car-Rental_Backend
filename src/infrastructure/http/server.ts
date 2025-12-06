import { ApolloServer } from '@apollo/server';
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

export const createServer = async () => {
  const app = express();

  // CORS middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

  // Handle CORS preflight for upload endpoint
  app.options(
    '/upload',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Authenticated file upload endpoint
  app.post(
    '/upload',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }),
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

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    csrfPrevention: true,
  });

  await server.start();

  // GraphQL endpoint
  app.post(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }),
    express.json(),
    async (req: Request, res: Response) => {
      try {
        const authHeader = req.headers.authorization || '';
        let token = authHeader;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
        const user = await authMiddleware(token);

        const context: Context = { user };

        const result = await server.executeOperation(
          {
            query: req.body.query,
            variables: req.body.variables,
            operationName: req.body.operationName,
          },
          { contextValue: context },
        );

        if (result.body.kind === 'single') {
          res.status(200).json(result.body.singleResult);
        } else {
          res.status(200).json(result.body);
        }
      } catch (error: any) {
        logger.error('GraphQL request error:', error);
        res.status(500).json({
          errors: [{ message: error.message || 'Internal server error' }],
        });
      }
    },
  );

  // Handle GET requests for GraphQL
  app.get(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }),
    (_req: Request, res: Response) => {
      res.json({ message: 'GraphQL endpoint. Use POST for queries.' });
    },
  );

  return { app, server };
};

export const startServer = async () => {
  const PORT = Number(process.env.PORT) || 4000;
  const { app } = await createServer();

  const httpServer = http.createServer(app);

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Express server ready at http://localhost:${PORT}`);
    logger.info(`📁 File uploads available at http://localhost:${PORT}/upload`);
    logger.info(`❤️  Health check at http://localhost:${PORT}/health`);
    logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
};
