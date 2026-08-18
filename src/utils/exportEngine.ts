import type { ResumeData } from '../types/resume';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export function exportToPrint() {
  window.print();
}

export function exportToJson(resume: ResumeData, filename = 'resume.json') {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resume, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function exportToDocx(resume: ResumeData, filename = 'resume.docx') {
  const children: Paragraph[] = [];
  const pInfo = resume?.personalInfo || {
    fullName: 'YOUR NAME',
    jobTitle: 'Professional',
    phone: '',
    email: '',
    location: '',
    linkedin: '',
  };

  // Header: Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: (pInfo.fullName || 'YOUR NAME').toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: 'Arial',
        }),
      ],
    })
  );

  // Job Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: pInfo.jobTitle || 'Professional',
          size: 24, // 12pt
          color: '4B5563',
          font: 'Arial',
        }),
      ],
    })
  );

  const isVal = (v?: string): boolean => {
    if (!v || typeof v !== 'string') return false;
    const s = v.trim().toLowerCase();
    return s.length > 0 && !['null', 'undefined', 'none', 'n/a', 'nil', 'false'].includes(s);
  };

  // Contact Line
  const contactParts = [
    pInfo.phone,
    pInfo.email,
    pInfo.location,
    pInfo.linkedin,
    pInfo.github,
    pInfo.website,
  ].filter(isVal).map((v) => v!.trim());

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: contactParts.join('  |  '),
          size: 20, // 10pt
          color: '6B7280',
          font: 'Arial',
        }),
      ],
    })
  );

  // Sections
  resume.sections.forEach(sec => {
    if (!sec.visible) return;

    // Section Header
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: sec.title.toUpperCase(),
            bold: true,
            size: 22,
            font: 'Arial',
            color: '1E293B',
          }),
        ],
      })
    );

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sec.contentHtml;

    const listItems = tempDiv.querySelectorAll('li');
    if (listItems.length > 0) {
      listItems.forEach(li => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: li.textContent || '',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );
      });
    } else {
      const paragraphs = tempDiv.querySelectorAll('p');
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: p.textContent || '',
                  size: 20,
                  font: 'Arial',
                }),
              ],
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: tempDiv.textContent || '',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
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
