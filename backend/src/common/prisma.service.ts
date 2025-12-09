import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            const databaseUrl = process.env.DATABASE_URL ? 
                (process.env.DATABASE_URL.startsWith('file:') 
                    ? process.env.DATABASE_URL 
                    : process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')) : // Hide password in logs for non-file URLs
                'NOT SET';
            this.logger.log(`🔌 Attempting to connect to database...`);
            this.logger.log(`📡 Database URL present: ${process.env.DATABASE_URL ? 'YES' : 'NO'}`);
            this.logger.log(`🔗 Database URL (masked): ${databaseUrl}`);
            
            // Add timeout for connection
            const connectPromise = this.$connect();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
            );
            
            await Promise.race([connectPromise, timeoutPromise]);
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database');
            this.logger.error('Error type:', error?.constructor?.name);
            this.logger.error('Error message:', error?.message);
            this.logger.error('Database URL set:', process.env.DATABASE_URL ? 'YES' : 'NO');
            if (error?.stack) {
                this.logger.error('Stack trace:', error.stack);
            }
            throw error; // Re-throw to prevent app from starting without DB
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('🔌 Database disconnected');
        } catch (error) {
            this.logger.error('❌ Error disconnecting from database:', error);
        }
    }
}
