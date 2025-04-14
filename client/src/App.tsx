import { Chat } from "./chat/Chat.tsx";
import { NetworkingContextProvider } from "./context/NetworkingContext.tsx";
import { PeerInfoContextProvider } from "./context/PeerInfoContext.tsx";
import { DrawingContextProvider } from "./context/DrawingContext.tsx";

export function App() {
  return (
    <NetworkingContextProvider>
      <PeerInfoContextProvider>
        <DrawingContextProvider>
          <Chat />
        </DrawingContextProvider>
      </PeerInfoContextProvider>
    </NetworkingContextProvider>
  );
}
