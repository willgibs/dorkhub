// GET /api/picture: a page's lead picture, through our own origin. See lib/picture.js.
import { handlePicture } from '../lib/picture.js';

export default { fetch: (/** @type {Request} */ request) => handlePicture(request) };
