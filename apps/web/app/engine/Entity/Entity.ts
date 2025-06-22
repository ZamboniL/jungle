import { Point, Sprite } from "pixi.js";
import type { ASSETS } from "../const.js";

type Keys = keyof typeof ASSETS;
type Assets = (typeof ASSETS)[Keys];

export class Entity {
  private _sprite: Sprite | null = null;
  private _position: Point = new Point(0, 0);

  constructor(
    public id: string,
    x: number,
    y: number,
    public speed: number,
    public width: number,
    public height: number,
    public asset: Assets["alias"],
  ) {
    this.width = width;
    this.height = height;

    this._position.set(x, y);
    this._sprite = Sprite.from(asset);

    this._sprite.anchor.set(0.5);
    this._sprite.position.set(x, y);
    this._sprite.width = this.width;
    this._sprite.height = this.height;
  }

  get sprite(): Sprite {
    if (!this._sprite) {
      throw new Error(
        "Sprite is not initialized. Please ensure the sprite is created before accessing it.",
      );
    }

    return this._sprite;
  }

  get position(): Point {
    return this._position;
  }

  move(point: Point): void {
    this._position = this._position.add(point);
    this.sprite.position.copyFrom(this._position);
  }
}
