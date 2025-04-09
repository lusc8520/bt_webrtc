import { RTCMessage, SendType } from "../types.ts";
import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ClientMessage, ServerMessage } from "../../../contract/sharedTypes.ts";

type ListenerMessage =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "message"; message: RTCMessage };
type MessageListener = (peer: RemoteRTCPeer, message: ListenerMessage) => void;

type Data = {
  broadCast: (sendType: SendType, message: RTCMessage) => void;
  subscribeMessage: (listener: MessageListener) => void;
  connectedPeers: Map<number, RemoteRTCPeer>;
};

export const NetworkingContext = createContext<Data>({
  broadCast: () => {},
  subscribeMessage: () => {},
  connectedPeers: new Map(),
});

const wsUrl = "ws://localhost:8080";
export function NetworkingContextProvider({
  children,
}: {
  children: ReactNode;
}) {
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
    for (const peer of connectedPeers.values()) {
      peer.shutDown();
    }
  }, [peerConnections, signalingServer, connectedPeers]);

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
      const remoteRTCPeer = new RemoteRTCPeer({
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
          remoteRTCPeer.createOffer().then((offer) => {
            remoteRTCPeer.setLocalDescription(offer);
            sendMessage({ pType: "sdp", clientId: peerId, sdp: offer });
          });
        },
        onopen: () => {
          console.warn(`connected to peer ${peerId}`);
          setConnectedPeers((prevState) => {
            const map = new Map(prevState);
            return map.set(peerId, remoteRTCPeer);
          });
          for (const listener of messageListeners.current) {
            listener(remoteRTCPeer, { type: "connected" });
          }
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
          for (const listener of messageListeners.current) {
            listener(remoteRTCPeer, { type: "disconnected" });
          }
        },
        onmessage: (message) => {
          for (const listener of messageListeners.current) {
            listener(remoteRTCPeer, { type: "message", message: message });
          }
        },
      });
      setPeerConnections((prevState) => {
        const map = new Map(prevState);
        return map.set(peerId, remoteRTCPeer);
      });
      return remoteRTCPeer;
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
    <NetworkingContext.Provider
      value={{ broadCast, subscribeMessage, connectedPeers }}
    >
      {children}
    </NetworkingContext.Provider>
  );
}
