/**
 * Creates a unique client-side ID that also works on LAN pages served over HTTP.
 *
 * crypto.randomUUID() is only guaranteed in secure browser contexts (HTTPS or
 * localhost). Employees opening the app through a private router IP such as
 * http://192.168.x.x may therefore not have randomUUID available. This helper
 * uses it when possible and safely falls back when it is unavailable.
 */
export function createId(prefix = "") {
  let value = "";

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    value = globalThis.crypto.randomUUID();
  } else if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // RFC 4122 version 4 bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    value = [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  } else {
    value = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  return prefix ? `${prefix}-${value}` : value;
}

export default createId;
