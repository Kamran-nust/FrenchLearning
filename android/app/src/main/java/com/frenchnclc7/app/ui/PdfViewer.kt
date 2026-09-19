package com.frenchnclc7.app.ui

import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.PdfViewer
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/** Renders a PDF page by page (only the pages being looked at are drawn, one at a time). */
private class PdfPages(path: String) {
    private val descriptor = ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
    private val renderer = PdfRenderer(descriptor)
    private val lock = Mutex() // PdfRenderer can only draw one page at a time
    val pageCount: Int = renderer.pageCount

    /** Width divided by height of each page, measured once up front. */
    val aspects: List<Float> = (0 until pageCount).map { i ->
        val page = renderer.openPage(i)
        try { page.width.toFloat() / page.height } finally { page.close() }
    }

    suspend fun render(index: Int, widthPx: Int): Bitmap = lock.withLock {
        withContext(Dispatchers.IO) {
            val page = renderer.openPage(index)
            try {
                val height = (widthPx.toFloat() / page.width * page.height).toInt()
                val bitmap = Bitmap.createBitmap(widthPx, height, Bitmap.Config.ARGB_8888)
                bitmap.eraseColor(AndroidColor.WHITE)
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                bitmap
            } finally {
                page.close()
            }
        }
    }

    fun close() {
        renderer.close()
        descriptor.close()
    }
}

/** Reads a grammar-pages PDF inside the app, with a Back button and simple zoom (1x, 1.5x, 2x). */
@Composable
fun PdfViewerScreen(viewer: PdfViewer, onBack: () -> Unit) {
    val c = LocalColors.current

    val pages = remember(viewer.path) { runCatching { PdfPages(viewer.path) }.getOrNull() }
    DisposableEffect(pages) { onDispose { pages?.close() } }

    var zoom by remember { mutableStateOf(1f) }
    val density = LocalDensity.current
    val screenWidthDp = LocalConfiguration.current.screenWidthDp
    val pageWidthDp = (screenWidthDp * zoom).dp
    // Draw at the largest zoom so the text stays sharp when zoomed in.
    val renderWidthPx = with(density) { (screenWidthDp * 2f).dp.roundToPx() }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("‹ Back", color = c.text, fontSize = 14.sp, modifier = Modifier.clickable(onClick = onBack).padding(end = 12.dp, top = 4.dp, bottom = 4.dp))
            Text(viewer.label, color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f))
            ZoomButton("−", enabled = zoom > 1f) { zoom = if (zoom > 1.5f) 1.5f else 1f }
            Spacer(Modifier.width(6.dp))
            ZoomButton("+", enabled = zoom < 2f) { zoom = if (zoom < 1.5f) 1.5f else 2f }
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(c.border))

        if (pages == null || pages.pageCount == 0) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Couldn't open these pages.", color = c.danger, fontSize = 14.sp)
            }
        } else {
            Box(Modifier.fillMaxSize().horizontalScroll(rememberScrollState())) {
                LazyColumn(Modifier.width(pageWidthDp)) {
                    items((0 until pages.pageCount).toList()) { index ->
                        val bitmap by produceState<Bitmap?>(null, pages, index) { value = pages.render(index, renderWidthPx) }
                        val ratio = pages.aspects[index]
                        Box(Modifier.fillMaxWidth().padding(bottom = 8.dp).aspectRatio(ratio).background(androidx.compose.ui.graphics.Color.White)) {
                            bitmap?.let {
                                Image(it.asImageBitmap(), contentDescription = "Page ${index + 1}", modifier = Modifier.fillMaxSize())
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ZoomButton(label: String, enabled: Boolean, onClick: () -> Unit) {
    val c = LocalColors.current
    Text(
        label, color = if (enabled) c.text else c.muted, fontSize = 16.sp, fontWeight = FontWeight.Medium,
        modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(c.card).border(androidx.compose.foundation.BorderStroke(1.dp, c.border), RoundedCornerShape(8.dp))
            .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 14.dp, vertical = 4.dp),
    )
}
