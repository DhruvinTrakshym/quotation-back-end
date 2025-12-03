/**
 * Capitalizes the first letter of the first word in a string.
 * Returns null if input is invalid.
 */
export function capitalizeFirstWord(input: unknown, locale: string = 'en'): string | null {
  // Validate input type
  if (typeof input !== 'string') {
    return null;
  }

  // Trim only the start; preserve the rest
  const trimmed = input.trimStart();
  if (trimmed.length === 0) {
    return null;
  }

  // Find end of first word
  const firstWhitespaceIndex = trimmed.search(/\s/);
  const end = firstWhitespaceIndex === -1 ? trimmed.length : firstWhitespaceIndex;

  const firstWord = trimmed.slice(0, end);
  const rest = trimmed.slice(end); // includes whitespace and remaining text

  // Uppercase only the first letter
  const firstChar = firstWord.charAt(0);
  const upperFirstChar = firstChar.toLocaleUpperCase(locale);

  return upperFirstChar + firstWord.slice(1) + rest;
}
