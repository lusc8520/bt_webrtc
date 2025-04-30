import { CSSProperties, useContext, useState } from "react";
import { UserCircle } from "./RemotePeerList.tsx";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";
import {
  ChatMessage,
  ChatMessagesContext,
  LocalChatMessage,
  maxMessageLength,
  Rating,
  RemoteChatMessage,
} from "../context/ChatMessagesContext.tsx";
import { util } from "../util/util.ts";
import YouTube from "react-youtube";

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
  const { broadCastDelete, broadCastEdit } = useContext(ChatMessagesContext);
  const [isEdit, setIsEdit] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const { html, foundLinks } = urlify(message.text);
  function cancelEdit() {
    setEditText(message.text);
    setIsEdit(false);
  }

  function confirmEdit() {
    if (editText === "" || editText === message.text) {
      cancelEdit();
      return;
    }
    broadCastEdit(message.id, editText);
    setIsEdit(false);
  }

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
        className={isEdit ? "hide" : "message-edit"}
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
          gap: "0.5rem",
        }}
      >
        <button
          className="btn deleteButton"
          style={{
            fontSize: "1rem",
            backgroundColor: "dodgerblue",
            padding: "0.2rem 0.5rem",
            margin: "0",
            border: "none",
            borderRadius: "0.2rem",
          }}
          onClick={() => {
            setIsEdit(true);
          }}
        >
          Edit
        </button>
        <button
          className="btn deleteButton"
          style={{
            fontSize: "1rem",
            backgroundColor: "indianred",
            padding: "0.2rem 0.5rem",
            margin: "0",
            border: "none",
            borderRadius: "0.2rem",
          }}
          onClick={() => {
            broadCastDelete(message.id);
          }}
        >
          Delete
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            color: localPeerInfo.color,
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          {localPeerInfo.name} {"(You)"}
        </div>
        {isEdit ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <input
              value={editText}
              className="chat-input"
              style={{
                color: "white",
                margin: "0",
                fontSize: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#232327",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor: util.borderColor,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  confirmEdit();
                }
              }}
              onChange={(e) => {
                if (e.target.value.length > maxMessageLength) return;
                setEditText(e.currentTarget.value);
              }}
              type="text"
            />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
              }}
            >
              <button
                style={{
                  backgroundColor: "forestgreen",
                  padding: "0.2rem 0.5rem",
                  margin: "0",
                  border: "none",
                  borderRadius: "0.2rem",
                  fontSize: "1rem",
                }}
                className="btn"
                onClick={() => {
                  confirmEdit();
                }}
              >
                Confirm
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: "indianred",
                  padding: "0.2rem 0.5rem",
                  margin: "0",
                  border: "none",
                  borderRadius: "0.2rem",
                  fontSize: "1rem",
                }}
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              wordBreak: "break-word",
              wordWrap: "break-word",
              textWrap: "wrap",
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: html }} />
            {message.edited && <EditedIndicator />}
          </div>
        )}
        <AdditionalLinks links={foundLinks} />
        <MessageRating message={message} />
      </div>
    </div>
  );
}

function MessageRating({ message }: { message: ChatMessage }) {
  const [rating, setRating] = useState<Rating>(message.localRating);
  const { broadCastRemoteRating, broadCastLocalRating } =
    useContext(ChatMessagesContext);

  function updateRating(r: Rating) {
    const newRating = r === rating ? null : r;
    console.warn(newRating);
    setRating(newRating);
    if (message.type === "local") {
      broadCastLocalRating(message.id, newRating);
    } else {
      broadCastRemoteRating(message.peer.remotePeerId, message.id, newRating);
    }
  }

  const remoteRatings = [...message.remoteRatings];
  let likeCount = remoteRatings.filter(([, rating]) => rating === true).length;
  let dislikeCount = remoteRatings.filter(
    ([, rating]) => rating === false,
  ).length;
  const localRating = message.localRating;
  if (localRating !== null) {
    if (localRating) {
      likeCount++;
    } else {
      dislikeCount++;
    }
  }

  function getStyle(value: boolean) {
    if (rating === null) return ratingButtonStyle;
    if (value === rating) return ratingButtonStyleActive(value);
    return ratingButtonStyle;
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => {
          updateRating(true);
        }}
        style={getStyle(true)}
        className="btn"
      >
        <span style={arrowStyle}>↑</span> {likeCount}
      </button>
      <button
        onClick={() => {
          updateRating(false);
        }}
        style={getStyle(false)}
        className="btn"
      >
        <span style={arrowStyle}>↓</span> {dislikeCount}
      </button>
    </div>
  );
}

const arrowStyle: CSSProperties = {
  fontWeight: "bolder",
};

const ratingButtonStyle: CSSProperties = {
  borderStyle: "solid",
  borderWidth: "2px",
  margin: 0,
  padding: "0.25rem 1rem",
  borderColor: util.borderColor,
  fontSize: "1rem",
  backgroundColor: "transparent",
};

const ratingButtonStyleActive = (value: boolean) => {
  return {
    ...ratingButtonStyle,
    backgroundColor: value ? "darkgreen" : "darkred",
  };
};

function EditedIndicator() {
  return (
    <span
      style={{
        color: "grey",
        fontSize: "0.9rem",
        paddingLeft: "0.5rem",
      }}
    >
      (edited)
    </span>
  );
}

function RemoteMessage({ message }: { message: RemoteChatMessage }) {
  const { getPeerInfo } = useContext(PeerInfoContext);
  const peerInfo = getPeerInfo(message.peer.remotePeerId);
  const { html, foundLinks } = urlify(message.text);
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
      <UserCircle color={peerInfo.color} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            color: peerInfo.color,
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          {peerInfo.name}
        </div>
        <div
          style={{
            wordBreak: "break-word",
            wordWrap: "break-word",
            textWrap: "wrap",
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: html }} />
          {message.edited && <EditedIndicator />}
        </div>
        <AdditionalLinks links={foundLinks} />
        <MessageRating message={message} />
      </div>
    </div>
  );
}

const urlRegex = /(((https?:\/\/)|(www\.))\S+)/g;
// https://stackoverflow.com/a/25821576/25311842
function urlify(text: string) {
  const foundLinks: string[] = [];
  const html = text.replace(urlRegex, function (url, _b, c) {
    const url2 = c == "www." ? "https://" + url : url;
    foundLinks.push(url2);
    return (
      '<a class="text-link" href="' + url2 + '" target="_blank">' + url + "</a>"
    );
  });
  return { html, foundLinks };
}
function isImageLink(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(url);
}

const youTubeRegex =
  /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/;
function extractYoutubeId(url: string) {
  const matches = youTubeRegex.exec(url);
  if (matches === null) {
    return null;
  }
  return matches[3];
}

function AdditionalLinks({ links }: { links: string[] }) {
  return (
    <>
      {links.map((link) => {
        if (isImageLink(link)) {
          return (
            <div
              style={{
                flexGrow: 1,
                maxWidth: "500px",
              }}
            >
              <img
                style={{
                  width: "100%",
                  height: "100%",
                }}
                src={link}
              />
            </div>
          );
        }
        const youTubeId = extractYoutubeId(link);
        if (youTubeId != null) {
          return (
            <YouTube
              opts={{ width: "100%", height: "100%" }}
              style={{
                flexGrow: 1,
                maxWidth: "500px",
                aspectRatio: 16 / 9,
              }}
              videoId={youTubeId}
            />
          );
        }
        return null;
      })}
    </>
  );
}
