package com.frenchnclc7.app.data

import android.content.Context
import android.media.MediaPlayer
import java.io.File

/** Plays the French pronunciation returned by the text-to-speech function (an MP3). One at a time. */
class SpeechPlayer(private val context: Context) {
    private var player: MediaPlayer? = null

    fun play(audio: ByteArray) {
        stop()
        try {
            val file = File(context.cacheDir, "speech.mp3")
            file.writeBytes(audio)
            val p = MediaPlayer()
            p.setDataSource(file.path)
            p.setOnCompletionListener {
                it.release()
                if (player === it) player = null
            }
            p.prepare()
            p.start()
            player = p
        } catch (e: Exception) {
            // Audio is a nicety; the card still works without it.
            player = null
        }
    }

    fun stop() {
        player?.let {
            try { it.stop() } catch (e: IllegalStateException) { /* already stopped */ }
            it.release()
        }
        player = null
    }
}
