import { useContext } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";
import {
  PeerInfoContext,
  possibleColors,
} from "../context/PeerInfoContext.tsx";

export function RemotePeerList() {
  const { connectedPeers, broadCast } = useContext(NetworkingContext);
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
                    name: localPeerInfo.name,
                    color: color,
                  });
                  broadCast("reliable", {
                    pType: "peerInfo",
                    info: { ...localPeerInfo, color: color },
                  });
                }}
              />
            );
          })}
        </div>
      </div>
      <PeerItem
        name={localPeerInfo.name + " (You)"}
        color={localPeerInfo.color}
      />
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
