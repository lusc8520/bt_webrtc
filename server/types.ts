import { WebSocket } from "ws";

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

export type ServerMessage = ClientMessage | { pType: "joined"; ids: number[] };

export type ClientMessage = BaseMessage & { clientId: number };

type BaseMessage =
  | {
      pType: "sdp";
      sdp: RTCSessionDescriptionInit;
    }
  | {
      pType: "ice";
      ice: RTCIceCandidateInit;
    };
