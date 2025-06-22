export const readUuid = (buffer: ArrayBuffer): string => {
  if (buffer.byteLength !== 16) {
    throw new Error(`Invalid UUID buffer length: ${buffer.byteLength}.`);
  }

  const bytes = new Uint8Array(buffer);

  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const writeUuid = (uuid: string): Uint8Array => {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID format: ${uuid}`);
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
};
