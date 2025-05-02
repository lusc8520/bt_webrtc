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
  onmessage: (message: RTCMessage) => void;
  onFile: (file: File, id: number) => void;
};

export class RemoteRTCPeer extends RTCPeerConnection {
  private readonly unreliableDataChannel: RTCDataChannel;
  private readonly reliableDataChannel: RTCDataChannel;
  public readonly remotePeerId: number;

  private readonly onopen: () => void;
  private readonly onmessage: (message: RTCMessage) => void;
  private readonly onclose: () => void;
  private readonly onFile: (file: File, id: number) => void;

  public isShutDown = false;

  constructor({
    peerId,
    config,
    onnegotiationneeded,
    onicecandidate,
    onopen,
    onclose,
    onmessage,
    onFile,
  }: ConstructorData) {
    super(config);
    this.handleErrors();
    this.onnegotiationneeded = onnegotiationneeded;
    this.onicecandidate = onicecandidate;
    this.remotePeerId = peerId;
    this.onopen = onopen;
    this.onclose = onclose;
    this.onmessage = onmessage;
    this.onFile = onFile;
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
      } else if (event.data instanceof ArrayBuffer) {
        const dataView = new DataView(event.data);
        const fileData = FileMessage.deserialize(dataView);
        this.onFile(fileData.file, fileData.id);
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

  public sendFileMessage(file: File, id: number) {
    if (file.size > (this.sctp?.maxMessageSize ?? -1)) {
      console.error("FILE TOO LARGE! not sending");
      return;
    }
    FileMessage.serialize(file, id).then((data) =>
      this.reliableDataChannel.send(data),
    );
  }

  public sendMessage(sendType: SendType, message: RTCMessage) {
    const channel =
      sendType === "reliable"
        ? this.reliableDataChannel
        : this.unreliableDataChannel;
    channel.send(JSON.stringify(message));
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
