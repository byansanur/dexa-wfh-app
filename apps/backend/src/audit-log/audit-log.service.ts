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

  async findProfileLogs() {
    const collection = this.connection.collection('audit_logs');
    return collection.find({ type: 'PROFILE_UPDATED' }).sort({ _receivedAt: -1 }).limit(100).toArray();
  }

  async findAttendanceLogs() {
    const collection = this.connection.collection('audit_logs');
    return collection.find({ type: 'ATTENDANCE_LOGGED' }).sort({ _receivedAt: -1 }).limit(100).toArray();
  }
}
