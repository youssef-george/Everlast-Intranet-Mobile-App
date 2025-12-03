import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { Request, Response } from 'express';

console.log('🚀 Bootstrap function called');
console.log('📦 Environment:', process.env.NODE_ENV);
console.log('🔌 PORT:', process.env.PORT);

async function bootstrap() {
    console.log('🔧 Creating NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS for frontend (including network access and Safari)
    app.enableCors({
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Content-Type', 'Authorization'],
    });

    // Add health check before API prefix (for Coolify/load balancers)
    app.getHttpAdapter().get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.getHttpAdapter().get('/', (req: Request, res: Response) => {
        res.json({ status: 'ok', service: 'Everlast Intranet API', timestamp: new Date().toISOString() });
    });

    // Set global API prefix
    app.setGlobalPrefix('api');

    // Enable validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    // Serve static files (uploads)
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

    // Serve frontend static files in production
    // Try multiple possible paths for the public directory
    const possiblePaths = [
        join(__dirname, '..', 'public'),           // /app/backend/dist/../public = /app/backend/public
        join(__dirname, '..', '..', 'public'),     // /app/backend/dist/../../public = /app/public
        join(process.cwd(), 'public'),              // /app/backend/public (if cwd is backend)
        '/app/backend/public',                      // Absolute path in container
    ];
    
    let publicPath = '';
    for (const p of possiblePaths) {
        console.log(`🔍 Checking public path: ${p}, exists: ${existsSync(p)}`);
        if (existsSync(p)) {
            publicPath = p;
            break;
        }
    }
    
    if (publicPath) {
        console.log(`✅ Serving static files from: ${publicPath}`);
        app.useStaticAssets(publicPath, {
            index: 'index.html',
        });
        
        // Handle SPA routing - serve index.html for all non-API routes
        app.use((req, res, next) => {
            // Skip API routes, socket.io, and uploads
            if (req.path.startsWith('/api') || 
                req.path.startsWith('/socket.io') || 
                req.path.startsWith('/uploads')) {
                return next();
            }
            
            // Serve index.html for all other routes (SPA routing)
            res.sendFile(join(publicPath, 'index.html'));
        });
    } else {
        console.warn('⚠️ No public directory found! Frontend will not be served.');
        console.warn('Checked paths:', possiblePaths);
    }

    const port = process.env.PORT || 3001;
    console.log(`🔧 Starting server on port: ${port}`);
    console.log(`📂 Current working directory: ${process.cwd()}`);
    console.log(`📂 __dirname: ${__dirname}`);
    
    await app.listen(port, '0.0.0.0');
    
    // Get network interfaces to show actual IP
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Find first non-internal IPv4 address
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        if (addresses) {
            for (const address of addresses) {
                if (address.family === 'IPv4' && !address.internal) {
                    localIP = address.address;
                    break;
                }
            }
            if (localIP !== 'localhost') break;
        }
    }
    
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`🌐 Network access: http://${localIP}:${port}`);
    console.log(`✅ Application is ready to accept connections`);
}

console.log('📝 Starting bootstrap process...');

bootstrap().catch((error) => {
    console.error('❌ Fatal error during application startup:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Stack trace:', error?.stack);
    process.exit(1);
});

// Keep process alive and log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
