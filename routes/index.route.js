import verifyKey from '../middlewares/auth.middleware.js';
import { conditionalUpload } from '../middlewares/upload.middleware.js';
import {
  sendMessageController,
  getGroupIdController,
  healthCheckController,
} from '../controllers/message.controller.js';

export default function (app, client) {
  app.get('/', healthCheckController);

  app.post('/send-message', verifyKey, conditionalUpload, (req, res) =>
    sendMessageController(req, res, client),
  );

  app.get('/get-group-id', verifyKey, (req, res) =>
    getGroupIdController(req, res, client),
  );
}
