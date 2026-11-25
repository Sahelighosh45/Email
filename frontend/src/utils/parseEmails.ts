export function parseEmailsFromText(text: string): string[] {
  const emailRegex =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  const matches = text.match(emailRegex);
  return matches ? Array.from(new Set(matches)) : [];
}
