import { PeerInfo } from "./context/PeerInfoContext.tsx";
import { GameMessage } from "./context/GameContext.tsx";

export type SendType = "reliable" | "unreliable";

export type RTCMessage =
  | {
      pType: "ping";
    }
  | {
      pType: "chatMessage";
      text: string;
      id: number;
    }
  | { pType: "deleteMessage"; id: number }
  | { pType: "editMessage"; id: number; text: string }
  | { pType: "rateMessage"; rateMessage: RateMessage }
  | {
      pType: "peerInfo";
      info: Partial<PeerInfo>;
    }
  | {
      pType: "draw";
      isDrawing: boolean;
      position: Vector2;
    }
  | { pType: "game"; gameMessage: GameMessage };

export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export type Vector2 = {
  x: number;
  y: number;
};

export const Vectors = {
  right: {
    x: 1,
    y: 0,
  },
  down: {
    x: 0,
    y: 1,
  },
  left: {
    x: -1,
    y: 0,
  },
  up: {
    x: 0,
    y: -1,
  },
};

export type RateMessage =
  | {
      type: "yours";
      messageId: number;
      rating: boolean | null;
    }
  | {
      type: "other";
      peerId: number;
      messageId: number;
      rating: boolean | null;
    }
  | {
      type: "mine";
      messageId: number;
      rating: boolean | null;
    };
