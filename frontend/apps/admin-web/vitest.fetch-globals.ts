// Test-only, runs before src/test/setup.ts. Outside src/ so Node types stay out of the app's tsconfig.
//
// Uploads: jsdom's File/Blob/FormData don't survive Node's fetch (body length mismatch), and MSW can't parse
// multipart into them, so the fetch side uses Node's own classes. Vitest wraps Request to convert jsdom
// bodies; its parent class is Node's Request. This must run before lib/api is imported: openapi-fetch
// captures Request (like fetch) when the client is created.
import { Blob, File } from "node:buffer";

// Node's FormData isn't importable, but Node's Response (jsdom has none) hands one out. Parsing an empty
// form here is fine; the deprecation is about parsing large multipart bodies on a server.
// eslint-disable-next-line @typescript-eslint/no-deprecated
const NodeFormData = (await new Response(new URLSearchParams()).formData()).constructor;

Object.assign(globalThis, {
  Blob,
  File,
  FormData: NodeFormData,
  Request: Object.getPrototypeOf(globalThis.Request) as typeof Request,
});
