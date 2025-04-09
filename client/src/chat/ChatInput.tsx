import * as React from "react";
import { util } from "../util/util.ts";
import { useContext } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";

export function ChatInput({
  onConfirm,
}: {
  onConfirm?: (text: string) => void;
}) {
  const [text, setText] = React.useState("");

  const { broadCast } = useContext(NetworkingContext);

  function confirmText() {
    if (text === "") return;
    onConfirm?.(text);
    broadCast("reliable", { pType: "chatMessage", text: text });
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
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
