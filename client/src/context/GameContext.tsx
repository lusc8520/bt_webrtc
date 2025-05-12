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
import { VoidEvent } from "../util/event.ts";

type GameContextProps = {
  localState: LocalPlayerState;
  remoteStates: Map<number, PlayerState>;
  move: (dir: Vector2) => void;
  shoot: (direction: Vector2) => void;
  localProjectiles: Set<Projectile>;
  remoteProjectiles: Set<Projectile>;
};

export type PlayerState = {
  gridPos: Vector2;
};

export type LocalPlayerState = {
  isMoving: boolean;
  canDie: boolean;
  canShoot: boolean;
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
  static shootCooldown = 1000;

  static onDie = new VoidEvent();
}

export const GameContext = createContext<GameContextProps>({
  localState: {
    gridPos: { x: 0, y: 0 },
    isMoving: false,
    canDie: false,
    canShoot: true,
  },
  remoteStates: new Map(),
  move: () => {},
  shoot: () => {},
  localProjectiles: new Set(),
  remoteProjectiles: new Set(),
});

export function GameContextProvider({ children }: { children: ReactNode }) {
  const { broadCast } = useContext(NetworkingContext);

  const [localState, setLocalState] = useState<LocalPlayerState>({
    gridPos: util.getRandomVector2(GameConstants.cellCount),
    isMoving: false,
    canDie: false,
    canShoot: true,
  });

  const [localProjectiles, setLocalProjectiles] = useState<Set<Projectile>>(
    new Set(),
  );

  const localStateRef = useRef<LocalPlayerState>(localState);

  const [remoteStates, setRemoteStates] = useState<Map<number, PlayerState>>(
    new Map(),
  );
  const [remoteProjectiles, setRemoteProjectiles] = useState<Set<Projectile>>(
    new Set(),
  );

  const [died, setDied] = useState(false);

  useEffect(() => {
    if (died) {
      console.error("DIE");
      GameConstants.onDie.invoke();
    }
  }, [died]);

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

  function shoot(direction: Vector2) {
    if (localState.isMoving) return;
    if (!localState.canShoot) return;
    setLocalState((prev) => {
      return { ...prev, canShoot: false };
    });
    setTimeout(() => {
      setLocalState((prev) => {
        return { ...prev, canShoot: true };
      });
    }, GameConstants.shootCooldown);
    const dir = direction;
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
    setLocalProjectiles((prev) => new Set(prev).add(proj));
    const interval = setInterval(() => {
      setLocalProjectiles((prev) => {
        proj.gridPos = Vectors.add(proj.gridPos, proj.dir);
        if (isOutOfBounds(proj.gridPos)) {
          prev.delete(proj);
          clearInterval(interval);
        }
        return new Set(prev);
      });
    }, GameConstants.projectileMoveDuration);
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
          projectile.gridPos = Vectors.add(projectile.gridPos, projectile.dir);
          const currentPlayerState = localStateRef.current;
          if (
            currentPlayerState.canDie &&
            Vectors.equals(currentPlayerState.gridPos, projectile.gridPos)
          ) {
            setDied(true);
            clearInterval(interval);
          }
          if (isOutOfBounds(projectile.gridPos)) {
            prev.delete(projectile);
            clearInterval(interval);
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
