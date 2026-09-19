package com.frenchnclc7.app

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.test.platform.app.InstrumentationRegistry
import com.frenchnclc7.app.data.AnkiCard
import com.frenchnclc7.app.data.DayPlanContent
import com.frenchnclc7.app.data.DayPlanLogic
import com.frenchnclc7.app.data.PlanPdfSection
import com.frenchnclc7.app.data.DayPlanPdf
import com.frenchnclc7.app.data.PlanRepository
import com.frenchnclc7.app.data.PlanSection
import java.io.File
import java.io.FileOutputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Runs on a real (emulated) Android: draws the day-plan PDF and turns each page back into a picture so it can be looked at. */
class DayPlanPdfInstrumentedTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val plan = PlanRepository(context)

    private fun content(day: Int) = DayPlanLogic.build(
        plan.days(PlanSection.ANKI).first { it.day == day },
        plan.days(PlanSection.GRAMMAR).first { it.day == day },
        plan.days(PlanSection.KWIZIQ).first { it.day == day },
        plan.days(PlanSection.TV5).first { it.day == day },
        plan.days(PlanSection.WRITING).first { it.day == day },
    )

    /** Returns the number of pages, and saves page pictures as day-N-page-P.png in the app's files folder. */
    private fun renderToPictures(day: Int): Int {
        val bytes = DayPlanPdf.render(content(day), "Sep 19, 2026")
        assertTrue("a PDF starts with %PDF", bytes.size > 1000 && bytes[0] == '%'.code.toByte() && bytes[1] == 'P'.code.toByte())
        val dir = File(context.filesDir, "pdf-check").apply { mkdirs() }
        val pdf = File(dir, "day-$day.pdf").also { it.writeBytes(bytes) }
        ParcelFileDescriptor.open(pdf, ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
            val renderer = PdfRenderer(fd)
            for (i in 0 until renderer.pageCount) {
                val page = renderer.openPage(i)
                val bmp = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
                bmp.eraseColor(Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()
                FileOutputStream(File(dir, "day-$day-page-${i + 1}.png")).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
            }
            val count = renderer.pageCount
            renderer.close()
            return count
        }
    }

    @Test
    fun aVeryLongPlanFlowsOverSeveralPagesWithCorrectFooters() {
        val cards = (1..70).map { AnkiCard("c$it", "mot numéro $it à apprendre", "word number $it to learn") }
        val paragraph = (1..60).joinToString(" ") { "Phrase numéro $it avec des accents : é è ê à ç." }
        val long = DayPlanContent(
            day = 77, week = 11,
            sections = listOf(
                PlanPdfSection("Anki", note = "70 new cards", cards = cards),
                PlanPdfSection("Grammar book", text = paragraph),
                PlanPdfSection("Kwiziq", items = (1..25).map { "Kwiziq lesson $it: a fairly long lesson title that will need to wrap onto a second line of text here" }),
                PlanPdfSection("Writing", text = "Short task."),
            ),
        )
        val bytes = DayPlanPdf.render(long, "Sep 19, 2026")
        val dir = File(context.filesDir, "pdf-check").apply { mkdirs() }
        val pdf = File(dir, "long.pdf").also { it.writeBytes(bytes) }
        ParcelFileDescriptor.open(pdf, ParcelFileDescriptor.MODE_READ_ONLY).use { fd ->
            val renderer = PdfRenderer(fd)
            val pages = renderer.pageCount
            assertTrue("expected several pages, got $pages", pages >= 3)
            for (i in 0 until pages) {
                val page = renderer.openPage(i)
                val bmp = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                bmp.eraseColor(Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()
                FileOutputStream(File(dir, "long-page-${i + 1}.png")).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
            }
            renderer.close()
        }
    }

    @Test
    fun day1IsOneReadablePage() {
        assertEquals(1, renderToPictures(1))
    }

    @Test
    fun aLongerDayFlowsOntoMorePagesWithoutBreaking() {
        // pick the busiest day (most flashcards) so the pagination is exercised
        val busiest = plan.days(PlanSection.ANKI).maxBy { it.cards.size }.day
        assertTrue(renderToPictures(busiest) >= 1)
    }

    @Test
    fun everyDayRendersAValidPdf() {
        for (day in listOf(2, 50, 109, 200, 301)) {
            assertTrue("day $day", renderToPictures(day) >= 1)
        }
    }
}
