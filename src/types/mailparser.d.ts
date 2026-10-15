declare module "mailparser" {
  export function simpleParser(source: Buffer | string | Uint8Array): Promise<{
    subject?: string;
    from?: { text?: string };
    date?: Date | null;
    text?: string;
    html?: string | false;
    attachments: Array<{ filename?: string | null; contentType?: string; size?: number }>;
  }>;
}
