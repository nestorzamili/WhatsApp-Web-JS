import { sendMessage, getGroupID } from '../services/message.service.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
} from '../utils/response.js';
import { formatUptime, isEmpty } from '../utils/helpers.js';

export const sendMessageController = async (req, res, client) => {
  try {
    const { message, id, filePaths } = req.body;
    const files = req.files;

    if (!Array.isArray(id) || id.length === 0) {
      return sendErrorResponse(
        res,
        'ID must be a non-empty array',
        ERROR_CODES.MISSING_ID,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const targetIds = id
      .map((i) => String(i).trim())
      .filter((id) => id && (id.includes('@c.us') || id.includes('@g.us')));

    if (targetIds.length === 0) {
      return sendErrorResponse(
        res,
        'At least one valid WhatsApp ID is required (format: number@c.us or number@g.us)',
        ERROR_CODES.MISSING_ID,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let attachmentPaths = null;
    if (filePaths) {
      if (!Array.isArray(filePaths)) {
        return sendErrorResponse(
          res,
          'filePaths must be an array',
          ERROR_CODES.INVALID_INPUT,
          null,
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      attachmentPaths = filePaths.map((p) => String(p).trim()).filter(Boolean);

      if (attachmentPaths.length === 0) {
        attachmentPaths = null;
      }
    }

    if (!message?.trim() && !files?.length && !attachmentPaths?.length) {
      return sendErrorResponse(
        res,
        'Message text, files, or file paths are required',
        ERROR_CODES.MISSING_CONTENT,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const errors = [];
    let successCount = 0;

    for (const targetId of targetIds) {
      try {
        await sendMessage(client, targetId, {
          message: message?.trim() || null,
          files,
          filePaths: attachmentPaths,
        });
        successCount++;
      } catch (error) {
        errors.push({
          id: targetId,
          error: error.message,
        });
      }
    }

    const totalCount = targetIds.length;
    const isFullSuccess = successCount === totalCount;

    return sendSuccessResponse(
      res,
      {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount,
        ...(errors.length > 0 && { errors }),
      },
      isFullSuccess
        ? 'Sent to all recipients'
        : `Sent to ${successCount}/${totalCount} recipients`,
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      'Failed to send message',
      ERROR_CODES.SEND_MESSAGE_ERROR,
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

export const getGroupIdController = async (req, res, client) => {
  try {
    const { groupName } = req.query;

    if (isEmpty(groupName)) {
      return sendErrorResponse(
        res,
        'Group name is required',
        ERROR_CODES.MISSING_GROUP_NAME,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const groupId = await getGroupID(client, groupName);

    if (!groupId) {
      return sendErrorResponse(
        res,
        'Group not found',
        ERROR_CODES.GROUP_NOT_FOUND,
        null,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return sendSuccessResponse(
      res,
      {
        groupName,
        groupId,
      },
      'Group found successfully',
    );
  } catch (error) {
    return sendErrorResponse(
      res,
      'Failed to get group ID',
      ERROR_CODES.GET_GROUP_ERROR,
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

export const healthCheckController = (req, res) => {
  return sendSuccessResponse(
    res,
    {
      status: 'healthy',
      uptime: formatUptime(process.uptime()),
    },
    'Server is running healthy',
  );
};
