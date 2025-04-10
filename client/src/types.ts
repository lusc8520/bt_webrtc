import { PeerInfo } from "./context/PeerInfoContext.tsx";

export type SendType = "reliable" | "unreliable";

export type RTCMessage =
  | {
      pType: "ping";
    }
  | {
      pType: "chatMessage";
      text: string;
    }
  | {
      pType: "peerInfo";
      info: Partial<PeerInfo>;
    };

export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
