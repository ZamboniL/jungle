import { readUuid, writeUuid } from "./encode/uuid.js";

type DisconnectPacket = {
  clientId: string; // 16B
};

export const readDisconnect = (buffer: ArrayBuffer): DisconnectPacket => {
  if (buffer.byteLength !== 16) {
    throw new Error(`Invalid connect packet length: ${buffer.byteLength}.`);
  }

  const clientId = readUuid(buffer);

  return { clientId };
};

export const writeDisconnect = (packet: DisconnectPacket): ArrayBuffer => {
  if (typeof packet.clientId !== "string" || packet.clientId.length !== 36) {
    throw new Error(`Invalid clientId format: ${packet.clientId}.`);
  }

  return writeUuid(packet.clientId).buffer;
};
