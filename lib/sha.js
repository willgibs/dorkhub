/* A hex SHA-256: cache keys and the trial's counter keys. */
import { createHash } from 'node:crypto';

/** @param {string} s */
export const sha = s => createHash('sha256').update(s).digest('hex');
