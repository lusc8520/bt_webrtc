import { Chat } from "./chat/Chat.tsx";
import { NetworkingContextProvider } from "./context/NetworkingContext.tsx";

export function App() {
  return (
    <NetworkingContextProvider>
      <Chat />
    </NetworkingContextProvider>
  );
}
