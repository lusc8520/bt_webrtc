import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
import { ReactNode, useContext } from "react";
import { UserCircle } from "./RemotePeerList.tsx";
import { PeerInfo, PeerInfoContext } from "../context/PeerInfoContext.tsx";

type Props = {
  messages: ChatMessage[];
  children?: ReactNode;
};

export type ChatMessage =
  | {
      type: "local";
      text: string;
    }
  | {
      type: "remote";
      text: string;
      peer: RemoteRTCPeer;
    };

export function ChatMessages({ messages, children }: Props) {
  const { getPeerInfo, localPeerInfo } = useContext(PeerInfoContext);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {messages.map((message, index) => {
        if (message.type === "remote") {
          return (
            <Message
              text={message.text}
              peerInfo={getPeerInfo(message.peer.remotePeerId)}
              key={index}
            />
          );
        } else {
          return (
            <Message
              text={message.text}
              peerInfo={localPeerInfo}
              key={index}
              isLocal={true}
            />
          );
        }
      })}
      {children}
    </div>
  );
}

function Message({
  text,
  peerInfo,
  isLocal,
}: {
  text: string;
  peerInfo: PeerInfo;
  isLocal?: boolean;
}) {
  return (
    <div
      className="user-item"
      style={{
        borderRadius: "3px",
        display: "flex",
        padding: "0.5rem",
        gap: "1rem",
      }}
    >
      <UserCircle color={peerInfo.color} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div
          style={{
            color: peerInfo.color,
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          {peerInfo.name} {isLocal && "(You)"}
        </div>
        <div>{text}</div>
      </div>
    </div>
  );
}
