export class KeyboardManager {
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
    return !!this.keys[key];
  }
}
