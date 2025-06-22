import type { Entity } from "./Entity.js";

export class EntityCollection<T extends Entity> {
  private entities: Map<T["id"], T> = new Map();

  add(entity: T): void {
    this.entities.set(entity.id, entity);
  }

  remove(entity: T): void {
    this.entities.delete(entity.id);
  }

  getAll(): Map<T["id"], T> {
    return this.entities;
  }

  get(key: T["id"]): T | undefined {
    return this.entities.get(key);
  }

  clear(): void {
    this.entities = new Map();
  }
}
