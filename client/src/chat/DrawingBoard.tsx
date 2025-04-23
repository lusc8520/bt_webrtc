import { useContext, useState } from "react";
import { NetworkingContext } from "../context/NetworkingContext.tsx";
import { DrawingContext } from "../context/DrawingContext.tsx";
import { PeerInfoContext } from "../context/PeerInfoContext.tsx";

type Line = {
  points: { x: number; y: number }[];
  fade: boolean;
};

export const lineDisplayDuration = 2000;
export const lineFadeDuration = 1000;

export function DrawingBoard() {
  const { broadCast } = useContext(NetworkingContext);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);

  const [, setLineCount] = useState(0);
  const [lineMap, setLineMap] = useState<Map<number, Line>>(new Map());

  function startDraw() {
    setCurrentLine({ points: [], fade: false });
  }

  const { getPeerInfo, localPeerInfo } = useContext(PeerInfoContext);
  const { drawInfos } = useContext(DrawingContext);

  function endDraw() {
    const line = currentLine;
    if (line === null) return;

    setLineCount((prev) => {
      const id = prev;
      setLineMap((prev) => new Map(prev).set(id, line));
      setTimeout(() => {
        setLineMap((prev) => new Map(prev).set(id, { ...line, fade: true }));
        setTimeout(() => {
          setLineMap((prev) => {
            const map = new Map(prev);
            map.delete(id);
            return map;
          });
        }, lineFadeDuration);
      }, lineDisplayDuration);
      return prev + 1;
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
              fade: false,
            };
          });
        }}
      >
        {[...lineMap].map(([id, line]) => (
          <Line key={id} line={line} color={localPeerInfo.color} />
        ))}
        {currentLine && <Line line={currentLine} color={localPeerInfo.color} />}
        {[...drawInfos].map(([id, info], index) => {
          const peerInfo = getPeerInfo(id);
          return (
            <g key={index}>
              {[...info.lines].map(([id, line]) => (
                <Line key={id} line={line} color={peerInfo.color} />
              ))}
              {info.currentLine && (
                <Line line={info.currentLine} color={peerInfo.color} />
              )}
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
                  y="-1"
                >
                  {peerInfo.name}
                </text>
                <circle fill={peerInfo.color} r="1" />
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Line({ line, color }: { line: Line; color: string }) {
  return (
    <polyline
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeWidth={1}
      stroke={color}
      points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
      style={{
        opacity: line.fade ? 0 : 1,
        transition: `opacity ${lineFadeDuration}ms ease-in-out`,
      }}
    />
  );
}
