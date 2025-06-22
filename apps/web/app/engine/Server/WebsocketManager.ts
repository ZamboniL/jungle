import {
  Event,
  type EventTypeEnum,
  generateUUID,
} from "@jungle/communication/websocket";
import {
  createWebSocketProtocol,
  type MessageHandler,
} from "@jungle/communication/websocket/client";

export class WebsocketManager {
  private _id: Uint8Array = new Uint8Array(8);
  private socket: WebSocket | null = null;
  private protocol: ReturnType<typeof createWebSocketProtocol> | null = null;
  private handlers: { [K in EventTypeEnum]: MessageHandler<K>[] } = {
    [Event.CONNECT]: [],
    [Event.DISCONNECT]: [],
    [Event.BATCH_POSITIONS]: [],
  };

  constructor() {
    this.init();
    this._id = generateUUID();
  }

  private init(): void {
    this.socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
    this.protocol = createWebSocketProtocol(this.socket, {
      [Event.CONNECT]: (message) => {
        console.log("Connected with ID:", message.header.id);

        for (const handler of this.handlers[Event.CONNECT]) {
          handler(message);
        }
      },
      [Event.BATCH_POSITIONS]: (message) => {
        console.log("Batch positions received:", message.data);

        for (const handler of this.handlers[Event.BATCH_POSITIONS]) {
          handler(message);
        }
      },
    });

    this.socket.onopen = () => {
      this.protocol?.send(Event.CONNECT, this._id);
    };

    this.socket.onclose = () => {
      this.protocol?.send(Event.DISCONNECT, this._id);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(type: EventTypeEnum, message: ArrayBuffer = new ArrayBuffer(0)): void {
    if (
      this.protocol &&
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.protocol?.send(type, this._id, message);
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  addHandler<T extends EventTypeEnum>(
    type: T,
    handler: MessageHandler<T>,
  ): void {
    if (this.protocol) {
      this.handlers[type].push(handler);
    } else {
      console.error("WebSocket protocol is not initialized.");
    }
  }
}
