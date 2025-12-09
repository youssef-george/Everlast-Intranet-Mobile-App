import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AllExceptionsFilter } from './common/http-exception.filter';

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

    // Add request logging middleware FIRST
    app.use((req: Request, res: Response, next) => {
        console.log(`📥 Request: ${req.method} ${req.path} from ${req.ip || req.socket.remoteAddress || 'unknown'}`);
        next();
    });

    // Add health check endpoint - ONLY /health, not root
    // This bypasses the API prefix for load balancer health checks
    app.use((req: Request, res: Response, next) => {
        if (req.path === '/health' && req.method === 'GET') {
            console.log('🏥 Health check endpoint hit');
            return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        }
        next();
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

    // Add global exception filter for better error handling
    app.useGlobalFilters(new AllExceptionsFilter());

    // Serve static files (uploads)
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
        prefix: '/uploads/',
    });

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
    console.log(`🏥 Health check available at: http://localhost:${port}/health`);
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
