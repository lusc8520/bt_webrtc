import { useAppContext } from "../context/AppContext.tsx";
import { useEffect } from "react";
import { ChatInput } from "./ChatInput.tsx";

export function Chat() {
  const { broadCast, subscribeMessage } = useAppContext();

  useEffect(() => {
    subscribeMessage((peerId, message) => {
      console.error(peerId, message);
    });
  }, [subscribeMessage]);

  return (
    <div
      style={{
        height: "100svh",
        width: "100svw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flexGrow: "1" }}></div>
      <div style={{ padding: "1rem 0.5rem" }}>
        <ChatInput
          onConfirm={(e) => {
            console.log(e);
          }}
        />
      </div>
    </div>
  );
}
