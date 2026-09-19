import SwiftUI

/// The Anki flashcards: today's new words (French to English) followed by review words from earlier
/// days (random direction), with pronunciation, "hard" flags, a streak and bonus practice rounds.
struct AnkiView: View {
    @EnvironmentObject var model: AppModel
    let a: AnkiState

    var body: some View {
        let c = model.colors
        if a.loading {
            Text("Loading your session…").font(.system(size: 14)).foregroundColor(c.muted)
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header(c)
                    notices(c)
                    content(c)
                    resetControl(c)
                }
            }
        }
    }

    // MARK: Header: back, where you are, streak, progress bar

    private func header(_ c: AppColors) -> some View {
        let done = a.progress.completed_days.count
        let title: String
        if a.phase == .finished {
            title = "Plan complete"
        } else if a.practice, let session = a.session {
            title = "Practicing Day \(session.dayNumber) of \(totalDays)"
        } else {
            title = "Day \(min(a.progress.current_day, totalDays)) of \(totalDays)"
        }
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Button { model.goHome() } label: {
                    Text("‹").font(.system(size: 24)).foregroundColor(c.muted)
                }
                Text(title).font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
                Text("🔥 \(a.progress.streak_count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(a.progress.streak_count > 0 ? c.text : c.muted)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(c.accentSoft).clipShape(Capsule())
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(c.border)
                    Capsule().fill(c.accent).frame(width: geo.size.width * CGFloat(done) / CGFloat(totalDays))
                }
            }
            .frame(height: 4)
            Text("\(done) days done · \(totalDays - done) to go").font(.system(size: 12)).foregroundColor(c.muted)
        }
        .padding(.horizontal, 20).padding(.top, 16).padding(.bottom, 8)
    }

    @ViewBuilder
    private func notices(_ c: AppColors) -> some View {
        if a.loadFailed {
            notice("Couldn't load your saved progress, so nothing will be saved this session (to protect what you already have). Check your connection and reopen Anki.", c)
        } else if a.saveFailed {
            notice("Progress isn't saving right now — it may be lost if you close the app.", c)
        }
    }

    private func notice(_ text: String, _ c: AppColors) -> some View {
        Text(text).font(.system(size: 12)).foregroundColor(c.hard)
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(c.hard.opacity(0.14)).clipShape(RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal, 20).padding(.vertical, 4)
    }

    // MARK: Body of the screen for each phase

    @ViewBuilder
    private func content(_ c: AppColors) -> some View {
        if a.phase == .finished {
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("All \(totalDays) days done").font(.system(size: 24)).foregroundColor(c.text)
                Text("Longest streak: \(a.progress.longest_streak) days. The vocabulary module is finished — nice work.")
                    .font(.system(size: 14)).foregroundColor(c.muted).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)
        } else if a.phase == .complete, let completion = a.completion {
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("Day \(completion.day) done").font(.system(size: 24)).foregroundColor(c.text)
                Text("\(completion.remaining) days left · streak \(completion.streak)")
                    .font(.system(size: 14)).foregroundColor(c.muted)
                Button { model.ankiContinueToNextDay() } label: {
                    Text("Start next day").font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(c.accent).foregroundColor(c.onAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.top, 18)
                Button { model.ankiPracticeAgain(completion.day) } label: {
                    Text("Practice this day again").font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .foregroundColor(c.muted)
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                }
                .padding(.top, 6)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)
        } else if let session = a.session, session.items.indices.contains(a.index) {
            // A fresh card view for every card, so its audio starts when the card appears.
            AnkiCardView(a: a, item: session.items[a.index], total: session.items.count, sessionDay: session.dayNumber)
                .id(session.items[a.index].key)
        } else {
            Text("Nothing to show.").font(.system(size: 14)).foregroundColor(c.muted).padding(24)
        }
    }

    // MARK: Reset

    private func resetControl(_ c: AppColors) -> some View {
        VStack {
            if !a.confirmingReset {
                Button("↺ Reset progress") { model.ankiAskReset(true) }
                    .font(.system(size: 12)).foregroundColor(c.muted)
            } else {
                HStack {
                    Text("Erase all saved progress?").font(.system(size: 12)).foregroundColor(c.text)
                    Spacer()
                    Button("Yes, reset") { model.ankiDoReset() }
                        .font(.system(size: 12, weight: .medium)).foregroundColor(c.danger)
                    Button("Cancel") { model.ankiAskReset(false) }
                        .font(.system(size: 12)).foregroundColor(c.muted)
                }
                .padding(12)
                .background(c.card)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20).padding(.vertical, 24)
    }
}

/// One flashcard: the prompt, a flag for "hard", the answer once shown, and the pronunciation.
private struct AnkiCardView: View {
    @EnvironmentObject var model: AppModel
    let a: AnkiState
    let item: AnkiItem
    let total: Int
    let sessionDay: Int

    var body: some View {
        let c = model.colors
        let isHard = a.hard.contains(item.cardId)
        let prompt = item.dir == .ef ? item.english : item.french
        let answer = item.dir == .ef ? item.french : item.english
        let isLast = a.index + 1 >= total
        let isFirst = a.index == 0
        let isReview = item.sourceDay != sessionDay

        VStack(spacing: 0) {
            HStack {
                Text(item.dir == .ef ? "English → French" : "French → English")
                    .font(.system(size: 11)).foregroundColor(c.link)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(c.accentSoft).clipShape(Capsule())
                Spacer()
                Text("\(a.index + 1) / \(total)" + (isReview ? " · review" : " · new"))
                    .font(.system(size: 12)).foregroundColor(c.muted)
            }
            .padding(.horizontal, 4).padding(.bottom, 8)

            HStack(spacing: 10) {
                roundButton("‹", enabled: !isFirst, filled: false, c) { model.ankiPrevious() }

                ZStack(alignment: .topTrailing) {
                    VStack(spacing: 0) {
                        Text(prompt).font(.system(size: 30, design: .serif)).foregroundColor(c.text)
                            .multilineTextAlignment(.center)
                        if item.dir == .fe && !a.revealed {
                            Button { model.speak(item.french) } label: {
                                Text("🔊 Replay").font(.system(size: 12)).foregroundColor(c.muted)
                            }
                            .padding(.top, 8)
                        }
                        if a.revealed {
                            Divider().background(c.border).padding(.vertical, 20)
                            HStack(spacing: 10) {
                                Text(answer).font(.system(size: 24, design: .serif)).foregroundColor(c.text)
                                    .multilineTextAlignment(.center)
                                if item.dir == .ef {
                                    Button { model.speak(item.french) } label: { Text("🔊").font(.system(size: 16)) }
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 20).padding(.vertical, 48)

                    Button { model.ankiToggleHard(item.cardId) } label: {
                        Text("⚑").font(.system(size: 20)).foregroundColor(isHard ? c.hard : c.muted)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(isHard ? c.hard.opacity(0.14) : Color.clear).clipShape(Circle())
                    }
                    .padding(8)
                    .accessibilityLabel("Mark as hard")
                }
                .background(c.card)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                .clipShape(RoundedRectangle(cornerRadius: 16))

                roundButton(isLast ? "✓" : "›", enabled: true, filled: true, c) { model.ankiNext() }
            }

            Button { model.ankiShowAnswer() } label: {
                Text(a.revealed ? "Answer shown" : "Show answer")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(a.revealed ? c.muted : c.text)
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
            }
            .disabled(a.revealed)
            .padding(.top, 16)
        }
        .padding(.horizontal, 20)
        // French as the prompt is spoken as soon as the card appears; when English is the prompt,
        // the French answer is spoken once it is revealed.
        .onAppear { if item.dir == .fe { model.speak(item.french) } }
        .onChange(of: a.revealed) { revealed in
            if revealed && item.dir == .ef { model.speak(item.french) }
        }
    }

    private func roundButton(_ label: String, enabled: Bool, filled: Bool, _ c: AppColors, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label).font(.system(size: 18))
                .foregroundColor(filled ? c.onAccent : (enabled ? c.text : c.muted))
                .frame(width: 40, height: 40)
                .background(filled ? c.accent : c.card)
                .overlay(Circle().stroke(filled ? c.accent : c.border))
                .clipShape(Circle())
        }
        .disabled(!enabled)
    }
}
