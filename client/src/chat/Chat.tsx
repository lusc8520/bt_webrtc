import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput.tsx";
import { RemotePeerList } from "./RemotePeerList.tsx";
import { util } from "../util/util.ts";
import { ChatMessages } from "./ChatMessages.tsx";
import { DrawingBoard } from "./DrawingBoard.tsx";
import { scrollDownEvent } from "../context/ChatMessagesContext.tsx";

export function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<"chat" | "draw">("chat");

  useEffect(() => {
    scrollDownEvent.addEventListener(() => {
      scrollDown("smooth");
    });
  }, []);

  function scrollDown(behaviour: ScrollBehavior) {
    const div = messagesContainerRef.current!;
    div.scrollTo({ top: div.scrollHeight, behavior: behaviour });
  }

  useEffect(() => {
    if (state === "chat") {
      scrollDown("instant");
    }
  }, [state]);

  return (
    <div
      id="main-and-side"
      style={{
        flexGrow: 1,
        overflow: "hidden",
        display: "flex",
        height: "100svh",
        width: "100svw",
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
                backgroundColor: state === "chat" ? "lightgrey" : "transparent",
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
                backgroundColor: state === "draw" ? "lightgrey" : "transparent",
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
                overflowX: "hidden",
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
  );
}
