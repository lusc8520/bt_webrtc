import { createContext, ReactNode, useContext, useEffect } from "react";
import { Vector2 } from "../types.ts";
import { NetworkingContext } from "./NetworkingContext.tsx";

type GameContextProps = {};

export const GameContext = createContext<GameContextProps>({});

export function GameContextProvider({ children }: { children: ReactNode }) {
  const { broadCast, subscribeMessage } = useContext(NetworkingContext);

  useEffect(() => {
    startGame();
    return () => {
      exitGame();
    };
  }, []);

  function startGame() {
    console.log("start game");
  }

  function exitGame() {
    console.log("exit game");
  }

  return <GameContext.Provider value={{}}>{children}</GameContext.Provider>;
}

export type GameMessage =
  | {
      type: "init";
      position: Vector2;
    }
  | {
      type: "dc";
    };
