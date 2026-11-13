// GET /api/share: the head a link preview reads, for an address with no file of its own. See lib/share.js.
import { handleShare } from '../lib/share.js';

export default { fetch: (/** @type {Request} */ request) => handleShare(request) };
