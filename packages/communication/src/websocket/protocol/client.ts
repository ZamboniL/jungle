import {
  decodeMessage,
  decodeUUID,
  deserializePayload,
  type EventTypeEnum,
  encodeMessage,
  generateUUID,
  type MessageHeader,
  type PayloadDataMap,
} from "../index.js";

export type Message<T extends EventTypeEnum> = {
  header: { type: T; id: string };
  data: PayloadDataMap[T];
};

export type MessageHandler<T extends EventTypeEnum> = (msg: Message<T>) => void;

export function createWebSocketProtocol(
  ws: WebSocket,
  handlers: {
    [K in EventTypeEnum]?: MessageHandler<K>;
  },
): {
  send: (
    type: EventTypeEnum,
    id?: Uint8Array,
    payload?: ArrayBufferLike,
  ) => void;
} {
  ws.binaryType = "arraybuffer";

  ws.onmessage = (event) => {
    try {
      const { header, data } = decodeMessage(event.data);
      const payload = deserializePayload(
        header,
        data,
      ) as PayloadDataMap[typeof header.type];

      const handler = handlers[header.type] as MessageHandler<
        typeof header.type
      >;

      if (handler) {
        handler({
          header: {
            id: decodeUUID(header.id),
            type: header.type,
          },
          data: payload,
        });
      } else {
        console.warn("No handler for event type:", header.type);
      }
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  };

  return {
    send: (type, id = generateUUID(), payload = new ArrayBuffer(0)) => {
      const header: MessageHeader = { type, id };
      const message = encodeMessage(header, payload);
      ws.send(message);
    },
  };
}
