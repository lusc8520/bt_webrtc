import { useContext, useEffect, useState } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";
import { DrawingContext } from "../context/DrawingContext.tsx";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";

type Line = {
  points: { x: number; y: number }[];
};

export function DrawingBoard() {
  const [lines, setLines] = useState<Line[]>([]);

  const { broadCast } = useContext(NetworkingContext);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);

  function startDraw() {
    setCurrentLine({ points: [] });
  }

  const { getPeerInfo } = useContext(PeerInfoContext);
  const { drawInfos } = useContext(DrawingContext);

  useEffect(() => {}, [drawInfos]);

  function endDraw() {
    const line = currentLine;
    if (line === null) return;
    setLines((prev) => {
      return [...prev, line];
    });
    setCurrentLine(null);
  }

  function isDrawing() {
    return currentLine !== null;
  }

  return (
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
        viewBox="0 0 100 100"
        style={{
          display: "block",
          aspectRatio: 1,
          maxHeight: "100%",
          backgroundColor: "white",
          cursor: "crosshair",
        }}
        onMouseDown={startDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onMouseMove={(event) => {
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          // get percentual positions and multiply by 100 because viewbox is 100x100
          const percentX = (x / rect.width) * 100;
          const percentY = (y / rect.height) * 100;
          setCurrentLine((prev) => {
            broadCast("unreliable", {
              pType: "draw",
              isDrawing: isDrawing(),
              position: { x: percentX, y: percentY },
            });
            if (prev === null) return prev;
            return {
              points: [...prev.points, { x: percentX, y: percentY }],
            };
          });
        }}
      >
        {currentLine && <Line line={currentLine} />}
        {[...drawInfos].map(([id, info]) => {
          const peerInfo = getPeerInfo(id);
          return (
            <g
              pointerEvents="none"
              key={id}
              transform={`translate(${info.position.x}, ${info.position.y})`}
              x={info.position.x}
              y={info.position.y}
            >
              <text
                focusable="false"
                fontSize="3"
                fill={peerInfo.color}
                textAnchor="middle"
                y="-1.5"
              >
                {peerInfo.name}
              </text>
              <circle
                fill={peerInfo.color}
                r="1"
                // cx={info.position.x}
                // cy={info.position.y}
              />
            </g>
          );
        })}
        {lines.map((line, index) => (
          <Line key={index} line={line} />
        ))}
      </svg>
    </div>
  );
}

function Line({ line }: { line: Line }) {
  return (
    <polyline
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeWidth={1}
      stroke="black"
      points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
    />
  );
}
