import { useContext } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";

export function RemotePeerList() {
  const { connectedPeers } = useContext(NetworkingContext);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <PeerItem name={"You"} color={"blue"} />
      {[...Array(50)].map((_, i) => (
        <PeerItem name={"test"} color={"red"} key={i} />
      ))}
      {[...connectedPeers.values()].map((peer) => (
        <PeerItem
          name={peer.remotePeerId.toString()}
          color={"red"}
          key={peer.remotePeerId}
        />
      ))}
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
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          backgroundColor: color,
          borderRadius: "1.25rem",
        }}
      ></div>
      {name}
    </div>
  );
}
