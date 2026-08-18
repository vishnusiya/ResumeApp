import type { ResumeData } from '../types/resume';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageOrientation,
} from 'docx';

export function exportToPrint() {
  window.print();
}

export function exportToJson(resume: ResumeData, filename = 'resume.json') {
  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(resume, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function cleanHex(colorStr?: string, defaultHex = '1E293B'): string {
  if (!colorStr) return defaultHex;
  const clean = colorStr.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length === 6) return clean.toUpperCase();
  if (clean.length === 3) {
    return clean
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase();
  }
  return defaultHex;
}

function parseInlineNodeToRuns(
  node: Node,
  fontFamily: string,
  baseSizeHalfPt: number,
  textColorHex: string,
  bold = false,
  italics = false
): TextRun[] {
  const runs: TextRun[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text) {
      runs.push(
        new TextRun({
          text,
          font: fontFamily,
          size: baseSizeHalfPt,
          color: textColorHex,
          bold,
          italics,
        })
      );
    }
    return runs;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();

    if (tagName === 'BR') {
      runs.push(new TextRun({ break: 1 }));
      return runs;
    }

    const isBold =
      bold ||
      ['STRONG', 'B', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName) ||
      el.style.fontWeight === 'bold' ||
      parseInt(el.style.fontWeight, 10) >= 600;

    const isItalic =
      italics || ['EM', 'I'].includes(tagName) || el.style.fontStyle === 'italic';

    for (let i = 0; i < el.childNodes.length; i++) {
      runs.push(
        ...parseInlineNodeToRuns(
          el.childNodes[i],
          fontFamily,
          baseSizeHalfPt,
          textColorHex,
          isBold,
          isItalic
        )
      );
    }
  }

  return runs;
}

function parseHtmlToDocxParagraphs(
  html: string,
  fontFamily: string,
  baseSizeHalfPt: number,
  textColorHex: string,
  lineHeight: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const container = document.createElement('div');
  container.innerHTML = html;

  const lineSpacingDxa = Math.round(lineHeight * 240);

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 30, after: 50, line: lineSpacingDxa },
            children: [
              new TextRun({
                text,
                font: fontFamily,
                size: baseSizeHalfPt,
                color: textColorHex,
              }),
            ],
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (tag === 'UL' || tag === 'OL') {
      const lis = el.querySelectorAll(':scope > li');
      if (lis.length > 0) {
        lis.forEach((li) => {
          const runs: TextRun[] = [];
          for (let i = 0; i < li.childNodes.length; i++) {
            runs.push(
              ...parseInlineNodeToRuns(
                li.childNodes[i],
                fontFamily,
                baseSizeHalfPt,
                textColorHex
              )
            );
          }
          if (runs.length > 0) {
            paragraphs.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 30, line: lineSpacingDxa },
                children: runs,
              })
            );
          }
        });
      } else {
        const directLis = el.getElementsByTagName('li');
        Array.from(directLis).forEach((li) => {
          const runs: TextRun[] = [];
          for (let i = 0; i < li.childNodes.length; i++) {
            runs.push(
              ...parseInlineNodeToRuns(
                li.childNodes[i],
                fontFamily,
                baseSizeHalfPt,
                textColorHex
              )
            );
          }
          if (runs.length > 0) {
            paragraphs.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 30, line: lineSpacingDxa },
                children: runs,
              })
            );
          }
        });
      }
      return;
    }

    if (tag === 'LI') {
      const runs: TextRun[] = [];
      for (let i = 0; i < el.childNodes.length; i++) {
        runs.push(
          ...parseInlineNodeToRuns(
            el.childNodes[i],
            fontFamily,
            baseSizeHalfPt,
            textColorHex
          )
        );
      }
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 20, after: 30, line: lineSpacingDxa },
            children: runs,
          })
        );
      }
      return;
    }

    // Check if element contains nested block structures (like div containing p and ul)
    const hasChildBlocks = Array.from(el.children).some((c) =>
      ['P', 'UL', 'OL', 'DIV', 'TABLE', 'H1', 'H2', 'H3', 'H4'].includes(
        c.tagName.toUpperCase()
      )
    );

    if (hasChildBlocks) {
      Array.from(el.childNodes).forEach((child) => processNode(child));
      return;
    }

    // Standard paragraph or styled text block
    const runs: TextRun[] = [];
    for (let i = 0; i < el.childNodes.length; i++) {
      runs.push(
        ...parseInlineNodeToRuns(
          el.childNodes[i],
          fontFamily,
          baseSizeHalfPt,
          textColorHex
        )
      );
    }

    if (runs.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 30, after: 50, line: lineSpacingDxa },
          children: runs,
        })
      );
    }
  };

  Array.from(container.childNodes).forEach((child) => processNode(child));
  return paragraphs;
}

export async function exportToDocx(resume: ResumeData, filename = 'resume.docx') {
  const children: Paragraph[] = [];
  const pInfo = resume?.personalInfo || {
    fullName: 'YOUR FULL NAME',
    jobTitle: 'Professional Title',
    phone: '',
    email: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  };

  const pageSettings = resume.pageSettings || {
    paperSize: 'a4',
    orientation: 'portrait',
    margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
    typography: {
      fontFamily: 'Inter',
      fontSize: 10,
      lineHeight: 1.25,
      headingScale: 1.15,
    },
    theme: {
      template: 'modern',
      primaryColor: '#2563EB',
      accentColor: '#0D9488',
      textColor: '#1E293B',
      headingColor: '#2563EB',
    },
  };

  const fontFamily = pageSettings.typography?.fontFamily || 'Inter';
  const baseFontSizePt = pageSettings.typography?.fontSize || 10;
  const baseSizeHalfPt = Math.round(baseFontSizePt * 2);
  const lineHeight = pageSettings.typography?.lineHeight || 1.25;
  const headingScale = pageSettings.typography?.headingScale || 1.15;

  const headingColorHex = cleanHex(
    pageSettings.theme?.headingColor || pageSettings.theme?.primaryColor,
    '2563EB'
  );
  const primaryColorHex = cleanHex(pageSettings.theme?.primaryColor, '2563EB');
  const textColorHex = cleanHex(pageSettings.theme?.textColor, '1E293B');
  const mutedColorHex = '475569';
  const dividerColorHex = 'CBD5E1';

  // 1. Header: Candidate Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 30 },
      children: [
        new TextRun({
          text: (pInfo.fullName || 'YOUR FULL NAME').toUpperCase(),
          bold: true,
          size: Math.round(baseFontSizePt * 1.65 * 2),
          font: fontFamily,
          color: headingColorHex,
        }),
      ],
    })
  );

  // 2. Header: Professional Job Title
  if (pInfo.jobTitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: pInfo.jobTitle,
            size: Math.round(baseFontSizePt * 1.1 * 2),
            font: fontFamily,
            color: mutedColorHex,
          }),
        ],
      })
    );
  }

  // 3. Header: Contact Info Line with Bottom Border Divider
  const isVal = (v?: string): boolean => {
    if (!v || typeof v !== 'string') return false;
    const s = v.trim().toLowerCase();
    return s.length > 0 && !['null', 'undefined', 'none', 'n/a', 'nil', 'false'].includes(s);
  };

  const contactParts = [
    pInfo.phone,
    pInfo.email,
    pInfo.location,
    pInfo.linkedin,
    pInfo.github,
    pInfo.website,
  ]
    .filter(isVal)
    .map((v) => v!.trim());

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 10, after: 160 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: dividerColorHex,
            space: 6,
          },
        },
        children: [
          new TextRun({
            text: contactParts.join('   |   '),
            size: Math.round(baseFontSizePt * 0.88 * 2),
            font: fontFamily,
            color: mutedColorHex,
          }),
        ],
      })
    );
  }

  // 4. Resume Sections
  (resume.sections || []).forEach((sec) => {
    if (!sec.visible) return;

    // Section Title with Theme-Colored Underline
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 60 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 8,
            color: primaryColorHex,
            space: 4,
          },
        },
        children: [
          new TextRun({
            text: sec.title.toUpperCase(),
            bold: true,
            size: Math.round(baseFontSizePt * headingScale * 2),
            font: fontFamily,
            color: primaryColorHex,
          }),
        ],
      })
    );

    // Section Content
    const secParagraphs = parseHtmlToDocxParagraphs(
      sec.contentHtml,
      fontFamily,
      baseSizeHalfPt,
      textColorHex,
      lineHeight
    );
    children.push(...secParagraphs);
  });

  // Page Margins (Inches to dxa: 1 in = 1440 dxa)
  const margins = pageSettings.margins || { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 };
  const topDxa = Math.round(margins.top * 1440);
  const bottomDxa = Math.round(margins.bottom * 1440);
  const leftDxa = Math.round(margins.left * 1440);
  const rightDxa = Math.round(margins.right * 1440);

  // Paper Size & Orientation
  let pageWidthDxa = 11906; // A4 width
  let pageHeightDxa = 16838; // A4 height

  if (pageSettings.paperSize === 'letter') {
    pageWidthDxa = 12240;
    pageHeightDxa = 15840;
  } else if (pageSettings.paperSize === 'legal') {
    pageWidthDxa = 12240;
    pageHeightDxa = 20160;
  }

  const isLandscape = pageSettings.orientation === 'landscape';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: isLandscape ? pageHeightDxa : pageWidthDxa,
              height: isLandscape ? pageWidthDxa : pageHeightDxa,
              orientation: isLandscape
                ? PageOrientation.LANDSCAPE
                : PageOrientation.PORTRAIT,
            },
            margin: {
              top: topDxa,
              bottom: bottomDxa,
              left: leftDxa,
              right: rightDxa,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
