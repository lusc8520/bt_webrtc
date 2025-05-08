import { memo, useContext, useEffect } from "react";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";
import { Vectors } from "../types.ts";
import {
  GameConstants,
  GameContext,
  PlayerState,
} from "../context/GameContext.tsx";

const gameFieldSize = GameConstants.gameFieldSize;
const cellCount = GameConstants.cellCount;
const cellSize = gameFieldSize / cellCount;

const gameGrid: number[][] = Array.from({ length: cellCount }, () =>
  Array(cellCount).fill(0),
);

export function Game() {
  const { move, remoteStates } = useContext(GameContext);

  useEffect(() => {
    document.onkeydown = (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        move(Vectors.left);
      } else if (key === "arrowright" || key === "d") {
        move(Vectors.right);
      } else if (key === "arrowup" || key === "w") {
        move(Vectors.up);
      } else if (key === "arrowdown" || key === "s") {
        move(Vectors.down);
      }
    };
  }, []);

  return (
    <div
      id="game-window"
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: "1",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg
          className="noselect"
          viewBox={`0 0 ${gameFieldSize} ${gameFieldSize}`}
          style={{
            display: "block",
            maxHeight: "100%",
          }}
        >
          <GameGrid />
          {[...remoteStates].map(([id, state]) => {
            return <RemotePlayer key={id} peerId={id} state={state} />;
          })}
          <LocalPlayer />
        </svg>
      </div>
    </div>
  );
}

function LocalPlayer() {
  const { localState } = useContext(GameContext);
  const { localPeerInfo } = useContext(PeerInfoContext);
  const pos = localState.gridPos;
  return (
    <g
      style={{
        transition: "transform 0.1s",
      }}
      transform={`translate(${pos.x * cellSize + cellSize / 2}, ${pos.y * cellSize + cellSize / 2})`}
    >
      <rect
        x={-cellSize / 4}
        y={-cellSize / 4}
        width={cellSize / 2}
        height={cellSize / 2}
        fill={localPeerInfo.color}
        stroke="white"
        strokeWidth="0.2"
      />
    </g>
  );
}

function RemotePlayer({
  peerId,
  state,
}: {
  peerId: number;
  state: PlayerState;
}) {
  const pos = state.gridPos;
  const { getPeerInfo } = useContext(PeerInfoContext);
  return (
    <g
      style={{
        transition: "transform 0.1s",
      }}
      transform={`translate(${pos.x * cellSize + cellSize / 2}, ${pos.y * cellSize + cellSize / 2})`}
    >
      <circle r={cellSize / 4} fill={getPeerInfo(peerId).color} />
    </g>
  );
}

const GameGrid = memo(() => {
  return gameGrid.map((row, x) => {
    return row.map((_cell, y) => {
      return (
        <g
          key={`${x}${y}`}
          transform={`translate(${x * cellSize}, ${y * cellSize})`}
        >
          <rect fill="none" width={cellSize} height={cellSize} />
          {/*outline*/}
          <line
            x2={cellSize}
            stroke="darkslategray"
            strokeWidth={y === 0 ? strokeW : strokeW / 2}
          />
          <line
            y1={cellSize}
            x2={cellSize}
            y2={cellSize}
            stroke="darkslategray"
            strokeWidth={y === cellCount - 1 ? strokeW : strokeW / 2}
          />
          <line
            y2={cellSize}
            stroke="darkslategray"
            strokeWidth={x === 0 ? strokeW : strokeW / 2}
          />
          <line
            x1={cellSize}
            x2={cellSize}
            y2={cellSize}
            stroke="darkslategray"
            strokeWidth={x === cellCount - 1 ? strokeW : strokeW / 2}
          />
        </g>
      );
    });
  });
});

const strokeW = 0.3;
