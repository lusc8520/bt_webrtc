import { RTCMessage, SendType } from "../types.ts";
import { FileMessage } from "../binaryMessage.ts";

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
  onmessage: (message: RTCMessage | File) => void;
};

export class RemoteRTCPeer extends RTCPeerConnection {
  private readonly unreliableDataChannel: RTCDataChannel;
  private readonly reliableDataChannel: RTCDataChannel;
  public readonly remotePeerId: number;

  private readonly onopen: () => void;
  private readonly onmessage: (message: RTCMessage | File) => void;
  private readonly onclose: () => void;

  public isShutDown = false;

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
    this.handleErrors();
    this.onnegotiationneeded = onnegotiationneeded;
    this.onicecandidate = onicecandidate;
    this.remotePeerId = peerId;
    this.onopen = onopen;
    this.onclose = onclose;
    this.onmessage = onmessage;
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
      if (
        this.reliableDataChannel.readyState === "open" &&
        this.unreliableDataChannel.readyState === "open"
      ) {
        // fire custom open event when both channels are open
        const sctp = this.sctp;
        if (sctp !== null) {
          console.warn(
            "max channels:",
            sctp.maxChannels,
            "max message size:",
            sctp.maxMessageSize,
          );
        }
        this.onopen();
        this.sendMessage("reliable", { pType: "ping" });
      }
    };
    channel.onclose = () => {
      this.shutDown();
    };
    channel.onerror = () => {
      channel.close();
    };

    channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        const message = JSON.parse(event.data) as RTCMessage;
        this.onmessage(message);
      } else if (event.data instanceof DataView) {
        const file = FileMessage.deserialize(event.data);
        this.onmessage(file);
        console.warn("message was no string", event.data);
      }
    };
  }

  public shutDown() {
    if (this.isShutDown) return; // prevent multiple calls of this function
    this.onclose();
    this.isShutDown = true;
    this.reliableDataChannel.close();
    this.unreliableDataChannel.close();
    this.close();
  }

  public sendMessage(sendType: SendType, message: RTCMessage | File) {
    const channel =
      sendType === "reliable"
        ? this.reliableDataChannel
        : this.unreliableDataChannel;
    if (message instanceof File) {
      FileMessage.serialize(message).then(channel.send);
    } else {
      channel.send(JSON.stringify(message));
    }
  }

  private handleErrors() {
    this.onicecandidateerror = (e) => {
      console.error("ICE ERROR", `status code: ${e.errorCode}`, e.errorText);
    };

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
    this.oniceconnectionstatechange = () => {
      switch (this.iceConnectionState) {
        case "disconnected":
          this.shutDown();
          break;
        case "closed":
          this.shutDown();
          break;
        case "failed":
          this.shutDown();
          break;
      }
    };
  }
}
