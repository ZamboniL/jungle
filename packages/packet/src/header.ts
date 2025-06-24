import { PACKET, type PacketType } from "./index.js";

export type HeaderPacket<T extends PacketType> = {
  type: T;
};

export const isValidPacketType = (type: number): type is PacketType =>
  Object.values(PACKET).includes(type as PacketType);

export const readHeader = <T extends PacketType>(
  data: DataView,
  offset: number = 0,
): HeaderPacket<T> => {
  const type = data.getUint8(offset) as T;

  if (!isValidPacketType(type)) {
    throw new Error(`Unknown packet type: ${type}`);
  }

  return { type };
};

export const writeHeader = <T extends PacketType>(
  packet: HeaderPacket<T>,
): ArrayBuffer => {
  const buffer = new ArrayBuffer(1);
  const view = new DataView(buffer);
  view.setUint8(0, packet.type);

  return buffer;
};
