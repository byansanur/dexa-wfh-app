import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ 
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
  } 
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  notifyProfileUpdated(user: any) {
    this.server.emit('ProfileUpdated', user);
  }

  notifyAutoClockOut(userId: string) {
    this.server.emit('AutoClockOut', { userId });
  }
}
