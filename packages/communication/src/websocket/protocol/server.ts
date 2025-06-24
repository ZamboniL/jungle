import {
  PACKET,
  type Packet,
  type PacketDefinition,
  type PacketType,
  readPacket,
  writePacket,
} from "@jungle/packet";
import type { WebSocket, WebSocketServer } from "ws";

export type Message<T extends PacketType> = {
  header: {
    type: T;
  };
  data: PacketDefinition<T>;
};

type MessageHandler<T extends PacketType> = (
  helpers: { socket: WebSocket; writePacket: typeof writePacket },
  msg: Message<T>,
) => void;

type ServerHandlers = {
  [K in PacketType]?: MessageHandler<K>;
};

export function createWebSocketServerProtocol(
  server: WebSocketServer,
  handlers: ServerHandlers,
) {
  server.on("connection", (socket) => {
    let clientTransportId = "unknown";

    socket.on("message", (message) => {
      try {
        const { header, data } = readPacket(message as ArrayBuffer);

        const type = header.type;

        if (header.type === PACKET.CONNECT) {
          const connectData = data as PacketDefinition<Packet["CONNECT"]>;

          clientTransportId = connectData.clientId;
        }

        const handler = handlers[type] as MessageHandler<typeof type>;
        if (handler) {
          handler(
            { socket, writePacket },
            {
              header: { type },
              data,
            },
          );
        } else {
          console.warn("No handler for server event type:", type);
        }
      } catch (err) {
        console.error("Failed to parse incoming WS message:", err);
      }
    });

    socket.on("close", () => {
      handlers[PACKET.DISCONNECT]?.(
        { socket, writePacket },
        {
          header: {
            type: PACKET.DISCONNECT,
          },
          data: { clientId: clientTransportId },
        },
      );
    });
  });
}
