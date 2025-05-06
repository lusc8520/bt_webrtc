import { useContext, useEffect, useState } from "react";
import { GameContext } from "../context/GameContext.tsx";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";
import { Vector2, Vectors } from "../types.ts";
import { util } from "../util/util.ts";

const gameFieldSize = 100;
const cellCount = 20;
const cellSize = gameFieldSize / cellCount;

const gameGrid: number[][] = Array.from({ length: cellCount }, () =>
  Array(cellCount).fill(0),
);

export function Game() {
  const [pos, setPos] = useState<Vector2>({ x: 0, y: 0 });
  const { localPeerInfo } = useContext(PeerInfoContext);

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

  function move(dir: Vector2) {
    setPos((prevPos) => {
      return {
        x: util.clamp(prevPos.x + dir.x, 0, cellCount),
        y: util.clamp(prevPos.y + dir.y, 0, cellCount),
      };
    });
  }

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
          shapeRendering="crispEdges"
          className="noselect"
          viewBox={`0 0 ${gameFieldSize} ${gameFieldSize}`}
          style={{
            display: "block",
            maxHeight: "100%",
          }}
        >
          {gameGrid.map((row, x) => {
            return row.map((cell, y) => {
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
          })}
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
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

const strokeW = 0.3;
