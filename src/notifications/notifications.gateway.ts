import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3001',
      'https://clientgui.vercel.app/',
      'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewNotification(payload: any) {
    this.server.emit('notification:new', payload);
  }
}
