import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AuditLogService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

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
