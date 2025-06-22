import {
  Event,
  encodeMessage,
  encodeUUID,
  serializePayload,
} from "@jungle/communication/websocket";
import { createWebSocketServerProtocol } from "@jungle/communication/websocket/server";
import { WebSocketServer } from "ws";

console.log("Starting WebSocket server...");
const server = new WebSocketServer({ port: 8080 });

const CLIENTS = new Map<string, string>();

console.log("WebSocket server is running on ws://localhost:8080");
createWebSocketServerProtocol(server, {
  [Event.CONNECT]: (_, { header }) => {
    console.log(`Client connected with UUID: ${header.id}`);
    CLIENTS.set(header.localId, header.id);
  },
  [Event.DISCONNECT]: (_, { header }) => {
    console.log(`Client disconnected with UUID: ${header.id}`);
    CLIENTS.delete(header.localId);
  },
  [Event.BATCH_POSITIONS]: (socket, { header, data }) => {
    console.log(`Batch positions received from client: ${header.id}`);

    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== socket) {
        socket.send(
          encodeMessage(
            {
              id: encodeUUID(header.id),
              type: Event.BATCH_POSITIONS,
            },
            serializePayload(Event.BATCH_POSITIONS, data),
          ),
        );
      }
    });
  },
});
