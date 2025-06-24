import { createServer, type IncomingMessage } from "node:http";
import { createWebSocketServerProtocol } from "@jungle/communication/websocket/server";
import { PACKET, type Packet } from "@jungle/packet";
import { createClient } from "@supabase/supabase-js";
import { WebSocketServer } from "ws";

console.log("Starting WebSocket server...");
const server = createServer();
const wss = new WebSocketServer({ noServer: true });

const CLIENTS = new Map<string, string>();

createWebSocketServerProtocol(wss, {
  [PACKET.CONNECT]: (_, { header, data }) => {
    // CLIENTS.set(header.localId, header.id);
  },
  [PACKET.DISCONNECT]: (_, { header }) => {
    console.log(`Client disconnected with UUID`);
    // CLIENTS.delete(header.localId);
  },
  [PACKET.STEP]: ({ socket, writePacket }, { data }) => {
    console.log(`Batch positions received from client`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== socket) {
        socket.send(
          writePacket<Packet["STEP"]>(
            {
              type: PACKET.STEP,
            },
            data,
          ),
        );
      }
    });
  },
});

const authenticate = async (request: IncomingMessage) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "unknown",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "unknown",
  );

  try {
    return await client.auth.getUser(token);
  } catch {
    return false;
  }
};

server.on("upgrade", (request, socket, head) => {
  authenticate(request).then((res) => {
    if (!res) {
      console.log("Unauthorized WebSocket connection attempt");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    if (!res.data.user) {
      console.log("No user data found in WebSocket connection attempt");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    CLIENTS.set(res.data.user.id, "1");

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
});

server.listen(8080, () => {
  console.log("WebSocket server is listening on port 8080");
});
