import { useEffect, useState } from "react";
import { scrollDownEvent } from "./context/ChatMessagesContext.tsx";
import { util } from "./util/util.ts";
import { RemotePeerList } from "./chat/RemotePeerList.tsx";
import { ChatTab } from "./chat/ChatMessages.tsx";
import { DrawingBoard } from "./chat/DrawingBoard.tsx";
import { Game } from "./game/Game.tsx";
import { GameContextProvider } from "./context/GameContext.tsx";

type TabState = "chat" | "draw" | "game";

const possibleTabs: TabState[] = ["chat", "draw", "game"];

export function AppLayout() {
  const [tabState, setTabState] = useState<TabState>("chat");

  useEffect(() => {
    if (tabState === "chat") {
      scrollDownEvent.invoke();
    }
  }, [tabState]);

  return (
    <div
      id="main-and-side"
      style={{
        flexGrow: 1,
        overflow: "hidden",
        display: "flex",
        height: "100svh",
        width: "100svw",
      }}
    >
      <div
        id="main-container"
        style={{
          display: "flex",
          flexGrow: 1,
          flexDirection: "column",
        }}
      >
        <div
          id="selection"
          style={{
            display: "flex",
            borderBottomStyle: "solid",
            borderBottomWidth: "1px",
            borderBottomColor: util.borderColor,
          }}
        >
          {possibleTabs.map((tab) => {
            return (
              <Tab
                key={tab}
                tabState={tab}
                currentTab={tabState}
                onSelect={() => {
                  setTabState(tab);
                }}
              />
            );
          })}
        </div>
        <SelectedTab tab={tabState} />
      </div>

      <div
        id="user-list-container"
        style={{
          flexShrink: 0,
          width: "250px",
          borderLeftWidth: "1px",
          borderLeftStyle: "solid",
          borderLeftColor: util.borderColor,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: util.scrollbarColor,
          padding: "0.5rem",
        }}
      >
        <RemotePeerList />
      </div>
    </div>
  );
}

function Tab({
  tabState,
  currentTab,
  onSelect,
}: {
  tabState: TabState;
  currentTab: TabState;
  onSelect: (tab: TabState) => void;
}) {
  return (
    <div
      style={{
        flexGrow: 1,
        display: "flex",
        borderRight: `1px solid ${util.borderColor}`,
        padding: "0.5rem 1rem",
      }}
    >
      <div
        className="btn"
        style={{
          flexGrow: 1,
          textAlign: "center",
          borderRadius: "0.25rem",
          backgroundColor:
            tabState === currentTab ? "lightgrey" : "transparent",
          color: tabState === currentTab ? "black" : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          onSelect(tabState);
        }}
      >
        {tabState.toUpperCase()}
      </div>
    </div>
  );
}

function SelectedTab({ tab }: { tab: TabState }) {
  if (tab === "chat") {
    return <ChatTab />;
  } else if (tab === "draw") {
    return (
      <div
        id="draw-window"
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: "1",
          overflow: "hidden",
        }}
      >
        <DrawingBoard />
      </div>
    );
  } else if (tab === "game") {
    return (
      <GameContextProvider>
        <Game />
      </GameContextProvider>
    );
  }
  return null;
}
