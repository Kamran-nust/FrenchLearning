// Builds the one-day study plan PDF in the browser (jsPDF is loaded only when
// a download is actually requested, so it never weighs down the main bundle).
// Print-friendly and theme-independent: white page, fixed blue/red accents.

const INK = [27, 34, 51];
const MUTED = [91, 102, 122];
const LINE = [213, 218, 227];
const BLUE = [37, 99, 235];
const RED = [200, 40, 50];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 20;

// The built-in PDF fonts only cover Latin-1 plus a few typographic marks
// (enough for French). Anything else is replaced so it can't come out garbled.
const KEEP = /[ -~ -ÿŒœ–—‘’“”•…]/;
export function pdfSafe(text) {
  return Array.from(String(text == null ? "" : text))
    .map((ch) => (KEEP.test(ch) ? ch : ch === "→" ? "->" : /\s/.test(ch) ? " " : "?"))
    .join("");
}

export async function buildDayPlanPdf({ day, week, sections }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const ensure = (h) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = MARGIN + 4;
    }
  };

  // Header
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(0, 0, PAGE_W, 30, "F");
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 30, PAGE_W, 1.6, "F");
  doc.setFont("helvetica", "bold").setFontSize(21).setTextColor(255, 255, 255);
  doc.text("Day " + day, MARGIN, 15);
  doc.setFont("helvetica", "normal").setFontSize(10.5);
  doc.text("French NCLC 7 Preparation Plan  -  Week " + week, MARGIN, 23);
  const stamp = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  doc.setFontSize(9);
  doc.text(pdfSafe(stamp), PAGE_W - MARGIN, 23, { align: "right" });
  y = 42;

  for (const s of sections) {
    ensure(24);
    // Section heading with a tick box, so the page works as a checklist
    doc.setDrawColor(MUTED[0], MUTED[1], MUTED[2]).setLineWidth(0.4);
    doc.rect(MARGIN, y - 4, 4.6, 4.6);
    doc.setFont("helvetica", "bold").setFontSize(13);
    setColor(INK);
    doc.text(pdfSafe(s.title), MARGIN + 8, y);
    if (s.note) {
      doc.setFont("helvetica", "normal").setFontSize(9);
      setColor(MUTED);
      doc.text(pdfSafe(s.note), PAGE_W - MARGIN, y, { align: "right" });
    }
    y += 2.2;
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]).setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;

    if (s.text) {
      doc.setFont("helvetica", "normal").setFontSize(10.5);
      setColor(INK);
      for (const line of doc.splitTextToSize(pdfSafe(s.text), CONTENT_W)) {
        ensure(5.6);
        doc.text(line, MARGIN, y);
        y += 5.4;
      }
    }

    if (s.cards) {
      const colW = CONTENT_W / 2;
      s.cards.forEach((c, i) => {
        doc.setFont("helvetica", "bold").setFontSize(10.5);
        const fr = doc.splitTextToSize(pdfSafe(c.f), colW - 6);
        doc.setFont("helvetica", "normal");
        const en = doc.splitTextToSize(pdfSafe(c.e), colW - 4);
        const h = Math.max(fr.length, en.length) * 5 + 2.4;
        ensure(h);
        if (i % 2 === 0) {
          doc.setFillColor(244, 246, 250);
          doc.rect(MARGIN, y - 4.2, CONTENT_W, h, "F");
        }
        doc.setFont("helvetica", "bold").setFontSize(10.5);
        setColor(INK);
        doc.text(fr, MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        setColor(MUTED);
        doc.text(en, MARGIN + colW, y);
        y += h;
      });
    }

    if (s.links) {
      doc.setFont("helvetica", "normal").setFontSize(10.5);
      for (const l of s.links) {
        const lines = doc.splitTextToSize(pdfSafe(l.label), CONTENT_W - 6);
        ensure(lines.length * 5.2 + 2);
        doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.circle(MARGIN + 1.2, y - 1.3, 0.7, "F");
        lines.forEach((line, i) => {
          if (l.url) {
            setColor(BLUE);
            doc.textWithLink(line, MARGIN + 5, y + i * 5.2, { url: l.url });
          } else {
            setColor(INK);
            doc.text(line, MARGIN + 5, y + i * 5.2);
          }
        });
        y += lines.length * 5.2 + 1.6;
      }
    }
    y += 7;
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]).setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    doc.setFont("helvetica", "normal").setFontSize(8.5);
    setColor(MUTED);
    doc.text("French NCLC 7 Study App", MARGIN, PAGE_H - 9);
    doc.text("Day " + day + "  -  page " + p + " of " + pages, PAGE_W - MARGIN, PAGE_H - 9, { align: "right" });
  }

  doc.save("French-NCLC7-Day-" + day + ".pdf");
}
