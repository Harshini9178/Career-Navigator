import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker to use the local Vite-bundled worker asset (no external CDN calls!)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Extracts plain text from an ArrayBuffer of a PDF file using pdfjs-dist.
 * Falls back to native stream decoding if the worker or standard parsing fails.
 */
export async function extractPdfTextFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  if (!arrayBuffer || arrayBuffer.byteLength < 8) {
    throw new Error('Could not extract text from this PDF file. The file is empty or corrupted.');
  }
  // Method 1: Try pdfjs-dist standard extraction with local worker
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });

    const pdf = await loadingTask.promise;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageStrings: string[] = [];
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          // If the item signals an end-of-line, append a newline, otherwise a space
          pageStrings.push(item.str + (item.hasEOL ? '\n' : ' '));
        }
      }

      const pageText = pageStrings.join('').trim();
      if (pageText) {
        textParts.push(pageText);
      }
    }

    const fullText = textParts.join('\n\n').trim();
    if (fullText.length >= 20) {
      return fullText;
    }
  } catch (err) {
    console.warn('pdfjs-dist primary extraction failed, trying direct stream parser fallback:', err);
  }

  // Method 2: Pure JS fallback text stream parser for text-based PDFs
  try {
    const fallbackText = extractTextFromPdfRawStreams(arrayBuffer);
    if (fallbackText && fallbackText.trim().length >= 20) {
      return fallbackText.trim();
    }
  } catch (err) {
    console.warn('Raw stream extraction fallback failed:', err);
  }

  throw new Error(
    'Could not extract text from this PDF file. The document may be a scanned image or password-protected. Please paste your resume text manually.'
  );
}

/**
 * Extracts text from PDF by scanning text objects (BT ... ET) and literal strings in PDF streams.
 */
function extractTextFromPdfRawStreams(buffer: ArrayBuffer): string {
  if (!buffer || buffer.byteLength === 0) return '';
  const bytes = new Uint8Array(buffer);
  let raw = '';
  // Convert buffer to string in chunks to avoid stack overflow
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    raw += String.fromCharCode.apply(null, slice as any);
  }

  const textBlocks: string[] = [];

  // Match text in parentheses within Tj / TJ operators
  // e.g. (Software Engineer) Tj or [(Hello) 10 (World)] TJ
  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(raw)) !== null) {
    const text = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\r/g, ' ')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ');
    if (text.trim()) {
      textBlocks.push(text);
    }
  }

  // Also match bracketed TJ arrays: [ (text1) 20 (text2) ] TJ
  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/gi;
  while ((match = arrayTjRegex.exec(raw)) !== null) {
    const inner = match[1];
    const innerMatches = inner.match(/\(([^)]+)\)/g);
    if (innerMatches) {
      const line = innerMatches
        .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
        .join(' ');
      if (line.trim()) {
        textBlocks.push(line);
      }
    }
  }

  return textBlocks.join(' ');
}
