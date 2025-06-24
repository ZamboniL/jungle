import {
  type PacketDefinition,
  type PacketType,
  readPacket,
  writePacket,
} from "@jungle/packet";

export type Message<T extends PacketType> = {
  header: { type: T };
  data: PacketDefinition<T>;
};

export type MessageHandler<T extends PacketType> = (msg: Message<T>) => void;

export function createWebSocketProtocol(
  ws: WebSocket,
  handlers: {
    [K in PacketType]?: MessageHandler<K>;
  },
): {
  send: <T extends PacketType>(
    header: Message<T>["header"],
    data: Message<T>["data"],
  ) => void;
} {
  ws.binaryType = "arraybuffer";

  ws.onmessage = (event) => {
    try {
      const { header, data } = readPacket(event.data);

      const handler = handlers[header.type] as MessageHandler<
        typeof header.type
      >;

      if (handler) {
        handler({
          header,
          data: data,
        });
      } else {
        console.warn("No handler for event type:", header.type);
      }
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  };

  return {
    send: (header, data) => {
      const message = writePacket(header, data);
      ws.send(message);
    },
  };
}
