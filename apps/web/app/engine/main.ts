import { Application, Assets, Sprite } from "pixi.js";

class KeyboardManager {
  keys: Record<string, boolean> = {};

  init() {
    window.addEventListener("keydown", (event) => {
      this.keys[event.key] = true;
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.key] = false;
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key];
  }
}

class WebsocketManager {
  private socket: WebSocket | null = null;

  connect(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established.");
      this.socket?.send(
        JSON.stringify({
          id: ID,
          type: "connect",
          message: "Client connected",
        }),
      );
    };

    this.socket.onmessage = (event) => {
      console.log("Message from server:", event.data);
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  listen(callback: (message: string) => void): void {
    if (this.socket) {
      this.socket.onmessage = (event) => {
        callback(event.data);
      };
    } else {
      console.error("WebSocket is not initialized.");
    }
  }
}

const ID = Math.random().toString(36).substring(2, 15);

const BUNNIES = new Map<string, Sprite>();

(async () => {
  // Create a new application
  const app = new Application();
  const keyboardManager = new KeyboardManager();
  keyboardManager.init();
  const websocketManager = new WebsocketManager();
  websocketManager.connect("ws://localhost:8080");

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  const container = document.getElementById("pixi-container");

  if (!container) {
    throw new Error("Container with id 'pixi-container' not found.");
  }

  container.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite({ texture, eventMode: "static" });

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);
  BUNNIES.set(ID, bunny);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  websocketManager.listen((message) => {
    const data = JSON.parse(message);
    if (!data?.type) {
      console.error("Invalid message received:", message);
      return;
    }

    let bunnie = BUNNIES.get(data.id);

    if (!bunnie || data.type === "connect") {
      bunnie = new Sprite({ texture, eventMode: "static" });
      bunnie.anchor.set(0.5);
      bunnie.position.set(data.position.x, data.position.y);

      BUNNIES.set(data.id, bunnie);

      app.stage.addChild(bunnie);
      console.log(`New client connected: ${data.id}`);
    }

    if (data.type === "disconnect") {
      app.stage.removeChild(bunnie);
      BUNNIES.delete(data.id);
      return;
    }

    if (data.id !== ID && data.type === "bunnyPosition") {
      bunnie.position.set(data.position.x, data.position.y);
    }
  });

  app.ticker.add((time) => {
    const position = bunny.position;
    let changed = false;
    if (keyboardManager.isKeyPressed("ArrowLeft")) {
      position.x -= 5 * time.deltaTime;
      changed = true;
    }
    if (keyboardManager.isKeyPressed("ArrowRight")) {
      position.x += 5 * time.deltaTime;
      changed = true;
    }
    if (keyboardManager.isKeyPressed("ArrowUp")) {
      position.y -= 5 * time.deltaTime;
      changed = true;
    }
    if (keyboardManager.isKeyPressed("ArrowDown")) {
      position.y += 5 * time.deltaTime;
      changed = true;
    }

    if (changed) {
      websocketManager.send(
        JSON.stringify({
          id: ID,
          type: "bunnyPosition",
          position: {
            x: position.x,
            y: position.y,
          },
        }),
      );

      bunny.position = position;
    }
  });
})();
