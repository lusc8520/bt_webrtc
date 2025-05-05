import { useContext, useEffect } from "react";
import { GameContext } from "../context/GameContext.tsx";

export function Game() {
  const a = useContext(GameContext);

  return <div>Game</div>;
}
