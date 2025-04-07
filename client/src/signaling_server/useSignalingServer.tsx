import { useCallback, useEffect, useState } from "react";
import { ClientMessage, ServerMessage } from "../../../contract/sharedTypes.ts";

const wsUrl = "ws://localhost:8080";

type Input = {
  onmessage: (message: ClientMessage) => void;
};

type State = { state: "loading" } | SignalingOpen | { state: "closed" };

export type SignalingOpen = {
  state: "open";
  ids: number[];
  sendMessage: (message: ClientMessage) => void;
};

export function useSignalingServer({ onmessage }: Input): State {
  const [state, setState] = useState<State>({ state: "loading" });
  const [signalingServer, setSignalingServer] = useState<WebSocket | undefined>(
    undefined,
  );

  const sendMessage = useCallback(
    (message: ClientMessage) => {
      signalingServer?.send(JSON.stringify(message));
    },
    [signalingServer],
  );

  useEffect(() => {
    console.warn("connecting to signaling server...");
    setSignalingServer(new WebSocket(wsUrl));
  }, []);

  if (signalingServer != undefined) {
    signalingServer.onopen = () => {
      console.warn("connected to signaling server! :)");
      //setState({ state: "open", signalingServer: signalingServer });
    };

    signalingServer.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.pType === "joined") {
          setState({
            state: "open",
            ids: message.ids,
            sendMessage,
          });
        } else {
          onmessage(message);
        }
      } catch (error) {
        console.error(error);
        // ignored
        // TODO ...
      }
    };

    signalingServer.onerror = (event) => {
      console.error(
        "error from signaling server:",
        event,
        "closing connection to signaling server...",
      );
      signalingServer.close();
    };
    signalingServer.onclose = () => {
      console.warn("disconnected from signaling server");
      setState({ state: "closed" });
    };
  }

  return state;
}
