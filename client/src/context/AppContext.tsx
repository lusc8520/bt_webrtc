import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientMessage, ServerMessage } from "../../../contract/sharedTypes.ts";
import { RemoteRTCPeer } from "../peerConnection/RemoteRTCPeer.ts";
import { RTCMessage, SendType } from "../types.ts";

type Data = {
  status: number;
};

const wsUrl = "ws://localhost:8080";
const AppContext = createContext<Data>({ status: 0 });

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [signalingServer, setSignalingServer] = useState<WebSocket | null>(
    null,
  );
  const [peerConnections, setPeerConnections] = useState<
    Map<number, RemoteRTCPeer>
  >(new Map());

  const sendMessage = useCallback(
    (message: ClientMessage) => {
      signalingServer?.send(JSON.stringify(message));
    },
    [signalingServer],
  );

  const unload = useCallback(() => {
    signalingServer?.close();
    for (const peer of peerConnections.values()) {
      peer.shutDown();
    }
  }, [peerConnections, signalingServer]);

  const broadCast = useCallback(
    (sendType: SendType, message: RTCMessage) => {
      for (const peer of peerConnections.values()) {
        peer.sendMessage(sendType, message);
      }
    },
    [peerConnections],
  );

  useEffect(() => {
    window.onbeforeunload = unload;
  }, [unload]);

  const getOrCreatePeerConnection = useCallback(
    (peerId: number) => {
      const existent = peerConnections.get(peerId);
      if (existent != undefined) return existent;
      const peerConnection = new RemoteRTCPeer({
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
        peerId: peerId,
        onicecandidate: (event) => {
          const candidate = event.candidate;
          if (candidate === null) return;
          sendMessage({
            pType: "ice",
            clientId: peerId,
            ice: candidate.toJSON(),
          });
        },
        onnegotiationneeded: () => {
          peerConnection.createOffer().then((offer) => {
            peerConnection.setLocalDescription(offer);
            sendMessage({ pType: "sdp", clientId: peerId, sdp: offer });
          });
        },
        onopen: () => {
          console.warn(`connected to ${peerId}`);
        },
        onclose: () => {
          console.warn(`disconnected from ${peerId}`);
          setPeerConnections((prevState) => {
            const map = new Map(prevState);
            map.delete(peerId);
            return map;
          });
        },
        onmessage: (message) => {},
      });
      setPeerConnections((prevState) => {
        const map = new Map(prevState);
        return map.set(peerId, peerConnection);
      });
      return peerConnection;
    },
    [peerConnections, sendMessage],
  );

  function handleIceMessage(peerId: number, ice: RTCIceCandidateInit) {
    getOrCreatePeerConnection(peerId).addIceCandidate(ice);
  }

  function handleSdpMessage(peerId: number, sdp: RTCSessionDescriptionInit) {
    const peer = getOrCreatePeerConnection(peerId);
    if (sdp.type === "offer") {
      peer.setRemoteDescription(sdp);
      peer.createAnswer().then((answer) => {
        peer.setLocalDescription(answer);
        sendMessage({ pType: "sdp", clientId: peerId, sdp: answer });
      });
    } else if (sdp.type === "answer") {
      peer.setRemoteDescription(sdp);
    }
  }

  function handleSignalingMessage(message: ServerMessage) {
    switch (message.pType) {
      case "joined":
        for (const id of message.ids) {
          getOrCreatePeerConnection(id);
        }
        break;
      case "ice":
        handleIceMessage(message.clientId, message.ice);
        break;
      case "sdp":
        handleSdpMessage(message.clientId, message.sdp);
        break;
    }
  }

  useEffect(() => {
    console.warn("connecting to signaling server...");
    setSignalingServer(new WebSocket(wsUrl));
  }, []);

  if (signalingServer != null) {
    signalingServer.onopen = () => {
      console.warn("connected to signaling server! :)");
    };

    signalingServer.onmessage = (event) => {
      try {
        handleSignalingMessage(JSON.parse(event.data));
      } catch {
        // ignored
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
    };
  }

  return (
    <AppContext.Provider value={{ status: 0 }}>{children}</AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
