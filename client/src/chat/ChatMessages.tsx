import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";

type Props = {
  messages: ChatMessage[];
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

export function ChatMessages({ messages }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "100px" }}>
      {messages.map((message, index) => {
        if (message.type === "remote") {
          return (
            <Message
              text={message.text}
              id={message.peer.remotePeerId}
              key={index}
            />
          );
        } else {
          return <Message text={message.text} id={0} key={index} />;
        }
      })}
    </div>
  );
}

function Message({ text, id }: { text: string; id: number }) {
  return (
    <div className="user-item" style={{ height: "200px", borderRadius: "3px" }}>
      {id} : {text}
    </div>
  );
}
