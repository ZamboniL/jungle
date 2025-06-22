import { Event, type EventType, type EventTypeEnum } from "./events/index.js";
export { Event, type EventType, type EventTypeEnum };

export type MessageHeader<T extends EventTypeEnum = EventTypeEnum> = {
  type: T;
  id: Uint8Array;
};

export type MessagePayload =
  | { type: EventType["CONNECT"]; data: [] }
  | { type: EventType["DISCONNECT"]; data: [] }
  | {
      type: EventType["BATCH_POSITIONS"];
      data: { x: number; y: number }[];
    };

const HEADER_SIZE = 17;

export function encodeMessage(
  header: MessageHeader,
  data: ArrayBufferLike,
): ArrayBuffer {
  const encoded = new Uint8Array(HEADER_SIZE + data.byteLength);

  encoded[0] = header.type;
  encoded.set(header.id, 1);
  encoded.set(new Uint8Array(data), HEADER_SIZE);

  return encoded.buffer;
}

export function decodeMessage(buffer: ArrayBuffer): {
  header: MessageHeader;
  data: ArrayBuffer;
} {
  const view = new Uint8Array(buffer);
  const type = view[0] as EventTypeEnum;

  if (!(type || Event.values.includes(type))) {
    throw new Error(`Unknown event type: ${type}`);
  }

  return {
    header: {
      type: view[0] as EventTypeEnum,
      id: view.slice(1, HEADER_SIZE),
    },
    data: buffer.slice(HEADER_SIZE),
  };
}

export function generateUUID(): Uint8Array {
  const uuid = crypto.randomUUID();

  return encodeUUID(uuid);
}

export function encodeUUID(id: string): Uint8Array {
  const hex = id.replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function decodeUUID(id: Uint8Array): string {
  const hex = Array.from(id)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function deserializePayload<T extends EventTypeEnum>(
  header: MessageHeader,
  data: ArrayBuffer,
): PayloadDataMap[T] {
  switch (header.type) {
    case Event.CONNECT:
    case Event.DISCONNECT:
      return [];

    case Event.BATCH_POSITIONS: {
      const raw = new Uint8Array(data);
      const aligned = new ArrayBuffer(raw.byteLength);
      new Uint8Array(aligned).set(raw);

      const floatData = new Float32Array(aligned);
      const points = [];

      for (let i = 0; i < floatData.length; i += 2) {
        const x = floatData[i];
        const y = floatData[i + 1];

        if (x === undefined || y === undefined) {
          throw new Error(
            `Invalid position data received: x=${x}, y=${y}, index=${i}, floatData=${floatData}`,
          );
        }

        points.push({ x, y });
      }

      return points as PayloadDataMap[T];
    }

    default:
      throw new Error(`Unknown message type: ${header.type}`);
  }
}

export function serializePayload<T extends EventTypeEnum>(
  type: T,
  data: PayloadDataMap[T],
): ArrayBuffer {
  switch (type) {
    case Event.CONNECT:
    case Event.DISCONNECT:
      return new ArrayBuffer(0);

    case Event.BATCH_POSITIONS: {
      const floatData = new Float32Array(data.length * 2);

      for (let i = 0; i < data.length; i++) {
        const { x, y } = data[i];
        if (x === undefined || y === undefined) {
          throw new Error(
            `Invalid position data: x=${x}, y=${y} at index ${i}`,
          );
        }

        floatData[i * 2] = x;
        floatData[i * 2 + 1] = y;
      }

      return floatData.buffer;
    }

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

export type PayloadDataMap = {
  [Event.CONNECT]: [];
  [Event.DISCONNECT]: [];
  [Event.BATCH_POSITIONS]: { x: number; y: number }[];
};
