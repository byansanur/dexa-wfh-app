import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly storageService: StorageService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async exportLogsToMinio() {
    this.logger.log('Running daily log export to MinIO...');
    const collection = this.connection.collection('audit_logs');
    
    // Get logs from the previous day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await collection.find({
      _receivedAt: { $gte: yesterday, $lt: today }
    }).toArray();

    if (logs.length === 0) {
      this.logger.log('No logs found for yesterday. Skipping export.');
      return;
    }

    const jsonlData = logs.map(log => JSON.stringify(log)).join('\n');
    const buffer = Buffer.from(jsonlData, 'utf-8');
    
    const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.log`;
    
    try {
      const url = await this.storageService.uploadBuffer(buffer, fileName, 'text/plain');
      this.logger.log(`Successfully exported ${logs.length} logs to ${url}`);
    } catch (e) {
      this.logger.error('Failed to export logs to MinIO', e);
    }
  }

  @Cron('0 3 * * *')
  async purgeOldLogs() {
    this.logger.log('Running daily log purge for logs older than 27 hours...');
    const collection = this.connection.collection('audit_logs');
    
    // 27 hours ago
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 27);

    try {
      const result = await collection.deleteMany({
        _receivedAt: { $lt: threshold }
      });
      this.logger.log(`Purged ${result.deletedCount} old logs from MongoDB.`);
    } catch (e) {
      this.logger.error('Failed to purge old logs', e);
    }
  }

  async manualExport() {
    this.logger.log('Running manual log export...');
    const collection = this.connection.collection('audit_logs');
    
    const logs = await collection.find({}).sort({ _receivedAt: -1 }).toArray();

    if (logs.length === 0) {
      return { message: 'No logs to export.' };
    }

    const jsonlData = logs.map(log => JSON.stringify(log)).join('\n');
    const buffer = Buffer.from(jsonlData, 'utf-8');
    
    const fileName = `manual-export-${Date.now()}.log`;
    
    try {
      const url = await this.storageService.uploadBuffer(buffer, fileName, 'text/plain');
      return { message: `Successfully exported ${logs.length} logs.`, url };
    } catch (e) {
      this.logger.error('Failed to export logs to MinIO', e);
      throw e;
    }
  }

  async saveLog(payload: any) {
    // Write log payload as a schemaless JSON document to MongoDB
    const collection = this.connection.collection('audit_logs');
    await collection.insertOne({
      ...payload,
      _receivedAt: new Date(),
    });
  }

  async findProfileLogs(page: string = '1', limit: string = '10') {
    const take = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * take;
    
    const collection = this.connection.collection('audit_logs');
    const query = { type: 'PROFILE_UPDATED' };
    
    const [data, total] = await Promise.all([
      collection.find(query).sort({ _receivedAt: -1 }).skip(skip).limit(take).toArray(),
      collection.countDocuments(query)
    ]);
    
    return { data, meta: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) } };
  }

  async findAttendanceLogs(page: string = '1', limit: string = '10') {
    const take = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * take;

    const collection = this.connection.collection('audit_logs');
    const query = { type: 'ATTENDANCE_LOGGED' };
    
    const [data, total] = await Promise.all([
      collection.find(query).sort({ _receivedAt: -1 }).skip(skip).limit(take).toArray(),
      collection.countDocuments(query)
    ]);

    return { data, meta: { total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) } };
  }
}
