import * as React from "react";

export function ChatInput({
  onConfirm,
}: {
  onConfirm?: (text: string) => void;
}) {
  const [text, setText] = React.useState("");

  function confirmText() {
    if (text === "") return;
    onConfirm?.(text);
    setText("");
  }
  return (
    <div style={{ height: "50px", display: "flex", gap: "0.5rem" }}>
      <input
        className="chat-input"
        style={{
          background: "#232327",
          border: "0.5px solid gray",
          flexGrow: "1",
          borderRadius: "0.5rem",
          padding: "0 1rem",
          fontSize: "1.25rem",
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
      <button
        className="btn"
        style={{ padding: "0", border: "none", color: "black" }}
        onClick={confirmText}
      >
        send
      </button>
    </div>
  );
}
