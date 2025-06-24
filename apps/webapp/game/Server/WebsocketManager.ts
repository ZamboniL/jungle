import {
  createWebSocketProtocol,
  type MessageHandler,
} from "@jungle/communication/websocket/client";
import { PACKET, type PacketType } from "@jungle/packet";

export class WebsocketManager {
  private _id: Uint8Array = new Uint8Array(8);
  private socket: WebSocket | null = null;
  private protocol: ReturnType<typeof createWebSocketProtocol> | null = null;
  private handlers: { [K in PacketType]: MessageHandler<K>[] } = {
    [PACKET.CONNECT]: [],
    [PACKET.DISCONNECT]: [],
    [PACKET.GAME_STATE]: [],
    [PACKET.STEP]: [],
    [PACKET.WELCOME]: [],
  };

  constructor() {
    this.init();
    // this._id = generateUUID();
  }

  private init(): void {
    this.socket = new WebSocket("ws://localhost:8080");
    this.protocol = createWebSocketProtocol(this.socket, {
      [PACKET.CONNECT]: (message) => {
        // console.log("Connected with ID:", message.header.id);

        for (const handler of this.handlers[PACKET.CONNECT]) {
          handler(message);
        }
      },
      [PACKET.STEP]: (message) => {
        console.log("Batch positions received:", message.data);

        for (const handler of this.handlers[PACKET.STEP]) {
          handler(message);
        }
      },
    });

    this.socket.onopen = () => {
      // this.protocol?.send({ type: PACKET.CONNECT }, this._id);
    };

    this.socket.onclose = () => {
      // this.protocol?.send({ type: PACKET.DISCONNECT }, this._id);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(type: PacketType, message: ArrayBuffer = new ArrayBuffer(0)): void {
    if (
      this.protocol &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      // this.protocol?.send(type, this._id, message);
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  addHandler<T extends PacketType>(type: T, handler: MessageHandler<T>): void {
    if (this.protocol) {
      this.handlers[type].push(handler);
    } else {
      console.error("WebSocket protocol is not initialized.");
    }
  }
}
