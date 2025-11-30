import 'dotenv/config';
import {
  sendErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
} from '../utils/response.js';
import logger from '../utils/logger.js';

export default function verifyKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  if (!apiKey || apiKey !== validApiKey) {
    logger.info(`AUTH FAILED - IP: ${clientIP}`);
    return sendErrorResponse(
      res,
      'Unauthorized access',
      ERROR_CODES.INVALID_API_KEY,
      'Invalid or missing API key',
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  next();
}


