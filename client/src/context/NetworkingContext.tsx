import { RTCMessage, SendType } from "../types.ts";
import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
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
import { TurnContext } from "./TurnContext.tsx";

export type ListenerMessage =
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

  const turnServer = useContext(TurnContext);

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

  function invokeEvent(peer: RemoteRTCPeer, param: ListenerMessage) {
    for (const listener of messageListeners.current) {
      listener(peer, param);
    }
  }

  useEffect(() => {
    window.onbeforeunload = unload;
  }, [unload]);

  const getOrCreatePeerConnection = useCallback(
    (peerId: number) => {
      const existent = peerConnections.get(peerId);
      if (existent != undefined) return existent;
      console.log("creating new peer. use turn config here...", turnServer);
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
          invokeEvent(remoteRTCPeer, { type: "connected" });
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
          invokeEvent(remoteRTCPeer, { type: "disconnected" });
        },
        onmessage: (message) => {
          invokeEvent(remoteRTCPeer, { type: "message", message: message });
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
