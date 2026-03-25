import crypto from "crypto";

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifyProFixIQSignature(args: {
  payload: string;
  timestamp: string;
  signature: string;
  secret: string;
}) {
  const expected = crypto
    .createHmac("sha256", args.secret)
    .update(`${args.timestamp}.${args.payload}`)
    .digest("hex");

  return safeEqual(expected, args.signature);
}
