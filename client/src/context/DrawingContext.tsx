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
          return new Map(prev).set(peer.remotePeerId, {
            position: drawMessage.position,
          });
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
