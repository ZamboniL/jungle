export const Step = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  UP_LEFT: 4,
  UP_RIGHT: 5,
  DOWN_LEFT: 6,
  DOWN_RIGHT: 7,
} as const;

type StepKey = keyof typeof Step;
type StepType = (typeof Step)[keyof typeof Step];

type StepPacket = {
  sequence: number; // 2B
  step: StepKey; // 1B
};

export const writeStep = (packet: StepPacket): Uint8Array => {
  if (!Step[packet.step]) {
    throw new Error(`Invalid step value: ${packet.step}.`);
  }

  if (
    typeof packet.sequence !== "number" ||
    packet.sequence < 0 ||
    packet.sequence > 65535
  ) {
    throw new Error(`Invalid sequence number: ${packet.sequence}.`);
  }

  const buffer = new Uint8Array(3);

  buffer[0] = packet.sequence;
  buffer[2] = Step[packet.step];

  return buffer;
};

export const readStep = (data: DataView, offset: number = 0): StepPacket => {
  if (data.byteLength !== 3) {
    throw new Error(`Invalid step buffer length: ${data.byteLength}.`);
  }

  const sequence = data.getUint16(offset);
  offset += 2;
  const step = data.getUint8(offset) as StepType;

  if (!Object.values(Step).includes(step)) {
    throw new Error(`Invalid step value: ${step}.`);
  }

  return {
    sequence,
    step: Object.keys(Step).find(
      (key) => Step[key as StepKey] === step,
    ) as StepKey,
  };
};
