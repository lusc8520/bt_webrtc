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
  getRandomDir: () => {
    const n = getRandomInt(3);
    switch (n) {
      case 0:
        return Vectors.right;
      case 1:
        return Vectors.down;
      case 2:
        return Vectors.up;
      case 3:
        return Vectors.down;
      default:
        return Vectors.right;
    }
  },
  add: (vec1: Vector2, vec2: Vector2) => {
    return {
      x: vec1.x + vec2.x,
      y: vec1.y + vec2.y,
    };
  },
  equals: (vec1: Vector2, vec2: Vector2) => {
    return vec1.x === vec2.x && vec1.y === vec2.y;
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
