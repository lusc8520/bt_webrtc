export type SendType = "reliable" | "unreliable";

export type RTCMessage =
  | {
      pType: "ping";
    }
  | {
      pType: "something";
      data: string;
    };
