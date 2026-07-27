// Best-effort client-side résumé / document scanner.
//
// Requires the "mammoth" package for .docx text extraction:
//   npm install mammoth
//
// PDF resumes are supported at a basic level via pdfjs-dist, if installed:
//   npm install pdfjs-dist
// If pdfjs-dist isn't installed, PDF files are simply skipped (the file is
// still attached and uploaded as normal — only the auto-fill scan is skipped).
//
// This never blocks or fails the actual upload — it only tries to prefill
// fields the applicant hasn't already typed in, and is always presented as
// "please double-check" rather than authoritative.

export interface ParsedResumeDetails {
  name?: string;
  email?: string;
  phone?: string;
  school?: string;
  course?: string;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PH_PHONE_RE = /(?:\+63|0)\d{9,10}/;
const SCHOOL_HINTS = /(university|college|institute|polytechnic|academy)/i;
const COURSE_HINTS = /(bachelor|bs\.?|ba\.?|associate|diploma)\s+of\s+[a-zA-Z ,&/-]+/i;

function extractDetailsFromText(text: string): ParsedResumeDetails {
  const details: ParsedResumeDetails = {};

  const emailMatch = text.match(EMAIL_RE);
  if (emailMatch) details.email = emailMatch[0];

  const phoneMatch = text.match(PH_PHONE_RE);
  if (phoneMatch) details.phone = phoneMatch[0];

  // Name heuristic: first non-empty line that looks like "First Last" (2-4
  // capitalized words, no digits/@ symbols) — résumés conventionally lead
  // with the candidate's name.
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    const words = line.split(/\s+/);
    if (
      words.length >= 2 && words.length <= 4 &&
      !/[@0-9]/.test(line) &&
      words.every(w => /^[A-Z][a-zA-Z.'-]*$/.test(w))
    ) {
      details.name = line;
      break;
    }
  }

  const schoolLine = lines.find(l => SCHOOL_HINTS.test(l));
  if (schoolLine) details.school = schoolLine.slice(0, 120);

  const courseMatch = text.match(COURSE_HINTS);
  if (courseMatch) details.course = courseMatch[0].trim();

  return details;
}

export async function parseResumeFile(file: File): Promise<ParsedResumeDetails | null> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return extractDetailsFromText(result.value || "");
    } catch (err) {
      console.warn("Résumé scan (docx) failed — is 'mammoth' installed?", err);
      return null;
    }
  }

  if (name.endsWith(".pdf")) {
    try {
      // Optional dependency — only used if the project has it installed.
      // @ts-ignore - optional dependency, may not be present in all projects
      const pdfjsLib = await import("pdfjs-dist");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      const pageCount = Math.min(pdf.numPages, 3); // first few pages is enough
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(" ") + "\n";
      }
      return extractDetailsFromText(text);
    } catch (err) {
      console.warn("Résumé scan (pdf) skipped — is 'pdfjs-dist' installed?", err);
      return null;
    }
  }

  // .doc (legacy binary Word format) isn't practically parseable in-browser
  // without a heavier dependency — skip the scan, keep the upload.
  return null;
}