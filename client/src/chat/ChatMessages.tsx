import { useContext } from "react";
import { UserCircle } from "./RemotePeerList.tsx";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";
import {
  ChatMessagesContext,
  LocalChatMessage,
  RemoteChatMessage,
} from "../context/ChatMessagesContext.tsx";
import { util } from "../util/util.ts";

export function ChatMessages() {
  const { messages } = useContext(ChatMessagesContext);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {messages.map((message, index) => {
        if (message.type === "local") {
          return <LocalMessage key={index} message={message} />;
        } else {
          return <RemoteMessage key={index} message={message} />;
        }
      })}
    </div>
  );
}

function LocalMessage({ message }: { message: LocalChatMessage }) {
  const { localPeerInfo } = useContext(PeerInfoContext);
  const { broadCastDelete } = useContext(ChatMessagesContext);
  return (
    <div
      className="user-item"
      style={{
        borderRadius: "3px",
        display: "flex",
        padding: "0.5rem",
        gap: "1rem",
        position: "relative",
      }}
    >
      <UserCircle color={localPeerInfo.color} />
      <div
        className="message-edit"
        style={{
          position: "absolute",
          top: "-0.8rem",
          right: "1rem",
          padding: "0.2rem 0.5rem",
          backgroundColor: "#2c2d32",
          borderRadius: "0.5rem",
          borderColor: util.borderColor,
          borderWidth: "1px",
          borderStyle: "solid",
          boxShadow: "0 0.2rem 0.5rem rgba(0, 0, 0, 0.5)",
        }}
      >
        <button
          className="btn deleteButton"
          style={{
            fontWeight: "bold",
            backgroundColor: "indianred",
            padding: "0.1rem 0.3rem",
            margin: "0",
            border: "none",
            borderRadius: "0.1rem",
          }}
          onClick={() => {
            broadCastDelete(message.id);
          }}
        >
          Delete
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div
          style={{
            color: localPeerInfo.color,
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          {localPeerInfo.name} {"(You)"}
        </div>
        <div>{message.text}</div>
      </div>
    </div>
  );
}

function RemoteMessage({ message }: { message: RemoteChatMessage }) {
  const { getPeerInfo } = useContext(PeerInfoContext);
  const peerInfo = getPeerInfo(message.peer.remotePeerId);
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
          {peerInfo.name}
        </div>
        <div>{message.text}</div>
      </div>
    </div>
  );
}
