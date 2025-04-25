import { Chat } from "./chat/Chat.tsx";
import { NetworkingContextProvider } from "./context/NetworkingContext.tsx";
import { PeerInfoContextProvider } from "./context/PeerInfoContext.tsx";
import { DrawingContextProvider } from "./context/DrawingContext.tsx";
import { ChatMessagesProvider } from "./context/ChatMessagesContext.tsx";
import { TurnContextProvider } from "./context/TurnContext.tsx";

export function App() {
  return (
    <TurnContextProvider>
      <NetworkingContextProvider>
        <PeerInfoContextProvider>
          <ChatMessagesProvider>
            <DrawingContextProvider>
              <Chat />
            </DrawingContextProvider>
          </ChatMessagesProvider>
        </PeerInfoContextProvider>
      </NetworkingContextProvider>
    </TurnContextProvider>
  );
}
