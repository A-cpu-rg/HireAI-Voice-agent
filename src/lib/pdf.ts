import { logger } from "./logger";

/** Max accepted upload size for resume/JD files (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export class FileTooLargeError extends Error {
  constructor(public readonly size: number) {
    super(`File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`);
    this.name = "FileTooLargeError";
  }
}

/**
 * Extract text from an uploaded document. PDFs go through `pdf-parse` (v2 class
 * API); everything else is read as UTF-8. Enforces a size cap so a malicious or
 * huge upload cannot exhaust memory. Returns cleaned, trimmed text.
 */
export async function extractDocumentText(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new FileTooLargeError(file.size);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      return (parsed.text || "").trim();
    } catch (error) {
      logger.warn("PDF text extraction failed; falling back to raw decode", { error });
      return buffer
        .toString("utf-8")
        .replace(/[^\x20-\x7E\n\r]/g, "")
        .trim();
    }
  }

  return buffer.toString("utf-8").trim();
}
