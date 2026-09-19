package com.frenchnclc7.app.data

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.io.ByteArrayOutputStream

/**
 * Draws the day-plan PDF on the phone: an A4, print-friendly white page with a blue header, a tick box
 * per section (so it works as a checklist) and page numbers. Plain text only, no links.
 */
object DayPlanPdf {
    private const val PAGE_W = 595 // A4 in points
    private const val PAGE_H = 842
    private const val MARGIN = 45f
    private const val BOTTOM = PAGE_H - 62f
    private const val CONTENT_W = PAGE_W - 2 * MARGIN

    private const val INK = 0xFF1B2233.toInt()
    private const val MUTED = 0xFF5B667A.toInt()
    private const val LINE = 0xFFD5DAE3.toInt()
    private const val BLUE = 0xFF2563EB.toInt()
    private const val RED = 0xFFC82832.toInt()
    private const val SHADE = 0xFFF4F6FA.toInt()

    /** Returns the finished PDF file's bytes. */
    fun render(content: DayPlanContent, dateText: String): ByteArray {
        // First pass only counts pages, so every footer can say "page 2 of 3".
        val pages = Drawer(content, dateText, null, 0).run()
        val doc = PdfDocument()
        Drawer(content, dateText, doc, pages).run()
        val out = ByteArrayOutputStream()
        doc.writeTo(out)
        doc.close()
        return out.toByteArray()
    }

    private fun paint(size: Float, color: Int, bold: Boolean = false) = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
        textSize = size
        this.color = color
        typeface = if (bold) Typeface.create(Typeface.DEFAULT, Typeface.BOLD) else Typeface.DEFAULT
    }

    private fun layout(text: String, paint: TextPaint, width: Float): StaticLayout =
        StaticLayout.Builder.obtain(text, 0, text.length, paint, width.toInt().coerceAtLeast(1))
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.25f)
            .build()

    /** Lays the content out page by page; draws it when [doc] is given. Returns the number of pages. */
    private class Drawer(
        val content: DayPlanContent,
        val dateText: String,
        val doc: PdfDocument?,
        val totalPages: Int,
    ) {
        private var page: PdfDocument.Page? = null
        private var canvas: Canvas? = null
        private var y = 0f
        private var pageNo = 0

        private fun startPage() {
            pageNo++
            if (doc != null) {
                page = doc.startPage(PdfDocument.PageInfo.Builder(PAGE_W, PAGE_H, pageNo).create())
                canvas = page!!.canvas
            }
            y = MARGIN + 6f
        }

        private fun endPage() {
            val c = canvas
            if (c != null) {
                val line = Paint().apply { color = LINE; strokeWidth = 0.6f }
                c.drawLine(MARGIN, PAGE_H - 42f, PAGE_W - MARGIN, PAGE_H - 42f, line)
                val small = paint(9f, MUTED)
                c.drawText("French NCLC 7 Study App", MARGIN, PAGE_H - 26f, small)
                val right = "Day ${content.day}  -  page $pageNo of $totalPages"
                c.drawText(right, PAGE_W - MARGIN - small.measureText(right), PAGE_H - 26f, small)
                doc!!.finishPage(page)
            }
            page = null
            canvas = null
        }

        private fun ensure(height: Float) {
            if (y + height > BOTTOM) {
                endPage()
                startPage()
            }
        }

        private fun header() {
            val c = canvas
            if (c != null) {
                c.drawRect(0f, 0f, PAGE_W.toFloat(), 86f, Paint().apply { color = BLUE })
                c.drawRect(0f, 86f, PAGE_W.toFloat(), 91f, Paint().apply { color = RED })
                c.drawText("Day ${content.day}", MARGIN, 45f, paint(28f, 0xFFFFFFFF.toInt(), bold = true))
                val sub = paint(11f, 0xFFFFFFFF.toInt())
                c.drawText("French NCLC 7 Preparation Plan  -  Week ${content.week}", MARGIN, 68f, sub)
                c.drawText(dateText, PAGE_W - MARGIN - sub.measureText(dateText), 68f, sub)
            }
            y = 122f
        }

        private fun heading(title: String, note: String?) {
            val c = canvas
            if (c != null) {
                val box = Paint().apply { color = MUTED; style = Paint.Style.STROKE; strokeWidth = 1f }
                c.drawRect(MARGIN, y - 11f, MARGIN + 13f, y + 2f, box)
                c.drawText(title, MARGIN + 22f, y, paint(15f, INK, bold = true))
                if (note != null) {
                    val p = paint(10f, MUTED)
                    c.drawText(note, PAGE_W - MARGIN - p.measureText(note), y, p)
                }
            }
            y += 8f
            canvas?.drawLine(MARGIN, y, PAGE_W - MARGIN, y, Paint().apply { color = LINE; strokeWidth = 0.6f })
            y += 18f
        }

        private fun drawLayout(l: StaticLayout, x: Float) {
            val c = canvas ?: return
            c.save()
            c.translate(x, y)
            l.draw(c)
            c.restore()
        }

        private fun paragraph(text: String) {
            val p = paint(11.5f, INK)
            val l = layout(text, p, CONTENT_W)
            // a long paragraph may run onto the next page, so it goes in one piece only if it fits
            ensure(minOf(l.height.toFloat(), 60f))
            var remaining = text
            while (remaining.isNotEmpty()) {
                val room = BOTTOM - y
                val whole = layout(remaining, p, CONTENT_W)
                if (whole.height <= room) {
                    drawLayout(whole, MARGIN)
                    y += whole.height + 4f
                    break
                }
                // take as many lines as fit on this page
                var lastLine = whole.getLineForVertical(room.toInt()) - 1
                if (lastLine < 0) lastLine = 0
                val cut = whole.getLineEnd(lastLine)
                val part = remaining.substring(0, cut).trimEnd()
                val partLayout = layout(part, p, CONTENT_W)
                drawLayout(partLayout, MARGIN)
                y += partLayout.height + 4f
                remaining = remaining.substring(cut).trimStart()
                if (remaining.isNotEmpty()) {
                    endPage()
                    startPage()
                }
            }
        }

        private fun cards(cards: List<AnkiCard>) {
            val colW = CONTENT_W / 2
            val fr = paint(11.5f, INK, bold = true)
            val en = paint(11.5f, MUTED)
            cards.forEachIndexed { i, card ->
                val lf = layout(card.f, fr, colW - 12f)
                val le = layout(card.e, en, colW - 8f)
                val h = maxOf(lf.height, le.height) + 9f
                ensure(h)
                canvas?.let {
                    if (i % 2 == 0) it.drawRect(MARGIN, y - 3f, PAGE_W - MARGIN, y - 3f + h, Paint().apply { color = SHADE })
                }
                drawLayout(lf, MARGIN + 6f)
                drawLayout(le, MARGIN + colW)
                y += h
            }
        }

        private fun items(items: List<String>) {
            val p = paint(11.5f, INK)
            for (item in items) {
                val l = layout(item, p, CONTENT_W - 16f)
                ensure(l.height + 6f)
                canvas?.drawCircle(MARGIN + 3f, y + 7f, 2.2f, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = BLUE })
                drawLayout(l, MARGIN + 14f)
                y += l.height + 6f
            }
        }

        fun run(): Int {
            startPage()
            header()
            for (s in content.sections) {
                ensure(70f)
                heading(s.title, s.note)
                s.text?.let { paragraph(it) }
                if (s.cards.isNotEmpty()) cards(s.cards)
                if (s.items.isNotEmpty()) items(s.items)
                y += 28f
            }
            endPage()
            return pageNo
        }
    }
}
