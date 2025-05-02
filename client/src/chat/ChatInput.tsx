import { util } from "../util/util.ts";
import { useContext, useRef, useState } from "react";
import {
  ChatMessagesContext,
  maxMessageLength,
} from "../context/ChatMessagesContext.tsx";
import { FileUploadSvg } from "../svg.tsx";

export function ChatInput() {
  const [text, setText] = useState("");

  const { broadCastMessage } = useContext(ChatMessagesContext);

  const inputRef = useRef<HTMLInputElement>(null);

  function confirmText() {
    if (text === "") return;
    broadCastMessage(text);
    setText("");
  }
  return (
    <div style={{ height: "4rem", display: "flex", gap: "0.5rem" }}>
      <input
        style={{ display: "none" }}
        ref={inputRef}
        type="file"
        onChange={(e) => {
          const files = e.currentTarget.files;
          if (files === null) return;
          const file = files[0];
          if (file === null) return;
          broadCastMessage(file);
          inputRef.current!.value = "";
        }}
      />
      <button
        style={{
          alignSelf: "center",
          width: "3rem",
          aspectRatio: 1,
          backgroundColor: "transparent",
          borderStyle: "solid",
          borderColor: util.borderColor,
          borderWidth: 1,
          padding: 0,
          margin: 0,
        }}
        className="btn"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <FileUploadSvg />
      </button>
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
