import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { RemoteRTCPeer } from "../remote_peer/RemoteRTCPeer.ts";
import { NetworkingContext } from "./NetworkingContext.tsx";
import { VoidEvent } from "../util/event.ts";
import { RateMessage } from "../types.ts";

type Data = {
  messages: ChatMessage[];
  broadCastMessage: (text: string) => void;
  broadCastDelete: (id: number) => void;
  broadCastEdit: (id: number, text: string) => void;
  broadCastLocalRating: (id: number, rating: Rating) => void;
  broadCastRemoteRating: (
    peerId: number,
    messageId: number,
    rating: Rating,
  ) => void;
};

export const ChatMessagesContext = createContext<Data>({
  messages: [],
  broadCastMessage: () => {},
  broadCastDelete: () => {},
  broadCastEdit: () => {},
  broadCastLocalRating: () => {},
  broadCastRemoteRating: () => {},
});

export type ChatMessage = LocalChatMessage | RemoteChatMessage;

export const maxMessageLength = 100;

type BaseChatMessage = {
  text: string;
  id: number;
  edited: boolean;
  localRating: Rating;
  remoteRatings: Map<number, Rating>;
};

export type Rating = boolean | null;

export type LocalChatMessage = {
  type: "local";
} & BaseChatMessage;

export type RemoteChatMessage = {
  type: "remote";
  peer: RemoteRTCPeer;
} & BaseChatMessage;

export const scrollDownEvent = new VoidEvent();

export function ChatMessagesProvider({ children }: { children: ReactNode }) {
  const { subscribeMessage, broadCast, sendToPeer } =
    useContext(NetworkingContext);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setMessageId] = useState(0);

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
            localRating: null,
            remoteRatings: new Map(),
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
        } else if (message.message.pType === "editMessage") {
          const editData = message.message;
          editRemoteMessage(peer.remotePeerId, editData.id, editData.text);
        } else if (message.message.pType === "rateMessage") {
          receiveRating(message.message.rateMessage, peer.remotePeerId);
        }
      } else if (message.type === "disconnected") {
        // delete ratings...
        setMessages((prev) => {
          return prev.map((message) => {
            message.remoteRatings.delete(peer.remotePeerId);
            return message;
          });
        });
      }
    });
  }, [subscribeMessage]);

  function invokeScrollDown() {
    scrollDownEvent.invoke();
  }

  function editLocalMessage(id: number, text: string) {
    setMessages((prev) => {
      return prev.map((message) => {
        if (message.type !== "local") return message;
        if (message.id !== id) return message;
        return {
          ...message,
          edited: true,
          text: text,
        };
      });
    });
  }

  function receiveRating(rateMessage: RateMessage, fromPeerId: number) {
    console.warn(rateMessage);
    if (rateMessage.type === "yours") {
      setMessages((prev) => {
        return prev.map((message) => {
          if (message.type !== "local") return message;
          if (message.id !== rateMessage.messageId) return message;
          return {
            ...message,
            remoteRatings: message.remoteRatings.set(
              fromPeerId,
              rateMessage.rating,
            ),
          };
        });
      });
    } else if (rateMessage.type === "mine") {
      setMessages((prev) => {
        return prev.map((message) => {
          if (message.type !== "remote") return message;
          if (message.peer.remotePeerId !== fromPeerId) return message;
          if (message.id !== rateMessage.messageId) return message;
          return {
            ...message,
            remoteRatings: message.remoteRatings.set(
              fromPeerId,
              rateMessage.rating,
            ),
          };
        });
      });
    } else {
      setMessages((prev) => {
        return prev.map((message) => {
          if (message.type !== "remote") return message;
          if (message.peer.remotePeerId !== rateMessage.peerId) return message;
          if (message.id !== rateMessage.messageId) return message;
          return {
            ...message,
            remoteRatings: message.remoteRatings.set(
              fromPeerId,
              rateMessage.rating,
            ),
          };
        });
      });
    }
  }

  function editRemoteMessage(peerId: number, messageId: number, text: string) {
    setMessages((prev) => {
      return prev.map((message) => {
        if (message.type !== "remote") return message;
        if (message.peer.remotePeerId !== peerId) return message;
        if (message.id !== messageId) return message;
        return {
          ...message,
          edited: true,
          text: text,
        };
      });
    });
  }

  function setLocalRating(id: number, rating: Rating) {
    setMessages((prev) => {
      return prev.map((m) => {
        if (m.type !== "local") return m;
        if (m.id !== id) return m;
        return {
          ...m,
          localRating: rating,
        };
      });
    });
  }

  function setRemoteRating(peerId: number, messageId: number, rating: Rating) {
    setMessages((prev) => {
      return prev.map((m) => {
        if (m.type !== "remote") return m;
        if (m.peer.remotePeerId !== peerId) return m;
        if (m.id !== messageId) return m;
        return {
          ...m,
          localRating: rating,
        };
      });
    });
  }

  function broadCastLocalRating(id: number, rating: Rating) {
    setLocalRating(id, rating);
    broadCast("reliable", {
      pType: "rateMessage",
      rateMessage: { type: "mine", messageId: id, rating: rating },
    });
  }

  function broadCastRemoteRating(
    peerId: number,
    messageId: number,
    rating: Rating,
  ) {
    setRemoteRating(peerId, messageId, rating);
    sendToPeer(peerId, "reliable", {
      pType: "rateMessage",
      rateMessage: {
        type: "yours",
        messageId: messageId,
        rating: rating,
      },
    });
    broadCast("reliable", {
      pType: "rateMessage",
      rateMessage: {
        type: "other",
        peerId: peerId,
        messageId: messageId,
        rating: rating,
      },
    });
  }

  function broadCastEdit(id: number, text: string) {
    broadCast("reliable", { pType: "editMessage", id, text });
    editLocalMessage(id, text);
  }

  function broadCastMessage(text: string) {
    setTimeout(() => {
      invokeScrollDown();
    }, 50);
    setMessageId((prevState) => {
      addMessage({
        type: "local",
        text,
        id: prevState,
        edited: false,
        localRating: null,
        remoteRatings: new Map(),
      });
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
      value={{
        messages,
        broadCastMessage,
        broadCastDelete,
        broadCastEdit,
        broadCastRemoteRating,
        broadCastLocalRating,
      }}
    >
      {children}
    </ChatMessagesContext.Provider>
  );
}
