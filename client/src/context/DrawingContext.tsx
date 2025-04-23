import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { NetworkingContext } from "./NetworkingContext.tsx";
import { Vector2 } from "../types.ts";
import {
  lineDisplayDuration,
  lineFadeDuration,
} from "../chat/DrawingBoard.tsx";

type DrawingData = {
  drawInfos: Map<number, PeerDrawInfo>;
};

type PeerDrawInfo = {
  position: Vector2;
  lines: Map<number, Line>;
  currentLine: Line | undefined;
  lineCount: number;
};

type Line = {
  points: Vector2[];
  fade: boolean;
};

export const DrawingContext = createContext<DrawingData>({
  drawInfos: new Map(),
});

export function DrawingContextProvider({ children }: { children: ReactNode }) {
  const { subscribeMessage } = useContext(NetworkingContext);
  const [drawInfos, setDrawInfos] = useState<Map<number, PeerDrawInfo>>(
    new Map(),
  );

  useEffect(() => {
    subscribeMessage((peer, message) => {
      if (message.type === "message" && message.message.pType === "draw") {
        const drawMessage = message.message;
        setDrawInfos((prev) => {
          const current = prev.get(peer.remotePeerId);
          const id = current?.lineCount ?? 0;
          const defaul: PeerDrawInfo = {
            position: drawMessage.position,
            lines: current?.lines ?? new Map(),
            currentLine: current?.currentLine,
            lineCount: id,
          };
          if (drawMessage.isDrawing) {
            if (defaul.currentLine !== undefined) {
              defaul.currentLine = {
                points: [...defaul.currentLine.points, defaul.position],
                fade: false,
              };
            } else {
              defaul.currentLine = { points: [defaul.position], fade: false };
            }
          } else {
            if (defaul.currentLine !== undefined) {
              defaul.lines.set(id, defaul.currentLine);
              defaul.lineCount++;
              const line = defaul.currentLine;
              setTimeout(() => {
                setDrawInfos((prev) => {
                  const peerInfo = prev.get(peer.remotePeerId);
                  if (peerInfo === undefined) return prev;
                  peerInfo.lines.set(id, { ...line, fade: true });
                  return new Map(prev);
                });
                setTimeout(() => {
                  setDrawInfos((prev) => {
                    const peerInfo = prev.get(peer.remotePeerId);
                    if (peerInfo === undefined) return prev;
                    peerInfo.lines.delete(id);
                    return new Map(prev);
                  });
                }, lineFadeDuration);
              }, lineDisplayDuration);
              defaul.currentLine = undefined;
            }
          }
          return new Map(prev).set(peer.remotePeerId, defaul);
        });
      } else if (message.type === "disconnected") {
        setDrawInfos((prev) => {
          const m = new Map(prev);
          m.delete(peer.remotePeerId);
          return m;
        });
      }
    });
  }, []);

  return (
    <DrawingContext.Provider value={{ drawInfos }}>
      {children}
    </DrawingContext.Provider>
  );
}
