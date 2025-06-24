import { readUuid, writeUuid } from "./encode/uuid.js";

export type DisconnectPacket = {
  clientId: string; // 16B
};

export const readDisconnect = (data: DataView): DisconnectPacket => {
  if (data.byteLength !== 16) {
    throw new Error(`Invalid connect packet length: ${data.byteLength}.`);
  }

  const clientId = readUuid(data.buffer);

  return { clientId };
};

export const writeDisconnect = (packet: DisconnectPacket): ArrayBuffer => {
  if (typeof packet.clientId !== "string" || packet.clientId.length !== 36) {
    throw new Error(`Invalid clientId format: ${packet.clientId}.`);
  }

  return writeUuid(packet.clientId).buffer;
};
