import { useState } from "react";

type Line = {
  points: { x: number; y: number }[];
};

export function DrawingBoard() {
  const [lines, setLines] = useState<Line[]>([]);

  const [currentLine, setCurrentLine] = useState<Line | null>(null);

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
        viewBox="0 0 100 100"
        style={{
          display: "block",
          aspectRatio: 1,
          maxHeight: "100%",
          backgroundColor: "white",
        }}
        onMouseEnter={() => {
          setCurrentLine({ points: [] });
        }}
        onMouseLeave={() => {
          const line = currentLine;
          if (line === null) return;
          setLines((prev) => [...prev, line]);
          setCurrentLine(null);
        }}
        onMouseMove={(event) => {
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          // get percentual positions and multiply by 100 because viewbox is 100x100
          const percentX = (x / rect.width) * 100;
          const percentY = (y / rect.height) * 100;
          setCurrentLine((prev) => {
            if (prev === null) return prev;
            return {
              points: [...prev.points, { x: percentX, y: percentY }],
            };
          });
        }}
      >
        {currentLine && <Line line={currentLine}></Line>}
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
      strokeWidth={5}
      stroke="black"
      points={line.points.map((p) => `${p.x},${p.y}`).join(" ")}
    />
  );
}
