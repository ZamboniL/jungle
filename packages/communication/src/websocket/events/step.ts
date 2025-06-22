export const STEP = 3;

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

type StepType = (typeof Step)[keyof typeof Step];

/**
 * @returns Uint8Array[0]
 */
export const writeStep = (step: `${keyof typeof Step}`): Uint8Array => {
  if (!Step[step]) {
    throw new Error(`Invalid step value: ${step}.`);
  }

  const buffer = new Uint8Array(1);
  buffer[0] = Step[step];

  return buffer;
};

export const readStep = (buffer: ArrayBuffer): StepType => {
  if (buffer.byteLength !== 1) {
    throw new Error(`Invalid step buffer length: ${buffer.byteLength}.`);
  }

  const step = new Uint8Array(buffer)[0] as StepType;

  if (!Object.values(Step).includes(step)) {
    throw new Error(`Invalid step value: ${step}.`);
  }

  return step;
};
