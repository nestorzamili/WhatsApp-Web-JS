import verifyKey from '../middlewares/auth.middleware.js';
import { uploadFiles } from '../middlewares/upload.middleware.js';
import {
  sendMessageController,
  getGroupIdController,
  healthCheckController,
} from '../controllers/message.controller.js';

export default function (app, client) {
  // Health check endpoint
  app.get('/', healthCheckController);

  // Send message endpoint - handles text, files, and base64 images
  app.post('/send-message', verifyKey, uploadFiles, (req, res) =>
    sendMessageController(req, res, client),
  );

  // Get group ID endpoint
  app.get('/get-group-id', verifyKey, (req, res) =>
    getGroupIdController(req, res, client),
  );
}
