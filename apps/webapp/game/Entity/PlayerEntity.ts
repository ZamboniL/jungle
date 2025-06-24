import { Entity } from "./Entity";

export class PlayerEntity extends Entity {
  private _isLocalPlayer: boolean = false;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 5, 26, 37, "player");
  }

  set isLocalPlayer(value: boolean) {
    this._isLocalPlayer = value;
  }

  get isLocalPlayer(): boolean {
    return this._isLocalPlayer;
  }
}
