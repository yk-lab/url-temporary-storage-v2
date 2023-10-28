import type { AppLoadContext } from "@remix-run/cloudflare";

// Convert a ByteString (a string whose code units are all in the range
// [0, 255]), to a Uint8Array. If you pass in a string with code units larger
// than 255, their values will overflow.
function byteStringToUint8Array(byteString: string) {
  const ui = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; ++i) {
    ui[i] = byteString.charCodeAt(i);
  }
  return ui;
}

export class InvalidMacError extends Error {}

export class ExpiredError extends Error {}

class EmailVerificator {
  private readonly secretKeyData: Uint8Array;
  private key: CryptoKey | null = null;

  constructor(private readonly context: AppLoadContext) {
    const env = this.context.env as Env;
    const secret = env.EMAIL_VERIFY_LINK_SECRET;

    // You will need some super-secret data to use as a symmetric key.
    const encoder = new TextEncoder();
    this.secretKeyData = encoder.encode(secret);

    this.init();
  }

  async init() {
    this.key = await crypto.subtle.importKey(
      "raw",
      this.secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }

  dataToAuthenticate(email: string, expiry: number): string {
    return `${email}@${expiry}`;
  }

  async sign(email: string, expiry: number): Promise<string> {
    if (!this.key) throw new Error("Key not initialized");

    const dataToAuthenticate = this.dataToAuthenticate(email, expiry);

    // Use crypto.subtle.sign() to generate the MAC. The output is a buffer
    // type that you have to convert to a string before sending it to the
    // client.
    const encoder = new TextEncoder();
    const mac = await crypto.subtle.sign(
      "HMAC",
      this.key,
      encoder.encode(dataToAuthenticate),
    );

    return btoa(String.fromCharCode(...new Uint8Array(mac)));
  }
  async verify(
    email: string,
    expiry: number,
    receivedMacBase64: string,
  ): Promise<boolean> {
    if (!this.key) throw new Error("Key not initialized");

    // Extract the query parameters we need and run the HMAC algorithm on the
    // parts of the request we are authenticating: the path and the expiration
    // timestamp. It is crucial to pad the input data, for example, by adding a symbol
    // in-between the two fields that can never occur on the right side. In this
    // case, use the @ symbol to separate the fields.
    const dataToAuthenticate = this.dataToAuthenticate(email, expiry);

    // The received MAC is Base64-encoded, so you have to go to some trouble to
    // get it into a buffer type that crypto.subtle.verify() can read.
    const receivedMac = byteStringToUint8Array(atob(receivedMacBase64));

    // Use crypto.subtle.verify() to guard against timing attacks. Since HMACs use
    // symmetric keys, you could implement this by calling crypto.subtle.sign() and
    // then doing a string comparison -- this is insecure, as string comparisons
    // bail out on the first mismatch, which leaks information to potential
    // attackers.
    const encoder = new TextEncoder();
    const verified = await crypto.subtle.verify(
      "HMAC",
      this.key,
      receivedMac,
      encoder.encode(dataToAuthenticate),
    );

    if (!verified) {
      throw new InvalidMacError();
    }

    if (Date.now() > expiry) {
      throw new ExpiredError();
    }

    return true;
  }
}

export async function getEmailVerificator(context: AppLoadContext) {
  const verificator = new EmailVerificator(context);
  await verificator.init();
  return verificator;
}
