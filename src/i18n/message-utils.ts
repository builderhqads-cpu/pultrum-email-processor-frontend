export type Messages = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getMessageString(messages: Messages, path: string): string | undefined {
  let current: unknown = messages;

  for (const key of path.split('.')) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
}

