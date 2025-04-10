import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getRandomInt } from "../types.ts";
import { NetworkingContext } from "./NetworkingContext.tsx";

type Data = {
  getPeerInfo: (id: number) => PeerInfo;
  localPeerInfo: PeerInfo;
  changeLocalPeerInfo: (peerInfo: PeerInfo) => void;
};

const nullPeerInfo: PeerInfo = {
  name: "anon",
  color: "transparent",
};

export const PeerInfoContext = createContext<Data>({
  getPeerInfo: () => nullPeerInfo,
  localPeerInfo: nullPeerInfo,
  changeLocalPeerInfo: () => {},
});

export function PeerInfoContextProvider({ children }: { children: ReactNode }) {
  const [peerInfos, setPeerInfos] = useState<Map<number, PeerInfo>>(new Map());
  const [localPeerInfo, setLocalPeerInfo] = useState<PeerInfo>(
    createDefaultPeerInfo(),
  );
  const localPeerInfoRef = useRef(localPeerInfo);
  const { subscribeMessage } = useContext(NetworkingContext);

  useEffect(() => {
    localPeerInfoRef.current = localPeerInfo;
  }, [localPeerInfo]);

  const getPeerInfo = useCallback(
    function (id: number) {
      return peerInfos.get(id) ?? nullPeerInfo;
    },
    [peerInfos],
  );

  function changeLocalPeerInfo(peerInfo: PeerInfo) {
    setLocalPeerInfo(peerInfo);
  }

  useEffect(() => {
    subscribeMessage((peer, message) => {
      if (message.type === "message") {
        const rtcMessage = message.message;
        if (rtcMessage.pType === "peerInfo") {
          const newPeerInfo = rtcMessage.info;
          const oldPeerInfo = getPeerInfo(peer.remotePeerId);
          setPeerInfos((prev) => {
            const map = new Map(prev);
            return map.set(peer.remotePeerId, {
              ...oldPeerInfo,
              ...newPeerInfo,
            });
          });
        }
      } else if (message.type === "connected") {
        peer.sendMessage("reliable", {
          pType: "peerInfo",
          info: localPeerInfoRef.current,
        });
      }
    });
  }, []);

  return (
    <PeerInfoContext.Provider
      value={{ getPeerInfo, localPeerInfo, changeLocalPeerInfo }}
    >
      {children}
    </PeerInfoContext.Provider>
  );
}

export type PeerInfo = {
  color: string;
  name: string;
};

function createDefaultPeerInfo() {
  return {
    color: possibleColors[getRandomInt(possibleColors.length - 1)],
    name: "anon",
  };
}

export const possibleColors = [
  "tomato",
  "mediumseagreen",
  "dodgerblue",
  "orange",
  "violet",
  "slateblue",
];
