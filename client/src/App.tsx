import { AppContextProvider } from "./context/AppContext.tsx";
import { Chat } from "./chat/Chat.tsx";

export function App() {
  return (
    <AppContextProvider>
      <Chat />
    </AppContextProvider>
  );
}
