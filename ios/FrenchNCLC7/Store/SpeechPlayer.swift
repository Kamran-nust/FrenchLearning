import AVFoundation
import Foundation

/// Plays the French pronunciation returned by the text-to-speech function (an MP3). One at a time.
final class SpeechPlayer {
    private var player: AVAudioPlayer?

    func play(_ audio: Data) {
        stop()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
            let p = try AVAudioPlayer(data: audio)
            p.prepareToPlay()
            p.play()
            player = p
        } catch {
            // Audio is a nicety; the card still works without it.
            player = nil
        }
    }

    func stop() {
        player?.stop()
        player = nil
    }
}
