import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Vector2, Vectors } from "../types.ts";
import {
  ListenerMessage,
  NetworkingContext,
  onMessage,
} from "./NetworkingContext.tsx";
import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
import { util } from "../util/util.ts";

type GameContextProps = {
  localState: PlayerState;
  remoteStates: Map<number, PlayerState>;
  move: (dir: Vector2) => void;
};

export type PlayerState = {
  gridPos: Vector2;
};

export abstract class GameConstants {
  static gameFieldSize = 100;
  static cellCount = 15;
  // static cellSize = GameConstants.gameFieldSize / GameConstants.cellCount;
  //
  // static gameGrid: number[][] = Array.from(
  //   { length: GameConstants.cellCount },
  //   () => Array(GameConstants.cellCount).fill(0),
  // );
}

export const GameContext = createContext<GameContextProps>({
  localState: {
    gridPos: { x: 0, y: 0 },
  },
  remoteStates: new Map(),
  move: () => {},
});

export function GameContextProvider({ children }: { children: ReactNode }) {
  const { broadCast } = useContext(NetworkingContext);

  const [localState, setLocalState] = useState<PlayerState>({
    gridPos: util.getRandomVector2(GameConstants.cellCount),
  });

  const localStateRef = useRef<PlayerState>(localState);

  const [remoteStates, setRemoteStates] = useState<Map<number, PlayerState>>(
    new Map(),
  );

  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);

  useEffect(() => {
    startGame();
    return () => {
      exitGame();
    };
  }, []);

  function broadCastGameMessage(msg: GameMessage) {
    broadCast("reliable", { pType: "game", gameMessage: msg });
  }

  function startGame() {
    onMessage.addEventListener(handleMessage);
    broadCastGameMessage({
      type: "init",
      position: localState.gridPos,
    });
  }

  function handleMessage({
    peer,
    message,
  }: {
    peer: RemoteRTCPeer;
    message: ListenerMessage;
  }) {
    if (message.type === "disconnected") {
      removePlayer(peer.remotePeerId);
    } else if (message.type === "message") {
      const rtcMessage = message.message;
      if (rtcMessage.pType !== "game") return;
      handleGameMessage(peer, rtcMessage.gameMessage);
    }
  }

  function move(dir: Vector2) {
    setLocalState((prev) => {
      const prevPos = prev.gridPos;
      const newPos: Vector2 = {
        x: util.clamp(prevPos.x + dir.x, 0, GameConstants.cellCount - 1),
        y: util.clamp(prevPos.y + dir.y, 0, GameConstants.cellCount - 1),
      };
      if (Vectors.equals(prevPos, newPos)) {
        return prev;
      } else {
        broadCastGameMessage({
          type: "move",
          direction: dir,
        });
        return {
          ...prev,
          gridPos: newPos,
        };
      }
    });
  }

  function handleGameMessage(peer: RemoteRTCPeer, message: GameMessage) {
    if (message.type === "dc") {
      removePlayer(peer.remotePeerId);
    } else if (message.type === "init") {
      updateRemoteStates((prev) =>
        prev.set(peer.remotePeerId, { gridPos: message.position }),
      );
      const current = localStateRef.current;
      peer.sendMessage("reliable", {
        pType: "game",
        gameMessage: {
          type: "init",
          position: current.gridPos,
        },
      });
    } else if (message.type === "move") {
      updateRemoteState(peer.remotePeerId, (prev) => {
        const dir = message.direction;
        const prevPos = prev.gridPos;
        const newPos: Vector2 = {
          x: util.clamp(prevPos.x + dir.x, 0, GameConstants.cellCount - 1),
          y: util.clamp(prevPos.y + dir.y, 0, GameConstants.cellCount - 1),
        };
        return {
          ...prev,
          gridPos: newPos,
        };
      });
    }
  }

  function exitGame() {
    onMessage.removeEventListener(handleMessage);
    broadCastGameMessage({ type: "dc" });
  }

  function updateRemoteState(
    id: number,
    updateFunc: (state: PlayerState) => PlayerState,
  ) {
    updateRemoteStates((prev) => {
      const prevState = prev.get(id);
      if (prevState === undefined) return prev;
      return prev.set(id, updateFunc(prevState));
    });
  }

  function updateRemoteStates(
    updateFunc: (oldMap: Map<number, PlayerState>) => Map<number, PlayerState>,
  ) {
    setRemoteStates((prev) => {
      const newMap = new Map(prev);
      return updateFunc(newMap);
    });
  }

  function removePlayer(id: number) {
    updateRemoteStates((prev) => {
      prev.delete(id);
      return prev;
    });
  }

  return (
    <GameContext.Provider value={{ remoteStates, localState, move }}>
      {children}
    </GameContext.Provider>
  );
}

export type GameMessage =
  | {
      type: "init";
      position: Vector2;
    }
  | {
      type: "dc";
    }
  | {
      type: "move";
      direction: Vector2;
    };
