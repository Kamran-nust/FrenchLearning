// Grammar chapter-excerpt PDF generator.
//
// The frontend sends { book: "A1-A2" | "A2-B1" | "B1-B2", chapters: number[] }
// - exactly what the Grammar module's per-day data already contains. This
// function looks up the real page range for those chapter(s) (BOOK_TOC,
// derived from each book's actual table of contents), fetches the source
// PDF from Supabase Storage, extracts just those pages, and returns a small
// standalone PDF containing only what that day needs.
//
// Storage expectation: a private bucket named "grammar-books" containing
// a1-a2.pdf, a2-b1.pdf, and b1-b2.pdf (see BOOK_TOC.file for exact names).

import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { corsHeaders } from "../_shared/cors.ts";
import { BOOK_TOC } from "./book_toc.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { book, chapters } = await req.json();

    if (!book || !BOOK_TOC[book]) {
      return new Response(JSON.stringify({ error: "Unknown book: " + book }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(chapters) || chapters.length === 0) {
      return new Response(JSON.stringify({ error: "Request must include a non-empty 'chapters' array." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bookInfo = BOOK_TOC[book];
    const matched = bookInfo.chapters.filter((c) => chapters.includes(c.chapter));
    if (matched.length === 0) {
      return new Response(JSON.stringify({ error: "No matching chapters found for " + book + ": " + chapters.join(",") }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge into one contiguous range covering every requested chapter -
    // in practice a day references one or two adjacent chapters.
    const startPage = Math.min(...matched.map((c) => c.startPage));
    const endPage = Math.max(...matched.map((c) => c.endPage));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("grammar-books")
      .download(bookInfo.file);

    if (downloadError || !fileBlob) {
      return new Response(JSON.stringify({ error: "Could not load source PDF", detail: downloadError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceBytes = new Uint8Array(await fileBlob.arrayBuffer());
    const sourceDoc = await PDFDocument.load(sourceBytes);
    const totalPages = sourceDoc.getPageCount();

    // Pages in BOOK_TOC are 1-indexed, human page numbers; pdf-lib is
    // 0-indexed. Clamp defensively in case a book's actual page count
    // differs slightly from what was recorded.
    const firstIdx = Math.max(0, startPage - 1);
    const lastIdx = Math.min(totalPages - 1, endPage - 1);
    const pageIndices: number[] = [];
    for (let i = firstIdx; i <= lastIdx; i++) pageIndices.push(i);

    const outDoc = await PDFDocument.create();
    const copiedPages = await outDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((p) => outDoc.addPage(p));
    const outBytes = await outDoc.save();

    return new Response(outBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="' + book + "-ch" + chapters.join("-") + '.pdf"',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected server error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
