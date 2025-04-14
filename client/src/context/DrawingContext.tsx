import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { NetworkingContext } from "./NetworkingContext.tsx";
import { Vector2 } from "../types.ts";

type DrawingData = {
  drawInfos: Map<number, PeerDrawInfo>;
};

type PeerDrawInfo = {
  position: Vector2;
  lines: Line[];
  currentLine: Line | undefined;
};

type Line = {
  points: Vector2[];
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
          const defaul: PeerDrawInfo = {
            position: drawMessage.position,
            lines: current?.lines ?? [],
            currentLine: current?.currentLine,
          };
          if (drawMessage.isDrawing) {
            if (defaul.currentLine !== undefined) {
              defaul.currentLine = {
                points: [...defaul.currentLine.points, defaul.position],
              };
            } else {
              defaul.currentLine = { points: [defaul.position] };
            }
          } else {
            if (defaul.currentLine !== undefined) {
              defaul.lines = [...defaul.lines, defaul.currentLine];
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
