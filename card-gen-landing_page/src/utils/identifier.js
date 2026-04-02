const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

export function classifyIdentifier(rawValue) {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return { isValid: false };
  }

  if (EMAIL_REGEX.test(trimmedValue)) {
    return {
      isValid: true,
      type: 'email',
      value: trimmedValue,
    };
  }

  const digitsOnly = trimmedValue.replace(/\D/g, '');
  if (!digitsOnly) {
    return { isValid: false };
  }

  const normalizedPhone = trimmedValue.startsWith('+') ? `+${digitsOnly}` : digitsOnly;
  if (PHONE_REGEX.test(normalizedPhone)) {
    return {
      isValid: true,
      type: 'phone',
      value: normalizedPhone,
    };
  }

  return { isValid: false };
}

export function getIdentifierErrorMessage() {
  return 'Please enter a valid email address or phone number';
}

