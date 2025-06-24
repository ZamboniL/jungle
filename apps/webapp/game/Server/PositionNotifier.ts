import type { WebsocketManager } from "./WebsocketManager";

export class PositionNotifier {
  private _positionBuffer: { x: number; y: number }[] = [];
  constructor(private _socketManager: WebsocketManager) {
    setInterval(() => {
      this._sendBufferedPositions();
    }, 50);
  }

  addPosition(x: number, y: number) {
    this._positionBuffer.push({ x, y });
  }

  private _sendBufferedPositions() {
    if (this._positionBuffer.length === 0) return;

    // const positionsToSend = serializePayload(
    //   Event.BATCH_POSITIONS,
    //   this._positionBuffer,
    // );

    // this._socketManager.send(Event.BATCH_POSITIONS, positionsToSend);

    this._positionBuffer = [];
  }
}
