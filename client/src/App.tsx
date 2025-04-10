import { Chat } from "./chat/Chat.tsx";
import { NetworkingContextProvider } from "./context/NetworkingContext.tsx";
import { PeerInfoContextProvider } from "./context/PeerInfoContext.tsx";

export function App() {
  return (
    <NetworkingContextProvider>
      <PeerInfoContextProvider>
        <Chat />
      </PeerInfoContextProvider>
    </NetworkingContextProvider>
  );
}
