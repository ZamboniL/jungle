type Player = {
  roomId: number; // 1B
  position: {
    x: number; // 4B
    y: number; // 4B
    sequence: number; // 2B
  };
};

type GameStatePacket = {
  tick: number; // 4B
  count: number; // 1B
  players: Player[]; // count * (1B + 2B + 4B + 4B)
};

export const readGameState = (
  data: DataView,
  offset: number = 0,
): GameStatePacket => {
  if (data.byteLength < offset + 5) {
    throw new Error(
      `Invalid game state packet length: ${data.byteLength}, expected at least ${offset + 5}.`,
    );
  }

  const tick = data.getUint32(offset, true);
  offset += 4;

  const count = data.getUint8(offset);
  offset += 1;

  if (data.byteLength < offset + count * 9) {
    throw new Error(
      `Invalid game state packet length: ${data.byteLength}, expected at least ${offset + count * 11}.`,
    );
  }

  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    const roomId = data.getUint8(offset);
    offset += 1;

    const sequence = data.getUint16(offset);
    offset += 2;

    const x = data.getFloat32(offset, true);
    offset += 4;

    const y = data.getFloat32(offset, true);
    offset += 4;

    players.push({ roomId, position: { x, y, sequence } });
  }

  return { tick, count, players };
};

export const writeGameState = (packet: GameStatePacket): ArrayBuffer => {
  const buffer = new ArrayBuffer(2 + packet.count * 11);
  const view = new DataView(buffer);

  view.setUint32(0, packet.tick, true);
  let offset = 4;

  view.setUint8(0, packet.count);
  offset += 1;

  for (const player of packet.players) {
    view.setUint8(offset, player.roomId);
    offset += 1;

    view.setUint16(offset, player.position.sequence);
    offset += 2;

    view.setFloat32(offset, player.position.x, true);
    offset += 4;

    view.setFloat32(offset, player.position.y, true);
    offset += 4;
  }

  return buffer;
};
