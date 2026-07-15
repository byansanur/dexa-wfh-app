import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  notifyProfileUpdated(user: any) {
    this.server.emit('ProfileUpdated', user);
  }
}
