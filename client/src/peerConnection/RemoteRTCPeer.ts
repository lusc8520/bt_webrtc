import { RTCMessage, SendType } from "../types.ts";

const reliableConfig: RTCDataChannelInit = {
  ordered: true,
  negotiated: true,
  id: 0,
};
const unreliableConfig: RTCDataChannelInit = {
  ordered: true,
  maxRetransmits: 0,
  negotiated: true,
  id: 1,
};

type ConstructorData = {
  peerId: number;
  config?: RTCConfiguration;
  onnegotiationneeded: () => void;
  onicecandidate: (event: RTCPeerConnectionIceEvent) => void;
  onopen: () => void;
  onclose: () => void;
  onmessage: (message: RTCMessage) => void;
};

export class RemoteRTCPeer extends RTCPeerConnection {
  private readonly unreliableDataChannel: RTCDataChannel;
  private readonly reliableDataChannel: RTCDataChannel;
  private readonly remotePeerId: number;

  private readonly onopen: () => void;
  private readonly onmessage: (message: RTCMessage) => void;
  private onclose?: () => void;

  constructor({
    peerId,
    config,
    onnegotiationneeded,
    onicecandidate,
    onopen,
    onclose,
    onmessage,
  }: ConstructorData) {
    super(config);
    this.onnegotiationneeded = onnegotiationneeded;
    this.onicecandidate = onicecandidate;
    this.remotePeerId = peerId;
    this.onopen = onopen;
    this.onclose = onclose;
    this.onmessage = onmessage;
    this.onconnectionstatechange = () => {
      switch (this.connectionState) {
        case "failed":
          this.shutDown();
          break;
        case "closed":
          this.shutDown();
          break;
        case "disconnected":
          this.shutDown();
      }
    };
    this.reliableDataChannel = this.createDataChannel(
      "reliable",
      reliableConfig,
    );
    this.unreliableDataChannel = this.createDataChannel(
      "reliable",
      unreliableConfig,
    );
    this.initChannel(this.reliableDataChannel);
    this.initChannel(this.unreliableDataChannel);
  }

  private initChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.log(`channel opened! channel name: ${channel.label}`);
      if (
        this.reliableDataChannel.readyState === "open" &&
        this.unreliableDataChannel.readyState === "open"
      ) {
        this.log("both channels open!");
        // fire custom open event when both channels are open
        this.onopen();
        this.sendMessage("reliable", { pType: "ping" });
      }
    };
    channel.onclose = () => {
      this.log(
        `channel closed! channel name: ${channel.label}`,
        "for safety reasons, just close this whole connection...",
      );
      this.shutDown();
    };
    channel.onerror = (event) => {
      this.log(
        `rtc error happened for channel name: ${channel.label}! error: ${event.error}`,
        "closing connection...",
      );
      this.shutDown();
    };
    channel.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as RTCMessage;
      this.onmessage(message);
      this.log(`received message on channel ${channel.label}: ${event.data}`);
    };
  }

  public shutDown() {
    this.reliableDataChannel.close();
    this.unreliableDataChannel.close();
    this.close();
    this.onclose?.();
    // unset the event so that it is only called once
    this.onclose = undefined;
  }

  public sendMessage(sendType: SendType, message: RTCMessage) {
    const channel =
      sendType === "reliable"
        ? this.reliableDataChannel
        : this.unreliableDataChannel;
    channel.send(JSON.stringify(message));
  }

  private log(...data: string[]) {
    if (!log) return;
    console.warn(
      `logging from RemoteRTCPeer with id ${this.remotePeerId}`,
      data,
    );
  }
}

const log = false;
