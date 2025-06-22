import { STEP } from "./step.js";

export const Event = {
  CONNECT: 0,
  DISCONNECT: 1,
  BATCH_POSITIONS: 2,
  STEP,
  values: [0, 1, 2],
} as const;

export type EventType = Omit<typeof Event, "values">;

type EventTypeKeys = Exclude<keyof EventType, "values">;
export type EventTypeEnum = EventType[EventTypeKeys];

type Header = {
  type: EventTypeEnum;
  sequence: number;
};

const readHeader = (data: ArrayBuffer): Header => {
  if (data.byteLength < 2) {
    throw new Error(`Invalid header length: ${data.byteLength}.`);
  }

  const view = new DataView(data);
  const type = view.getUint8(0) as EventTypeEnum;
  const sequence = view.getUint8(1);

  return { type, sequence };
};
