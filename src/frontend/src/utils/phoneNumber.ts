/**
 * Phone number validation and normalization utilities for E.164 format
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Normalize phone number by removing spaces and dashes
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.trim().replace(/\s+/g, '').replace(/-/g, '');
}

/**
 * Validate phone number in E.164 format
 * Must start with '+', followed by 7-15 digits
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return {
      isValid: false,
      error: 'Please enter a phone number',
    };
  }

  if (!normalized.startsWith('+')) {
    return {
      isValid: false,
      error: 'Phone number must start with + (e.g., +1234567890)',
    };
  }

  const digits = normalized.slice(1);
  if (!/^\d+$/.test(digits)) {
    return {
      isValid: false,
      error: 'Phone number can only contain digits after +',
    };
  }

  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      error: 'Phone number must be between 7 and 15 digits',
    };
  }

  return {
    isValid: true,
    normalized,
  };
}
