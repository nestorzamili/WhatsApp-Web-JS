import { DANGEROUS_CHARS_REGEX, MAX_PARAMETER_LENGTH } from './constants.js';
import logger from './logger.js';

export function sanitizeParameter(parameter) {
  const warnings = [];

  if (!parameter || typeof parameter !== 'string') {
    return {
      valid: false,
      sanitized: '',
      warnings: [],
      error: 'Parameter is required and must be a string',
    };
  }

  const trimmed = parameter.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      sanitized: '',
      warnings: [],
      error: 'Parameter cannot be empty',
    };
  }

  if (trimmed.length > MAX_PARAMETER_LENGTH) {
    return {
      valid: false,
      sanitized: '',
      warnings: [],
      error: `Parameter exceeds maximum length of ${MAX_PARAMETER_LENGTH} characters`,
    };
  }

  const allMatches = [];
  let match;
  while ((match = DANGEROUS_CHARS_REGEX.exec(trimmed)) !== null) {
    allMatches.push(match[0]);
  }
  if (allMatches.length > 0) {
    const uniqueChars = [...new Set(allMatches)];
    warnings.push(`Removed dangerous characters: ${uniqueChars.join(', ')}`);
    logger.info(
      `Sanitizer: Removed dangerous characters from parameter: ${uniqueChars.join(
        ', ',
      )}`,
    );
  }

  const sanitized = trimmed.replace(DANGEROUS_CHARS_REGEX, '');

  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      warnings,
      error: 'Parameter only contained invalid characters',
    };
  }

  if (containsPathTraversal(sanitized)) {
    return {
      valid: false,
      sanitized: '',
      warnings,
      error: 'Path traversal patterns detected',
    };
  }

  return {
    valid: true,
    sanitized,
    warnings,
  };
}

function containsPathTraversal(input) {
  const patterns = [/\.\.\//g, /\.\.\\/g, /\.\.$/g, /^\.\.$/g];
  return patterns.some((pattern) => pattern.test(input));
}

export function validateCommandPattern(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return {
      valid: false,
      error: 'Pattern is required and must be a string',
    };
  }

  const trimmed = pattern.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Pattern cannot be empty',
    };
  }

  if (trimmed.length > 50) {
    return {
      valid: false,
      error: 'Pattern is too long (max 50 characters)',
    };
  }

  const validPatternRegex = /^[!/@#]?[\w\-:]+$/;
  if (!validPatternRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Pattern contains invalid characters',
    };
  }

  return { valid: true };
}
