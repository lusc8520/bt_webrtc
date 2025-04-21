import { useContext, useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput.tsx";
import { RemotePeerList } from "./RemotePeerList.tsx";
import { util } from "../util/util.ts";
import { ChatMessages } from "./ChatMessages.tsx";
import { DrawingBoard } from "./DrawingBoard.tsx";
import { ChatMessagesContext } from "../context/ChatMessagesContext.tsx";

export function Chat() {
  const { messages } = useContext(ChatMessagesContext);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<"chat" | "draw">("chat");

  useEffect(() => {
    if (messages.length === 0) return;
    const div = messagesContainerRef.current!;
    if (messages[messages.length - 1].type === "remote") {
      const scrollOffset = div.scrollHeight - div.scrollTop - div.clientHeight;
      if (scrollOffset > 250) return;
    }
    div.scrollTo({ top: div.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (state === "chat") {
      const div = messagesContainerRef.current!;
      div.scrollTo({ top: div.scrollHeight });
    }
  }, [state]);

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
          minHeight: "50px",
          borderBottomStyle: "solid",
          borderBottomColor: util.borderColor,
          borderBottomWidth: "1px",
        }}
      />
      <div
        id="main-and-side"
        style={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          id="main-container"
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
          }}
        >
          <div
            id="selection"
            style={{
              display: "flex",
              borderBottomStyle: "solid",
              borderBottomWidth: "1px",
              borderBottomColor: util.borderColor,
            }}
          >
            <div
              style={{
                flexGrow: 1,
                display: "flex",
                borderRight: `1px solid ${util.borderColor}`,
                padding: "0.5rem 1rem",
              }}
            >
              <div
                className="btn"
                style={{
                  flexGrow: 1,
                  textAlign: "center",
                  borderRadius: "0.25rem",
                  backgroundColor:
                    state === "chat" ? "lightgrey" : "transparent",
                  color: state === "chat" ? "black" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  setState("chat");
                }}
              >
                Chat
              </div>
            </div>
            <div
              style={{
                flexGrow: 1,
                display: "flex",
                padding: "0.5rem 1rem",
              }}
            >
              <div
                className="btn"
                style={{
                  flexGrow: 1,
                  borderRadius: "0.25rem",
                  backgroundColor:
                    state === "draw" ? "lightgrey" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: state === "draw" ? "black" : "white",
                }}
                onClick={() => {
                  setState("draw");
                }}
              >
                Draw
              </div>
            </div>
          </div>
          {state === "chat" ? (
            <div
              id="chat-window"
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: "1",
                overflow: "hidden",
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
                <ChatMessages />
              </div>
              <div style={{ padding: "1rem 0.5rem", paddingTop: "0" }}>
                <ChatInput />
              </div>
            </div>
          ) : (
            <div
              id="draw-window"
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: "1",
                overflow: "hidden",
              }}
            >
              <DrawingBoard />
            </div>
          )}
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
