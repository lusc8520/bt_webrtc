export type ServerMessage = ClientMessage | { pType: "joined"; ids: number[] };

export type ClientMessage = BaseMessage & { clientId: number };

type BaseMessage =
    | {
    pType: "sdp";
    sdp: RTCSessionDescriptionInit;
}
    | {
    pType: "ice";
    ice: RTCIceCandidateInit;
};


export async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
