/**
 * Sanitizes candidate name or resume title into a clean, safe filename.
 * Example: "Harshini RB" -> "Harshini_RB_Resume.pdf"
 */
export function generateResumeFilename(fullName?: string, resumeTitle?: string): string {
  const nameCandidate = (fullName && fullName.trim()) || '';
  const titleCandidate = (resumeTitle && resumeTitle.trim()) || '';

  if (nameCandidate) {
    const strippedName = nameCandidate.replace(/\.pdf$/i, '');
    const cleanName = strippedName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    return cleanName ? `${cleanName}_Resume.pdf` : 'Candidate_Resume.pdf';
  }

  if (titleCandidate) {
    const strippedTitle = titleCandidate.replace(/\.pdf$/i, '');
    const cleanTitle = strippedTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const base = cleanTitle || 'Career_Navigator_Resume';
    return `${base}.pdf`;
  }

  return 'Career_Navigator_Resume.pdf';
}

export interface ExportPdfOptions {
  filename?: string;
  onProgress?: (step: string) => void;
}

/**
 * Exports the live HTML resume preview to a high-fidelity, printable A4 PDF.
 * Supports multi-page splitting, avoids blank pages, and normalizes zoom scale.
 */
export async function exportLiveResumeToPdf(
  targetElement: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  if (!targetElement) {
    throw new Error('Resume preview element was not found in the DOM.');
  }

  const filename = options.filename || 'Resume.pdf';
  options.onProgress?.('Preparing document and loading fonts...');

  // Wait for custom fonts to finish rendering
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Font loading error is non-fatal
    }
  }

  options.onProgress?.('Loading PDF rendering engine...');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);

  options.onProgress?.('Rendering high-resolution A4 preview...');

  // Standard A4 dimensions
  const a4WidthMm = 210;
  const a4HeightMm = 297;

  // Render element to high-res canvas (scale: 2 for 300dpi-like crispness)
  const canvas = await html2canvas(targetElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794, // Standard 210mm at 96dpi
    onclone: (_clonedDoc, clonedElement) => {
      // 1. Hide on-screen UI guide lines, page boundary markers, and no-print tools
      const noPrints = clonedElement.querySelectorAll('.no-print, [data-no-print="true"]');
      noPrints.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // 2. Normalize transforms and zoom level so PDF is always 100% true A4 scale
      clonedElement.style.transform = 'none';
      clonedElement.style.maxWidth = '210mm';
      clonedElement.style.width = '210mm';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.border = 'none';
      clonedElement.style.borderRadius = '0';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.backgroundColor = '#ffffff';

      // 3. Ensure parent containers in the clone do not restrict height or overflow
      let parent = clonedElement.parentElement;
      while (parent && parent !== _clonedDoc.body) {
        parent.style.transform = 'none';
        parent.style.maxHeight = 'none';
        parent.style.overflow = 'visible';
        parent = parent.parentElement;
      }
    }
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas rendering produced an empty image.');
  }

  options.onProgress?.('Generating PDF pages...');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Calculate scaled height in mm
  const totalHeightMm = (canvas.height * a4WidthMm) / canvas.width;

  // Single-page check (with 3mm tolerance to prevent accidental 2nd page on tiny sub-pixel overflows)
  if (totalHeightMm <= a4HeightMm + 3) {
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMm, Math.min(totalHeightMm, a4HeightMm));
  } else {
    // Multi-page: Slice the canvas into exact A4 height chunks
    const pageCanvasHeightPx = Math.floor(canvas.width * (a4HeightMm / a4WidthMm));
    let renderedHeightPx = 0;
    let pageCount = 0;

    while (renderedHeightPx < canvas.height) {
      const sourceY = renderedHeightPx;
      const remainingHeightPx = canvas.height - sourceY;
      const chunkHeightPx = Math.min(pageCanvasHeightPx, remainingHeightPx);

      // Ignore negligible residual whitespace (< 15px) at the very bottom
      if (chunkHeightPx < 15 && pageCount > 0) {
        break;
      }

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageCanvasHeightPx;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, sourceY, canvas.width, chunkHeightPx,
          0, 0, canvas.width, chunkHeightPx
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);

      if (pageCount > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(pageImgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm);

      renderedHeightPx += pageCanvasHeightPx;
      pageCount++;
    }
  }

  options.onProgress?.('Initiating download...');
  pdf.save(filename);
}
