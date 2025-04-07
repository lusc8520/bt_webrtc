import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ClientMessage, ServerMessage } from "../../../contract/sharedTypes.ts";
import { RemoteRTCPeer } from "../peer_connection/RemoteRTCPeer.ts";
import { RTCMessage, SendType } from "../types.ts";

type Data = {
  broadCast: (sendType: SendType, message: RTCMessage) => void;
  subscribeMessage: (func: MessageListener) => void;
};

type MessageListener = (peerId: number, message: RTCMessage) => void;

const wsUrl = "ws://localhost:8080";
const AppContext = createContext<Data>({
  broadCast: () => {},
  subscribeMessage: () => {},
});

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [signalingServer, setSignalingServer] = useState<WebSocket | undefined>(
    undefined,
  );
  const messageListeners = useRef<MessageListener[]>([]);
  const [peerConnections, setPeerConnections] = useState<
    Map<number, RemoteRTCPeer>
  >(new Map());
  const [connectedPeers, setConnectedPeers] = useState<
    Map<number, RemoteRTCPeer>
  >(new Map());

  const subscribeMessage = useCallback((listener: MessageListener) => {
    messageListeners.current.push(listener);
  }, []);

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
      for (const peer of connectedPeers.values()) {
        peer.sendMessage(sendType, message);
      }
    },
    [connectedPeers],
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
          console.warn(`connected to peer ${peerId}`);
          setConnectedPeers((prevState) => {
            const map = new Map(prevState);
            return map.set(peerId, peerConnection);
          });
        },
        onclose: () => {
          console.warn(`disconnected from peer ${peerId}`);
          setPeerConnections((prevState) => {
            const map = new Map(prevState);
            map.delete(peerId);
            return map;
          });
          setConnectedPeers((prevState) => {
            const map = new Map(prevState);
            map.delete(peerId);
            return map;
          });
        },
        onmessage: (message) => {
          for (const listener of messageListeners.current) {
            listener(peerId, message);
          }
        },
      });
      setPeerConnections((prevState) => {
        const map = new Map(prevState);
        return map.set(peerId, peerConnection);
      });
      return peerConnection;
    },
    [peerConnections, sendMessage],
  );

  function handleSignalingMessage(message: ServerMessage) {
    switch (message.pType) {
      case "joined":
        for (const id of message.ids) {
          getOrCreatePeerConnection(id);
        }
        break;
      case "ice":
        getOrCreatePeerConnection(message.clientId).addIceCandidate(
          message.ice,
        );
        break;
      case "sdp": {
        const sdp = message.sdp;
        const peerId = message.clientId;
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
        break;
      }
    }
  }

  useEffect(() => {
    console.warn("connecting to signaling server...");
    setSignalingServer(new WebSocket(wsUrl));
  }, []);

  if (signalingServer != undefined) {
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
    <AppContext.Provider value={{ broadCast, subscribeMessage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
