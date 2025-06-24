import { type ConnectPacket, readConnect, writeConnect } from "./connect.js";
import {
  type DisconnectPacket,
  readDisconnect,
  writeDisconnect,
} from "./disconnect.js";
import {
  type GameStatePacket,
  readGameState,
  writeGameState,
} from "./game-state.js";
import { type HeaderPacket, readHeader, writeHeader } from "./header.js";
import { readStep, type StepPacket, writeStep } from "./step.js";
import { readWelcome, type WelcomePacket, writeWelcome } from "./welcome.js";

export const PACKET = {
  CONNECT: 0,
  DISCONNECT: 1,
  GAME_STATE: 2,
  WELCOME: 3,
  STEP: 4,
} as const;

export type Packet = typeof PACKET;
export type PacketType = (typeof PACKET)[keyof typeof PACKET];

export type PacketDefinitions = {
  [PACKET.CONNECT]: ConnectPacket;
  [PACKET.DISCONNECT]: DisconnectPacket;
  [PACKET.GAME_STATE]: GameStatePacket;
  [PACKET.WELCOME]: WelcomePacket;
  [PACKET.STEP]: StepPacket;
};

export type PacketDefinition<T extends PacketType> = PacketDefinitions[T];

type PacketManager = {
  [K in PacketType]: {
    read: (data: DataView, offset?: number) => PacketDefinitions[K];
    write: (packet: PacketDefinitions[K]) => ArrayBuffer;
  };
};

export const PacketManager: PacketManager = {
  [PACKET.CONNECT]: {
    read: readConnect,
    write: writeConnect,
  },
  [PACKET.DISCONNECT]: {
    read: readDisconnect,
    write: writeDisconnect,
  },
  [PACKET.GAME_STATE]: {
    read: readGameState,
    write: writeGameState,
  },
  [PACKET.WELCOME]: {
    read: readWelcome,
    write: writeWelcome,
  },
  [PACKET.STEP]: {
    read: readStep,
    write: writeStep,
  },
};

const HEADER_SIZE = 1;

export function writePacket<T extends PacketType>(
  header: HeaderPacket<T>,
  data: PacketDefinitions[T],
): ArrayBuffer {
  const headerBuffer = writeHeader(header);
  const packetBuffer = PacketManager[header.type].write(data);

  const combined = new Uint8Array(
    headerBuffer.byteLength + packetBuffer.byteLength,
  );
  combined.set(new Uint8Array(headerBuffer), 0);
  combined.set(new Uint8Array(packetBuffer), headerBuffer.byteLength);

  return combined.buffer;
}

export function readPacket<T extends PacketType>(
  buffer: ArrayBuffer,
): { header: HeaderPacket<T>; data: PacketDefinition<T> } {
  const view = new DataView(buffer);
  const header = readHeader(view, 0) as HeaderPacket<T>;

  const data = PacketManager[header.type].read(view, HEADER_SIZE);

  return { header, data };
}
