import { createContext, ReactNode, useEffect, useState } from "react";
import { env } from "../env.ts";

const nullTurnServer: RTCIceServer = { urls: "" };

export const TurnContext = createContext<RTCIceServer>(nullTurnServer);

export function TurnContextProvider({ children }: { children: ReactNode }) {
  const [turnServer, setTurnServer] = useState<RTCIceServer | undefined>(
    undefined,
  );

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const res = await fetch(`${env.baseUrl}/api/turn`);
      const iceServer = (await res.json()) as RTCIceServer;
      console.warn("retrieved ice server:", iceServer);
      setTurnServer(iceServer);
    } catch {
      setTurnServer(nullTurnServer);
    }
  }

  if (turnServer === undefined) return null;

  return (
    <TurnContext.Provider value={turnServer}>{children}</TurnContext.Provider>
  );
}
