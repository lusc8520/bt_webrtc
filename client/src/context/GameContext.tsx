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
  localState: LocalPlayerState;
  remoteStates: Map<number, PlayerState>;
  move: (dir: Vector2) => void;
  shoot: () => void;
  localProjectiles: Projectile[];
  remoteProjectiles: Set<Projectile>;
};

export type PlayerState = {
  gridPos: Vector2;
};

export type LocalPlayerState = {
  isMoving: boolean;
  canDie: boolean;
} & PlayerState;

type Projectile = {
  dir: Vector2;
  gridPos: Vector2;
};

export abstract class GameConstants {
  static gameFieldSize = 100;
  static cellCount = 15;
  static moveDuration = 100;
  static projectileMoveDuration = 300;
}

export const GameContext = createContext<GameContextProps>({
  localState: {
    gridPos: { x: 0, y: 0 },
    isMoving: false,
    canDie: false,
  },
  remoteStates: new Map(),
  move: () => {},
  shoot: () => {},
  localProjectiles: [],
  remoteProjectiles: new Set(),
});

export function GameContextProvider({ children }: { children: ReactNode }) {
  const { broadCast } = useContext(NetworkingContext);

  const [localState, setLocalState] = useState<LocalPlayerState>({
    gridPos: util.getRandomVector2(GameConstants.cellCount),
    isMoving: false,
    canDie: false,
  });

  const [localProjectile, setLocalProjectile] = useState<
    Projectile | undefined
  >(undefined);
  const [localProjectiles, setLocalProjectiles] = useState<Projectile[]>([]);

  const localStateRef = useRef<LocalPlayerState>(localState);
  const localProjectileRef = useRef<Projectile | undefined>(localProjectile);

  const [remoteStates, setRemoteStates] = useState<Map<number, PlayerState>>(
    new Map(),
  );
  const [remoteProjectiles, setRemoteProjectiles] = useState<Set<Projectile>>(
    new Set(),
  );

  useEffect(() => {
    localStateRef.current = localState;
    localProjectileRef.current = localProjectile;
  }, [localState, localProjectile]);

  useEffect(() => {
    startGame();
    return () => {
      exitGame();
    };
  }, []);

  function broadCastGameMessage(msg: GameMessage) {
    broadCast("reliable", { pType: "game", gameMessage: msg });
  }

  function shoot() {
    const dir = Vectors.getRandomDir();
    const proj: Projectile = {
      dir: dir,
      gridPos: {
        x: util.clamp(
          localState.gridPos.x + dir.x,
          0,
          GameConstants.cellCount - 1,
        ),
        y: util.clamp(
          localState.gridPos.y + dir.y,
          0,
          GameConstants.cellCount - 1,
        ),
      },
    };
    broadCastGameMessage({ type: "proj", proj: proj });
    setLocalProjectile(proj);
    setLocalProjectiles([proj]);
    const t = setInterval(() => {
      const projChanged = localProjectileRef.current !== proj;
      if (projChanged) {
        clearInterval(t);
      } else {
        const newPos = Vectors.add(proj.gridPos, proj.dir);
        if (
          newPos.x < 0 ||
          newPos.y < 0 ||
          newPos.x >= GameConstants.cellCount ||
          newPos.y >= GameConstants.cellCount
        ) {
          // proj is out of bounds
          clearInterval(t);
          setLocalProjectile(undefined);
          setLocalProjectiles([]);
        } else {
          proj.gridPos = newPos;
          setLocalProjectiles([proj]);
        }
      }
      console.error("hi");
    }, GameConstants.projectileMoveDuration);
    console.error("shoot");
  }

  function startGame() {
    onMessage.addEventListener(handleMessage);
    broadCastGameMessage({
      type: "init",
      position: localState.gridPos,
    });
    setTimeout(() => {
      setLocalState((prev) => {
        return { ...prev, canDie: true };
      });
    }, 3000);
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
      if (prev.isMoving) return prev;
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
        setTimeout(() => {
          setLocalState((prev) => {
            return { ...prev, isMoving: false };
          });
        }, GameConstants.moveDuration);
        return {
          ...prev,
          gridPos: newPos,
          isMoving: true,
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
    } else if (message.type === "proj") {
      const projectile = message.proj;
      setRemoteProjectiles((prev) => {
        return new Set(prev).add(projectile);
      });
      const interval = setInterval(() => {
        setRemoteProjectiles((prev) => {
          if (!prev.has(projectile)) {
            clearInterval(interval);
            return prev;
          }
          projectile.gridPos = Vectors.add(projectile.gridPos, projectile.dir);
          if (isOutOfBounds(projectile.gridPos)) {
            prev.delete(projectile);
          }
          return new Set(prev);
        });
      }, GameConstants.projectileMoveDuration);
    }
  }

  function isOutOfBounds(pos: Vector2): boolean {
    return (
      pos.x < 0 ||
      pos.y < 0 ||
      pos.x >= GameConstants.cellCount ||
      pos.y >= GameConstants.cellCount
    );
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
    <GameContext.Provider
      value={{
        remoteStates,
        localState,
        move,
        shoot,
        localProjectiles,
        remoteProjectiles,
      }}
    >
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
    }
  | {
      type: "proj";
      proj: Projectile;
    };
