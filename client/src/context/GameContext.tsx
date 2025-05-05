import { createContext, ReactNode, useContext, useEffect } from "react";
import { NetworkingContext } from "./NetworkingContext.tsx";

type GameContextProps = {};

export const GameContext = createContext<GameContextProps>({});

export function GameContextProvider({ children }: { children: ReactNode }) {
  const { broadCast } = useContext(NetworkingContext);

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
