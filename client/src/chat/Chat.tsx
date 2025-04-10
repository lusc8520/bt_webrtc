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
    if (messages[messages.length - 1].type === "remote") {
      const scrollOffset = div.scrollHeight - div.scrollTop - div.clientHeight;
      if (scrollOffset > 250) return;
    }
    div.scrollTo({ top: div.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100svh",
        width: "100svw",
      }}
    >
      <div
        style={{
          height: "50px",
          borderBottomStyle: "solid",
          borderBottomColor: util.borderColor,
          borderBottomWidth: "1px",
        }}
      />
      <div
        style={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          id="chat-window"
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: "1",
          }}
        >
          <div
            id="messages-container"
            ref={messagesContainerRef}
            style={{
              flexGrow: "1",
              overflowY: "auto",
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
          id="user-list-container"
          style={{
            flexShrink: 0,
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
    </div>
  );
}
