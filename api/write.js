// The one Vercel Function: see lib/write.js for the protocol.
import { handleWrite } from '../lib/write.js';

export default { fetch: (/** @type {Request} */ request) => handleWrite(request) };
