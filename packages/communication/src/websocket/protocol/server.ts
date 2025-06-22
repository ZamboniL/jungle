import type { WebSocket, WebSocketServer } from "ws";
import { Event, type EventTypeEnum } from "../events/index.js";
import {
  decodeMessage,
  decodeUUID,
  deserializePayload,
  generateUUID,
  type PayloadDataMap,
} from "../index.js";

export type Message<T extends EventTypeEnum> = {
  header: {
    type: T;
    localId: string;
    id: string;
  };
  data: PayloadDataMap[T];
};

type MessageHandler<T extends EventTypeEnum> = (
  socket: WebSocket,
  msg: Message<T>,
) => void;

type ServerHandlers = {
  [K in EventTypeEnum]?: MessageHandler<K>;
};

export function createWebSocketServerProtocol(
  server: WebSocketServer,
  handlers: ServerHandlers,
) {
  server.on("connection", (socket) => {
    const clientLocalId = Math.random().toString(36).substring(2, 15);
    let clientTransportId = decodeUUID(generateUUID());
    let updatedTransportId = false;

    socket.on("message", (message) => {
      try {
        const { header, data } = decodeMessage(message as ArrayBuffer);
        const type = header.type as EventTypeEnum;

        if (!updatedTransportId) {
          clientTransportId = decodeUUID(header.id);
          updatedTransportId = true;
        } else {
          if (clientTransportId !== decodeUUID(header.id)) {
            console.warn(
              "Client transport ID mismatch. Expected:",
              clientTransportId,
              "Received:",
              decodeUUID(header.id),
            );
          }
        }

        const payload = deserializePayload(header, data);

        const handler = handlers[type] as MessageHandler<typeof type>;
        if (handler) {
          handler(socket, {
            header: { id: clientTransportId, localId: clientLocalId, type },
            data: payload,
          });
        } else {
          console.warn("No handler for server event type:", type);
        }
      } catch (err) {
        console.error("Failed to parse incoming WS message:", err);
      }
    });

    socket.on("close", () => {
      handlers[Event.DISCONNECT]?.(socket, {
        header: {
          type: Event.DISCONNECT,
          id: clientTransportId,
          localId: clientLocalId,
        },
        data: [],
      });
    });
  });
}
