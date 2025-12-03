import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Enable CORS for frontend (including network access and Safari)
    app.enableCors({
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Content-Type', 'Authorization'],
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
    const publicPath = join(__dirname, '..', 'public');
    if (existsSync(publicPath)) {
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
    }

    const port = process.env.PORT || 3001;
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
    console.log(`📱 Share this URL: http://${localIP}:5173`);
}

bootstrap();
