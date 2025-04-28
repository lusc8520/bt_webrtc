import { util } from "../util/util.ts";
import { useContext, useState } from "react";
import {
  ChatMessagesContext,
  maxMessageLength,
} from "../context/ChatMessagesContext.tsx";

export function ChatInput() {
  const [text, setText] = useState("");

  const { broadCastMessage } = useContext(ChatMessagesContext);

  function confirmText() {
    if (text === "") return;
    broadCastMessage(text);
    setText("");
  }
  return (
    <div style={{ height: "4rem", display: "flex", gap: "0.5rem" }}>
      <input
        className="chat-input"
        style={{
          background: "#232327",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: util.borderColor,
          borderRadius: "0.5rem",
          flexGrow: "1",
          padding: "0 1rem",
          fontSize: "1.5rem",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            confirmText();
          }
        }}
        placeholder={text === "" ? "Write Message..." : ""}
        type={"text"}
        value={text}
        onChange={(e) => {
          if (e.target.value.length > maxMessageLength) return;
          setText(e.target.value);
        }}
      />
    </div>
  );
}
