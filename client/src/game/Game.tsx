import { memo, useContext, useEffect, useRef, useState } from "react";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";
import { Vectors } from "../types.ts";
import {
  GameConstants,
  GameContext,
  GameContextProvider,
  PlayerState,
} from "../context/GameContext.tsx";
import { onEditChanged } from "../chat/RemotePeerList.tsx";
import { util } from "../util/util.ts";

const gameFieldSize = GameConstants.gameFieldSize;
const cellCount = GameConstants.cellCount;
const cellSize = gameFieldSize / cellCount;

const gameGrid: number[][] = Array.from({ length: cellCount }, () =>
  Array(cellCount).fill(0),
);

export function Game() {
  const {
    move,
    remoteStates,
    shoot,
    localProjectiles,
    remoteProjectiles,
    localState,
  } = useContext(GameContext);

  const { localPeerInfo } = useContext(PeerInfoContext);
  const isEdit = useRef<boolean>(false);

  document.onkeydown = (e) => {
    if (e.repeat || isEdit.current) return;
    const key = e.key.toLowerCase();
    if (key === "a") {
      move(Vectors.left);
    } else if (key === "d") {
      move(Vectors.right);
    } else if (key === "w") {
      move(Vectors.up);
    } else if (key === "s") {
      move(Vectors.down);
    } else if (key === "arrowleft") {
      shoot(Vectors.left);
    } else if (key === "arrowright") {
      shoot(Vectors.right);
    } else if (key === "arrowup") {
      shoot(Vectors.up);
    } else if (key === "arrowdown") {
      shoot(Vectors.down);
    }
  };

  const [isCooldown, setIsCoolDown] = useState(localState.canShoot);
  const [cooldownColor, setCooldownColor] = useState<"green" | "red">(
    localState.canShoot ? "green" : "red",
  );

  useEffect(() => {
    if (!localState.canShoot) {
      setIsCoolDown(true);
      setCooldownColor("red");
    } else {
      setIsCoolDown(false);
      setCooldownColor("green");
    }
  }, [localState]);

  useEffect(() => {
    onEditChanged.addEventListener(onEditChange);
    return () => {
      onEditChanged.removeEventListener(onEditChange);
    };
  }, []);

  function onEditChange(edit: boolean) {
    isEdit.current = edit;
  }

  function getCoolDownWidth() {
    if (isCooldown) {
      return "100%";
    } else {
      if (localState.canShoot) return "100%";
      return "0%";
    }
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
          display: "flex",
          flexDirection: "column",
          padding: "0.25rem",
          gap: "0.25rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          use WASD to move and use arrow keys to shoot (you can shoot once a
          second)
        </div>
        <div
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}
        >
          <div>shoot cooldown:</div>
          <div
            style={{
              borderStyle: "solid",
              borderWidth: "0.1px",
              width: "3rem",
              borderRadius: `${util.borderColor}`,
              display: "flex",
            }}
          >
            <div
              style={{
                backgroundColor: cooldownColor,
                width: getCoolDownWidth(),
                transition: `${isCooldown ? `width ${GameConstants.shootCooldown}ms` : ""}`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div
        style={{
          flexGrow: "1",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
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
            {[...localProjectiles].map((proj, index) => {
              return (
                <g
                  key={index}
                  transform={`translate(${proj.gridPos.x * cellSize}, ${proj.gridPos.y * cellSize})`}
                >
                  <rect
                    width={cellSize}
                    height={cellSize}
                    fill={localPeerInfo.color}
                  />
                </g>
              );
            })}
            {[...remoteProjectiles].map((proj, index) => {
              return (
                <g
                  key={index}
                  transform={`translate(${proj.gridPos.x * cellSize}, ${proj.gridPos.y * cellSize})`}
                >
                  <rect width={cellSize} height={cellSize} fill="white" />
                </g>
              );
            })}
          </svg>
        </div>
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
        transition: `transform ${GameConstants.moveDuration}ms`,
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
  const peerInfo = getPeerInfo(peerId);
  return (
    <g
      style={{
        transition: `transform ${GameConstants.moveDuration}ms`,
      }}
      transform={`translate(${pos.x * cellSize + cellSize / 2}, ${pos.y * cellSize + cellSize / 2})`}
    >
      <circle r={cellSize / 4} fill={peerInfo.color} />
      <text
        focusable="false"
        fontSize="2"
        fill="grey"
        y="-2"
        textAnchor="middle"
      >
        {peerInfo.name}
      </text>
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
