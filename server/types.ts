import { WebSocket } from "ws";
import { ServerMessage } from "../contract/sharedTypes";

export class Client {
  id: number;
  websocket: WebSocket;

  constructor(id: number, websocket: WebSocket) {
    this.id = id;
    this.websocket = websocket;
  }

  sendMessage(message: ServerMessage): void {
    this.websocket.send(JSON.stringify(message));
  }
}
