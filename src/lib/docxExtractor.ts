/**
 * DOCX Text Extraction Utility
 *
 * DOCX files are standard OpenXML ZIP packages containing `word/document.xml`.
 * This extractor parses the ZIP structure without heavy external runtime dependencies,
 * extracting text from `<w:t>` nodes and preserving paragraph breaks `<w:p>`.
 * Works across both modern browser environments (using DecompressionStream)
 * and Node environments (using zlib).
 */

export async function extractDocxTextFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);

  // Validate ZIP header (PK\x03\x04)
  if (bytes.length < 30 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error('Invalid DOCX file format. The file is not a valid OpenXML document.');
  }

  let offset = 0;
  let documentXmlBytes: Uint8Array | null = null;

  while (offset + 30 <= bytes.length) {
    // Check local file header signature 0x04034b50
    if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4b || bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
      break;
    }

    const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize = (
      bytes[offset + 18] |
      (bytes[offset + 19] << 8) |
      (bytes[offset + 20] << 16) |
      (bytes[offset + 21] << 24)
    ) >>> 0;
    const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

    const fileNameStart = offset + 30;
    const fileNameEnd = fileNameStart + fileNameLength;
    if (fileNameEnd > bytes.length) break;

    const fileNameBytes = bytes.subarray(fileNameStart, fileNameEnd);
    const fileName = String.fromCharCode.apply(null, fileNameBytes as any);

    const dataStart = fileNameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === 'word/document.xml') {
      const compressedData = bytes.subarray(dataStart, dataEnd);

      if (compressionMethod === 0) {
        // Stored (no compression)
        documentXmlBytes = compressedData;
      } else if (compressionMethod === 8) {
        // Deflated
        documentXmlBytes = await decompressDeflateRaw(compressedData);
      }
      break;
    }

    offset = dataEnd;
  }

  if (!documentXmlBytes) {
    // Fallback: look for XML text patterns directly in the raw buffer
    const fallbackText = extractTextFromRawXml(bytes);
    if (fallbackText && fallbackText.trim().length >= 25) {
      return fallbackText.trim();
    }
    throw new Error('Could not find document content in this DOCX file.');
  }

  // Decode UTF-8 XML string
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const xmlString = decoder.decode(documentXmlBytes);

  return parseWordDocumentXml(xmlString);
}

/**
 * Decompresses raw DEFLATE bytes using native browser DecompressionStream or Node zlib.
 */
async function decompressDeflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // Browser environment with DecompressionStream
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(data);
      writer.close();
      const response = new Response(ds.readable);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      // If deflate-raw is not accepted, try standard deflate
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(data);
      writer.close();
      const response = new Response(ds.readable);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
  }

  // Node environment with zlib
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const zlib = await import('zlib');
    return new Promise((resolve, reject) => {
      zlib.inflateRaw(data, (err, result) => {
        if (err) {
          zlib.inflate(data, (err2, result2) => {
            if (err2) reject(err2);
            else resolve(new Uint8Array(result2));
          });
        } else {
          resolve(new Uint8Array(result));
        }
      });
    });
  }

  throw new Error('No decompression provider available in current environment.');
}

/**
 * Extracts plain text from word/document.xml preserving paragraphs and spaces.
 */
export function parseWordDocumentXml(xml: string): string {
  // Replace paragraph endings <w:p> with newlines
  const paragraphs: string[] = [];

  // Match all <w:p ...>...</w:p>
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const pContent = pMatch[1];
    const textPieces: string[] = [];

    // Match all <w:t ...>text</w:t> or <w:t>text</w:t>
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi;
    let tMatch: RegExpExecArray | null;

    while ((tMatch = tRegex.exec(pContent)) !== null) {
      const text = tMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      textPieces.push(text);
    }

    const paragraphText = textPieces.join('');
    if (paragraphText.trim()) {
      paragraphs.push(paragraphText.trim());
    }
  }

  return paragraphs.join('\n\n').trim();
}

/**
 * Fallback to scan raw buffer for XML text segments when zip header is irregular.
 */
function extractTextFromRawXml(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(bytes);

  const textPieces: string[] = [];
  const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi;
  let tMatch: RegExpExecArray | null;

  while ((tMatch = tRegex.exec(raw)) !== null) {
    const text = tMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    if (text.trim()) {
      textPieces.push(text);
    }
  }

  return textPieces.join(' ').trim();
}
