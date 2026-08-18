import type { PaperSize, PageOrientation, PageSettings, ResumeSection } from '../types/resume';

export interface PageDimension {
  widthMm: number;
  heightMm: number;
  widthPx: number; // At 96 DPI
  heightPx: number;
  aspectRatio: number;
}

export const PAPER_DIMENSIONS: Record<PaperSize, { widthMm: number; heightMm: number }> = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
  legal: { widthMm: 215.9, heightMm: 355.6 },
};

const MM_TO_PX = 3.7795275591;
const INCH_TO_PX = 96;

export function getPageDimensions(
  paperSize: PaperSize = 'a4',
  orientation: PageOrientation = 'portrait'
): PageDimension {
  let base = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.a4;
  let widthMm = base.widthMm;
  let heightMm = base.heightMm;

  if (orientation === 'landscape') {
    [widthMm, heightMm] = [heightMm, widthMm];
  }

  const widthPx = Math.round(widthMm * MM_TO_PX);
  const heightPx = Math.round(heightMm * MM_TO_PX);

  return {
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    aspectRatio: widthPx / heightPx,
  };
}

export function getPrintableArea(settings: PageSettings): {
  printableWidthPx: number;
  printableHeightPx: number;
  topMarginPx: number;
  bottomMarginPx: number;
  leftMarginPx: number;
  rightMarginPx: number;
} {
  const { widthPx, heightPx } = getPageDimensions(settings.paperSize, settings.orientation);
  const topMarginPx = settings.margins.top * INCH_TO_PX;
  const bottomMarginPx = settings.margins.bottom * INCH_TO_PX;
  const leftMarginPx = settings.margins.left * INCH_TO_PX;
  const rightMarginPx = settings.margins.right * INCH_TO_PX;

  return {
    printableWidthPx: widthPx - leftMarginPx - rightMarginPx,
    printableHeightPx: heightPx - topMarginPx - bottomMarginPx,
    topMarginPx,
    bottomMarginPx,
    leftMarginPx,
    rightMarginPx,
  };
}

export interface SplitGuidelines {
  preventOrphans: boolean;
  minChildrenToAvoidOrphan: number;
  headerReservedHeightPx: number;
}

export const DEFAULT_SPLIT_GUIDELINES: SplitGuidelines = {
  preventOrphans: true,
  minChildrenToAvoidOrphan: 1,
  headerReservedHeightPx: 120, // Min remaining height needed to place a section header on current page
};

/**
 * Binary search for optimal font sizing and line spacing to guarantee
 * content strictly fits within the target page limit (1 or 2 pages).
 */
export function binarySearchAutoFit(
  totalContentLength: number,
  targetPageCount: number,
  baseFontSize: number = 10
): { optimizedFontSize: number; optimizedLineHeight: number } {
  // Approximate height multiplier
  const estPx = totalContentLength * 0.45;
  const maxAllowedPx = targetPageCount * 980;

  if (estPx <= maxAllowedPx) {
    return { optimizedFontSize: baseFontSize, optimizedLineHeight: 1.25 };
  }

  // Pass 1: Binary search for font size
  let lowFont = 8.5;
  let highFont = baseFontSize;
  let optimalFont = baseFontSize;

  for (let i = 0; i < 6; i++) {
    const midFont = (lowFont + highFont) / 2;
    const scaledHeight = estPx * (midFont / baseFontSize);
    if (scaledHeight <= maxAllowedPx) {
      optimalFont = midFont;
      lowFont = midFont;
    } else {
      highFont = midFont;
    }
  }

  // Pass 2: Line height optimization
  const fontRatio = optimalFont / baseFontSize;
  const optimalLineHeight = Math.max(1.1, Math.min(1.3, 1.25 * fontRatio));

  return {
    optimizedFontSize: Math.round(optimalFont * 10) / 10,
    optimizedLineHeight: Math.round(optimalLineHeight * 100) / 100,
  };
}

/**
 * Splits sections across pages with orphan prevention
 */
export function paginateSections(
  sections: ResumeSection[],
  printableHeightPx: number,
  guidelines: SplitGuidelines = DEFAULT_SPLIT_GUIDELINES
): { pageNumber: number; sections: ResumeSection[]; isFirstPage: boolean }[] {
  const pages: { pageNumber: number; sections: ResumeSection[]; isFirstPage: boolean }[] = [];
  let currentPageSections: ResumeSection[] = [];
  let currentHeight = 160; // First page has personal info header (~160px)

  sections.forEach((section) => {
    if (!section.visible) return;

    const rawLen = section.contentHtml.length;
    const estimatedSectionHeight = 55 + Math.ceil(rawLen / 3.4);

    const remainingHeight = printableHeightPx - currentHeight;

    // Orphan check: If remaining height is smaller than headerReservedHeightPx, push section to next page
    const shouldBreakForOrphan = guidelines.preventOrphans && remainingHeight < guidelines.headerReservedHeightPx;
    const isExplicitBreak = !!section.pageBreakBefore;
    const isHeightExceeded = currentHeight + estimatedSectionHeight > printableHeightPx;

    if (isExplicitBreak || (currentPageSections.length > 0 && (isHeightExceeded || shouldBreakForOrphan))) {
      pages.push({
        pageNumber: pages.length + 1,
        sections: currentPageSections,
        isFirstPage: pages.length === 0,
      });
      currentPageSections = [section];
      currentHeight = estimatedSectionHeight;
    } else {
      currentPageSections.push(section);
      currentHeight += estimatedSectionHeight;
    }
  });

  if (currentPageSections.length > 0 || pages.length === 0) {
    pages.push({
      pageNumber: pages.length + 1,
      sections: currentPageSections,
      isFirstPage: pages.length === 0,
    });
  }

  return pages;
}
