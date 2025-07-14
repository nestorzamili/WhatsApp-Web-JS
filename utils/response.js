export const createSuccessResponse = (data = null, message = 'Success') => ({
  status: 'success',
  message,
  data,
});

export const createErrorResponse = (
  message = 'Error',
  code = null,
  details = null,
) => ({
  status: 'error',
  message,
  error: {
    code,
    details,
  },
});

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_CODES = {
  MISSING_ID: 'MISSING_ID',
  MISSING_GROUP_NAME: 'MISSING_GROUP_NAME',
  MISSING_CONTENT: 'MISSING_CONTENT',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_API_KEY: 'INVALID_API_KEY',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  SEND_MESSAGE_ERROR: 'SEND_MESSAGE_ERROR',
  GET_GROUP_ERROR: 'GET_GROUP_ERROR',
  WHATSAPP_ERROR: 'WHATSAPP_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  HEALTH_CHECK_ERROR: 'HEALTH_CHECK_ERROR',
};

export const sendSuccessResponse = (
  res,
  data = null,
  message = 'Success',
  statusCode = HTTP_STATUS.OK,
) => {
  return res.status(statusCode).json(createSuccessResponse(data, message));
};

export const sendErrorResponse = (
  res,
  message = 'Error',
  code = null,
  details = null,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
) => {
  return res
    .status(statusCode)
    .json(createErrorResponse(message, code, details));
};
