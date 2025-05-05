import { NetworkingContextProvider } from "./context/NetworkingContext.tsx";
import { PeerInfoContextProvider } from "./context/PeerInfoContext.tsx";
import { DrawingContextProvider } from "./context/DrawingContext.tsx";
import { ChatMessagesProvider } from "./context/ChatMessagesContext.tsx";
import { TurnContextProvider } from "./context/TurnContext.tsx";
import { AppLayout } from "./AppLayout.tsx";

export function App() {
  return (
    <TurnContextProvider>
      <NetworkingContextProvider>
        <PeerInfoContextProvider>
          <ChatMessagesProvider>
            <DrawingContextProvider>
              <AppLayout />
            </DrawingContextProvider>
          </ChatMessagesProvider>
        </PeerInfoContextProvider>
      </NetworkingContextProvider>
    </TurnContextProvider>
  );
}
