import { WebSocketServer } from "ws";

console.log("Starting WebSocket server...");
const server = new WebSocketServer({ port: 8080 });

const CLIENTS = new Map<string, string>();

console.log("WebSocket server is running on ws://localhost:8080");
server.on("connection", (socket) => {
  const clientLocalId = Math.random().toString(36).substring(2, 15);
  console.log(`New client connected! ${clientLocalId}`);
  socket.send("Welcome to the WebSocket server!");

  socket.on("message", (message, isBinary) => {
    console.log("Received message from client:", message);
    const json = JSON.parse(new TextDecoder().decode(message as ArrayBuffer));
    if (json instanceof Buffer) {
      console.log("Received binary data from client");
      console.log("Binary data length:", json.length);
      return;
    }

    if (json.type === "connect") {
      console.log(`Client connected with ID: ${json.id}`);
      CLIENTS.set(clientLocalId, json.id);

      server.clients.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(message, { binary: isBinary });
        }
      });

      return;
    }

    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: isBinary });
      }
    });
  });

  socket.on("close", (code, reason) => {
    console.log(`Client disconnected: ${code} - ${reason}`);
    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "disconnect",
            id: CLIENTS.get(clientLocalId),
          }),
        );
      }
    });
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
