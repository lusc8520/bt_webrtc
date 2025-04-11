import { useContext, useEffect, useRef, useState } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";
import {
  PeerInfoContext,
  possibleColors,
} from "../context/PeerInfoContext.tsx";

export function RemotePeerList() {
  const { connectedPeers } = useContext(NetworkingContext);
  const { getPeerInfo, localPeerInfo, changeLocalPeerInfo } =
    useContext(PeerInfoContext);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.3rem",
            justifyContent: "center",
          }}
        >
          {possibleColors.map((color) => {
            return (
              <div
                key={color}
                className={
                  "color-icon" +
                  (localPeerInfo.color === color ? " selected" : "")
                }
                style={{
                  backgroundColor: color,
                  height: "2rem",
                  width: "2rem",
                  borderRadius: "50%",
                }}
                onClick={() => {
                  changeLocalPeerInfo({
                    color: color,
                  });
                }}
              />
            );
          })}
        </div>
      </div>
      <LocalPeerItem />
      {[...connectedPeers.values()].map((peer) => {
        const peerInfo = getPeerInfo(peer.remotePeerId);
        return (
          <PeerItem
            name={peerInfo.name}
            color={peerInfo.color}
            key={peer.remotePeerId}
          />
        );
      })}
    </div>
  );
}

export function UserCircle({ color }: { color: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: "2.5rem",
        height: "2.5rem",
        backgroundColor: color,
        borderRadius: "50%",
      }}
    />
  );
}

function LocalPeerItem() {
  const { localPeerInfo, changeLocalPeerInfo } = useContext(PeerInfoContext);
  const [edit, setEdit] = useState(false);
  const [inputName, setInputName] = useState(localPeerInfo.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edit) {
      inputRef.current?.focus();
    }
  }, [edit]);

  function confirmNewName() {
    setEdit(false);
    if (inputName.length === 0 || inputName === localPeerInfo.name) {
      setInputName(localPeerInfo.name);
    } else {
      changeLocalPeerInfo({ name: inputName });
      setInputName(inputName);
    }
  }

  return (
    <div
      className="user-item"
      style={{
        borderRadius: "0.25rem",
        padding: "0.25rem 0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          overflow: "hidden",
        }}
      >
        <UserCircle color={localPeerInfo.color} />
        <div
          style={{
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          (You) {localPeerInfo.name}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {edit ? (
          <>
            <input
              onInput={(e) => {
                const newName = e.currentTarget.value;
                if (newName.length > 15) return;
                setInputName(newName);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  confirmNewName();
                }
              }}
              value={inputName}
              ref={inputRef}
              type="text"
              style={{
                background: "#232327",
                padding: "0rem 0.5rem",
                border: "none",
                flexGrow: 1,
                width: "1%",
                borderRadius: "0.25rem",
              }}
            />
            <button
              className="btn"
              style={{
                backgroundColor: "steelblue",
                borderRadius: "0.25rem",
                padding: "0.5rem 0.5rem",
                border: "none",
                color: "white",
                fontWeight: "bold",
              }}
              onClick={() => {
                confirmNewName();
              }}
            >
              OK
            </button>
            <button
              className="btn"
              style={{
                backgroundColor: "indianred",
                borderRadius: "0.25rem",
                padding: "0.5rem 0.5rem",
                border: "none",
                color: "white",
                fontWeight: "bold",
              }}
              onClick={() => {
                setEdit(false);
                setInputName(localPeerInfo.name);
              }}
            >
              NO
            </button>
          </>
        ) : (
          <button
            className="btn"
            style={{
              backgroundColor: "steelblue",
              borderRadius: "0.25rem",
              padding: "0.5rem 0.5rem",
              border: "none",
              color: "white",
              fontWeight: "bold",
            }}
            onClick={() => {
              setEdit(true);
            }}
          >
            Edit Name
          </button>
        )}
      </div>
    </div>
  );
}

export function PeerItem({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="user-item"
      style={{
        height: "3rem",
        borderRadius: "0.25rem",
        padding: "0.25rem 0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <UserCircle color={color} />
      {name}
    </div>
  );
}
