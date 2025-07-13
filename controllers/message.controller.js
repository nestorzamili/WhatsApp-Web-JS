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
    const { message, id, attachment } = req.body;
    const attachmentFiles = req.files;

    if (!id || id.trim() === '') {
      return sendErrorResponse(
        res,
        'ID is required',
        ERROR_CODES.MISSING_ID,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const targetIds = id
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);

    if (targetIds.length === 0) {
      return sendErrorResponse(
        res,
        'At least one valid ID is required',
        ERROR_CODES.MISSING_ID,
        null,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Support both file upload and file path via unified 'attachment' parameter
    const attachmentPaths = attachment
      ? attachment
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p)
      : null;

    const errors = [];
    let successCount = 0;

    for (const targetId of targetIds) {
      try {
        await sendMessage(client, targetId, {
          text: message,
          files: attachmentFiles,
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

    return sendSuccessResponse(
      res,
      {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount,
        ...(errors.length > 0 && { errors }),
      },
      successCount === totalCount
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
