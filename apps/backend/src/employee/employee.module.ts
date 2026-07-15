import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'audit_logs_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [EmployeeController, AdminController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
