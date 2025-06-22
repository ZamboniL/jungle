import { Application, Assets, Point } from "pixi.js";
import "pixi.js/math-extras";
import { Event } from "@jungle/communication/websocket";
import { ASSETS } from "./const.js";
import { EntityCollection } from "./Entity/EntityCollection.js";
import { PlayerEntity } from "./Entity/PlayerEntity.js";
import { KeyboardManager } from "./KeyboardManager.js";
import { PositionNotifier } from "./Server/PositionNotifier.js";
import { WebsocketManager } from "./Server/WebsocketManager.js";

const ID = Math.random().toString(36).substring(2, 15);
const PLAYERS = new EntityCollection<PlayerEntity>();

(async () => {
  // Create a new application
  const app = new Application();

  const keyboardManager = new KeyboardManager();
  const websocketManager = new WebsocketManager();
  keyboardManager.init();

  await app.init({ background: "#1099bb", resizeTo: window });

  const container = document.getElementById("pixi-container");

  if (!container) {
    throw new Error("Container with id 'pixi-container' not found.");
  }

  container.appendChild(app.canvas);

  await Assets.load(ASSETS.PLAYER);

  const player = new PlayerEntity(
    ID,
    app.screen.width / 2,
    app.screen.height / 2,
  );
  player.isLocalPlayer = true;

  PLAYERS.add(player);
  app.stage.addChild(player.sprite);
  const positionNotifier = new PositionNotifier(websocketManager);

  websocketManager.addHandler(Event.CONNECT, (message) => {
    if (message.header.id === ID) {
      return;
    }

    let player = PLAYERS.get(message.header.id);
    if (player) {
      console.warn(`Player with ID ${message.header.id} already exists.`);
      return;
    }

    player = new PlayerEntity(
      message.header.id,
      app.screen.width / 2,
      app.screen.height / 2,
    );
    PLAYERS.add(player);
    app.stage.addChild(player.sprite);
  });

  websocketManager.addHandler(Event.DISCONNECT, (message) => {
    const player = PLAYERS.get(message.header.id);
    if (!player) {
      console.warn(`Player with ID ${message.header.id} does not exist.`);
      return;
    }

    app.stage.removeChild(player.sprite);
    PLAYERS.remove(player);
  });

  websocketManager.addHandler(Event.BATCH_POSITIONS, (message) => {
    const player = PLAYERS.get(message.header.id);
    if (!player) {
      console.warn(`Player with ID ${message.header.id} does not exist.`);
      return;
    }

    for (const position of message.data) {
      player.move(new Point(position.x, position.y));
    }
  });
  // => {
  //   const data = JSON.parse(message);
  //   if (!data?.type) {
  //     console.error("Invalid message received:", message);
  //     return;
  //   }

  //   let bunnie = PLAYERS.get(data.id);

  //   if (!bunnie || data.type === "connect") {
  //     bunnie = new PlayerEntity(
  //       data.id,
  //       data.position?.x || app.screen.width / 2,
  //       data.position?.y || app.screen.height / 2,
  //     );

  //     PLAYERS.add(bunnie);
  //     app.stage.addChild(bunnie.sprite);
  //   }

  //   if (data.type === "disconnect") {
  //     app.stage.removeChild(bunnie.sprite);
  //     PLAYERS.remove(data.id);

  //     return;
  //   }

  //   if (data.id !== ID && data.type === "bunnyPosition") {
  //     bunnie.move(data.position.x, data.position.y);
  //   }
  // });

  app.ticker.add((time) => {
    const input = new Point(0, 0);

    if (keyboardManager.isKeyPressed("ArrowLeft")) {
      input.x -= 1;
    }
    if (keyboardManager.isKeyPressed("ArrowRight")) {
      input.x += 1;
    }
    if (keyboardManager.isKeyPressed("ArrowUp")) {
      input.y -= 1;
    }
    if (keyboardManager.isKeyPressed("ArrowDown")) {
      input.y += 1;
    }

    if (!input.equals(Point.shared)) {
      const velocity = input
        .normalize()
        .multiplyScalar(player.speed * time.deltaTime);

      player.move(velocity);
      positionNotifier.addPosition(player.position.x, player.position.y);
    }
  });
})();
