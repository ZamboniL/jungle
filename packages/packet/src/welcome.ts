import { readUuid, writeUuid } from "./encode/uuid.js";

type Player = {
  roomId: number; // 1B
  id: string; // 16B
};

export type WelcomePacket = {
  playerCount: number; // 1B
  currentPlayer: {
    roomId: number; // 1B
    position: {
      x: number; // 4B
      y: number; // 4B
    };
  };
  players: Player[]; // playerCount * (1B + 16B)
};

export const readWelcome = (
  data: DataView,
  offset: number = 0,
): WelcomePacket => {
  if (data.byteLength < offset + 9) {
    throw new Error(
      `Invalid welcome packet length: ${data.byteLength}, expected at least ${offset + 9}.`,
    );
  }

  const playerCount = data.getUint8(offset);
  offset += 1;

  const roomId = data.getUint8(offset);
  offset += 1;

  const x = data.getFloat32(offset, true);
  offset += 4;

  const y = data.getFloat32(offset, true);
  offset += 4;

  if (data.byteLength < offset + playerCount * 17) {
    throw new Error(
      `Invalid welcome packet length: ${data.byteLength}, expected at least ${offset + playerCount * 17}.`,
    );
  }

  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    const roomId = data.getUint8(offset);
    offset += 1;

    const uuidBytes = new Uint8Array(data.buffer, offset, 16);
    offset += 16;

    const uuid = readUuid(uuidBytes.buffer);

    players.push({ roomId, id: uuid });
  }

  return {
    playerCount,
    currentPlayer: { roomId, position: { x, y } },
    players,
  };
};

export const writeWelcome = (packet: WelcomePacket): ArrayBuffer => {
  const buffer = new ArrayBuffer(2 + packet.playerCount * 17);
  const view = new DataView(buffer);

  view.setUint8(0, packet.playerCount);
  view.setUint8(1, packet.currentPlayer.roomId);
  view.setFloat32(2, packet.currentPlayer.position.x, true);
  view.setFloat32(6, packet.currentPlayer.position.y, true);

  let offset = 10;
  for (const player of packet.players) {
    view.setUint8(offset, player.roomId);
    offset += 1;

    const uuidBytes = writeUuid(player.id);
    new Uint8Array(buffer).set(uuidBytes, offset);
    offset += 16;
  }

  return buffer;
};
