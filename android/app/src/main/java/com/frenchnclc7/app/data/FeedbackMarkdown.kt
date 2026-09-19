package com.frenchnclc7.app.data

/** A run of text with the same look. */
data class FeedbackPiece(val text: String, val bold: Boolean = false, val italic: Boolean = false)

/**
 * The AI writes its feedback with light markdown (**bold**, *italic*, and "* " bullets). On a phone that
 * would show as stray asterisks, so this turns it into pieces the screen can draw: bold and italic runs,
 * bullets as "•", and a stray asterisk that has no partner is left as it is.
 */
object FeedbackMarkdown {
    private val bulletStart = Regex("^\\s*[*\\-•]\\s+")

    /** The pieces for the whole text, with a "\n" piece between lines. */
    fun pieces(text: String): List<FeedbackPiece> {
        val out = mutableListOf<FeedbackPiece>()
        text.split("\n").forEachIndexed { index, rawLine ->
            if (index > 0) out.add(FeedbackPiece("\n"))
            val line = if (bulletStart.containsMatchIn(rawLine)) "• " + rawLine.replace(bulletStart, "") else rawLine
            out.addAll(linePieces(line))
        }
        return merge(out)
    }

    private fun linePieces(line: String): List<FeedbackPiece> {
        val out = mutableListOf<FeedbackPiece>()
        val buf = StringBuilder()
        var bold = false
        var italic = false
        fun flush() {
            if (buf.isNotEmpty()) {
                out.add(FeedbackPiece(buf.toString(), bold, italic))
                buf.setLength(0)
            }
        }
        var i = 0
        while (i < line.length) {
            when {
                line.startsWith("**", i) && (bold || line.indexOf("**", i + 2) >= 0) -> { flush(); bold = !bold; i += 2 }
                line[i] == '*' && !line.startsWith("**", i) && (italic || hasLoneStar(line, i + 1)) -> { flush(); italic = !italic; i += 1 }
                else -> { buf.append(line[i]); i++ }
            }
        }
        flush()
        return out
    }

    /** True if a single "*" (not part of "**") appears at or after [from]. */
    private fun hasLoneStar(line: String, from: Int): Boolean {
        var i = from
        while (i < line.length) {
            if (line.startsWith("**", i)) { i += 2; continue }
            if (line[i] == '*') return true
            i++
        }
        return false
    }

    private fun merge(pieces: List<FeedbackPiece>): List<FeedbackPiece> {
        val out = mutableListOf<FeedbackPiece>()
        for (p in pieces) {
            val last = out.lastOrNull()
            if (last != null && last.bold == p.bold && last.italic == p.italic) out[out.size - 1] = last.copy(text = last.text + p.text)
            else out.add(p)
        }
        return out
    }
}
