import { useContext, useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput.tsx";
import { NetworkingContext } from "../context/NetworkingContext.tsx";
import { RemotePeerList } from "./RemotePeerList.tsx";
import { util } from "../util/util.ts";
import { ChatMessage, ChatMessages } from "./ChatMessages.tsx";

export function Chat() {
  const { subscribeMessage } = useContext(NetworkingContext);

  useEffect(() => {
    subscribeMessage((peer, message) => {
      if (message.type === "message") {
        if (message.message.pType === "chatMessage") {
          const text = message.message.text;
          addMessage({ type: "remote", peer: peer, text: text });
        }
      }
    });
  }, [subscribeMessage]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function addMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const div = messagesContainerRef.current!;
    if (messages[messages.length - 1].type === "local") {
      div.scrollTo({ top: div.scrollHeight, behavior: "smooth" });
    } else {
      const scrollOffset = div.scrollHeight - div.scrollTop - div.clientHeight;
      if (scrollOffset > 250) return;
      div.scrollTo({ top: div.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      style={{
        height: "100svh",
        width: "100svw",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: "1",
        }}
      >
        <div
          ref={messagesContainerRef}
          style={{
            flexGrow: "1",
            overflowX: "auto",
            padding: "1rem 0rem",
            scrollbarColor: util.scrollbarColor,
          }}
        >
          <ChatMessages messages={messages} />
        </div>
        <div style={{ padding: "1rem 0.5rem", paddingTop: "0" }}>
          <ChatInput
            onConfirm={(text) => {
              addMessage({ type: "local", text });
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: "250px",
          borderLeftWidth: "1px",
          borderLeftStyle: "solid",
          borderLeftColor: util.borderColor,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: util.scrollbarColor,
          padding: "0.5rem",
        }}
      >
        <RemotePeerList />
      </div>
    </div>
  );
}
