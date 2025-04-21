import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
import { NetworkingContext } from "./NetworkingContext.tsx";

type Data = {
  messages: ChatMessage[];
  broadCastMessage: (text: string) => void;
  broadCastDelete: (id: number) => void;
};

export const ChatMessagesContext = createContext<Data>({
  messages: [],
  broadCastMessage: () => {},
  broadCastDelete: () => {},
});

export type ChatMessage = LocalChatMessage | RemoteChatMessage;

export type LocalChatMessage = {
  type: "local";
  text: string;
  id: number;
  edited: boolean;
};
export type RemoteChatMessage = {
  type: "remote";
  text: string;
  peer: RemoteRTCPeer;
  id: number;
  edited: boolean;
};

export function ChatMessagesProvider({ children }: { children: ReactNode }) {
  const { subscribeMessage, broadCast } = useContext(NetworkingContext);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageId, setMessageId] = useState(0);

  useEffect(() => {
    console.warn(messageId);
  }, [messageId]);

  useEffect(() => {
    subscribeMessage((peer, message) => {
      if (message.type === "message") {
        if (message.message.pType === "chatMessage") {
          const text = message.message.text;
          addMessage({
            type: "remote",
            peer: peer,
            text: text,
            id: message.message.id,
            edited: false,
          });
        } else if (message.message.pType === "deleteMessage") {
          const id = message.message.id;
          setMessages((prev) =>
            prev.filter((message) => {
              if (message.type === "local") return true;
              if (message.peer.remotePeerId !== peer.remotePeerId) return true;
              return message.id !== id;
            }),
          );
        }
      }
    });
  }, [subscribeMessage]);

  function broadCastMessage(text: string) {
    setMessageId((prevState) => {
      addMessage({ type: "local", text, id: prevState, edited: false });
      broadCast("reliable", { pType: "chatMessage", text, id: prevState });
      return prevState + 1;
    });
  }

  function broadCastDelete(id: number) {
    broadCast("reliable", { pType: "deleteMessage", id });
    setMessages((prev) => {
      return prev.filter((message) => {
        if (message.type === "remote") return true;
        return message.id !== id;
      });
    });
  }

  function addMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  return (
    <ChatMessagesContext.Provider
      value={{ messages, broadCastMessage, broadCastDelete }}
    >
      {children}
    </ChatMessagesContext.Provider>
  );
}
