import SwiftUI

/// The Writing section: read the day's task, write in French, get AI feedback (within your daily
/// allowance), mark the day complete. Entries and progress are saved in the same format as the web app.
struct WritingView: View {
    @EnvironmentObject var model: AppModel
    let w: WritingState

    var body: some View {
        let c = model.colors
        if w.loading {
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
        let done = w.progress.completed_days.count
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Button { model.goHome() } label: {
                    Text("‹").font(.system(size: 24)).foregroundColor(c.muted)
                }
                Text(w.phase == .finished ? "Writing plan complete" : "Day \(w.viewDay) of \(totalDays)")
                    .font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
                Text("🔥 \(w.progress.streak_count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(w.progress.streak_count > 0 ? c.text : c.muted)
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
        if w.loadFailed {
            notice("Couldn't load your saved progress and writing, so nothing will be saved this session (to protect what you already have). Check your connection and reopen Writing.", c)
        } else if w.saveFailed {
            notice("Your writing isn't saving right now — it may be lost if you close the app.", c)
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
        switch w.phase {
        case .finished:
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("All \(totalDays) days done").font(.system(size: 24)).foregroundColor(c.text)
                Text("Longest streak: \(w.progress.longest_streak) days. The writing module is finished.")
                    .font(.system(size: 14)).foregroundColor(c.muted).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)

        case .complete:
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("Day \(w.completion?.day ?? 0) done").font(.system(size: 24)).foregroundColor(c.text)
                Text("\(w.completion?.remaining ?? 0) days left · streak \(w.completion?.streak ?? 0)")
                    .font(.system(size: 14)).foregroundColor(c.muted)
                Button { model.continueWriting() } label: {
                    Text("Start next day").font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(c.accent).foregroundColor(c.onAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.top, 18)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)

        case .day:
            if let viewed = model.plan.days(.writing).first(where: { $0.day == w.viewDay }) {
                // A new text box (with its own text) for each day, and after a reset.
                WritingDayCard(w: w, viewed: viewed)
                    .id("\(w.viewDay)-\(w.resetCount)")
            } else {
                Text("Nothing to show.").font(.system(size: 14)).foregroundColor(c.muted).padding(24)
            }
        }
    }

    // MARK: Reset

    private func resetControl(_ c: AppColors) -> some View {
        VStack {
            if !w.confirmingReset {
                Button("↺ Reset progress") { model.askWritingReset(true) }
                    .font(.system(size: 12)).foregroundColor(c.muted)
            } else {
                HStack {
                    Text("Erase all saved progress and writing?").font(.system(size: 12)).foregroundColor(c.text)
                    Spacer()
                    Button("Yes, reset") { model.doWritingReset() }
                        .font(.system(size: 12, weight: .medium)).foregroundColor(c.danger)
                    Button("Cancel") { model.askWritingReset(false) }
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

/// One day's task, text box, word count, AI feedback and navigation.
private struct WritingDayCard: View {
    @EnvironmentObject var model: AppModel
    let w: WritingState
    let viewed: DayContent
    // The text box owns what is typed; the model keeps a copy and saves it a second after typing stops.
    @State private var draft: String

    init(w: WritingState, viewed: DayContent) {
        self.w = w
        self.viewed = viewed
        _draft = State(initialValue: w.entries[w.viewDay]?.text ?? "")
    }

    var body: some View {
        let c = model.colors
        let target = WritingLogic.extractWordTarget(viewed.text)
        let count = WritingLogic.countWords(draft)
        let feedbackText = w.entries[w.viewDay]?.feedback
        let pending = w.viewDay == w.progress.current_day && w.progress.current_day <= totalDays

        VStack(alignment: .leading, spacing: 0) {
            if w.viewDay != w.progress.current_day {
                Text("Your current day is Day \(min(w.progress.current_day, totalDays)) — you can still edit this entry.")
                    .font(.system(size: 12)).foregroundColor(c.muted).padding(.bottom, 8)
            }

            VStack(alignment: .leading, spacing: 14) {
                Text(viewed.text)
                    .font(.system(size: 15)).lineSpacing(4).multilineTextAlignment(.center)
                    .foregroundColor(c.text).frame(maxWidth: .infinity)

                VStack(alignment: .leading, spacing: 6) {
                    ZStack(alignment: .topLeading) {
                        TextEditor(text: $draft)
                            .scrollContentBackground(.hidden)
                            .padding(6)
                            .frame(minHeight: 170)
                            .foregroundColor(c.text)
                        if draft.isEmpty {
                            Text("Écrivez ici…").foregroundColor(c.muted)
                                .padding(.horizontal, 12).padding(.vertical, 14).allowsHitTesting(false)
                        }
                    }
                    .background(c.bg)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(c.border))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .onChange(of: draft) { newValue in model.writingDraftChanged(newValue) }

                    HStack {
                        Text(target != nil ? "\(count) / \(target!) words" : "\(count) words")
                            .font(.system(size: 12)).foregroundColor(c.muted)
                        Spacer()
                        Text(w.saveState == .saving ? "Saving…" : (w.saveState == .saved ? "Saved" : ""))
                            .font(.system(size: 12)).foregroundColor(c.muted)
                    }
                }

                // The countdown refreshes every 30 seconds.
                TimelineView(.periodic(from: Date(), by: 30)) { context in
                    feedbackControls(c, now: context.date)
                }

                if let feedbackText, !feedbackText.isEmpty, w.feedback != .loading {
                    Divider().background(c.border)
                    Text("✦ Feedback").font(.system(size: 12, weight: .medium)).foregroundColor(c.gold)
                    Text(FeedbackFormat.attributed(feedbackText)).font(.system(size: 14)).lineSpacing(4).foregroundColor(c.text)
                        .textSelection(.enabled)
                }
            }
            .padding(20)
            .background(c.card)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            HStack {
                Button("‹ Previous") { model.writingMove(-1) }
                    .disabled(w.viewDay <= 1)
                    .foregroundColor(w.viewDay > 1 ? c.link : c.muted)
                Spacer()
                Button("Next ›") { model.writingMove(1) }
                    .disabled(w.viewDay >= totalDays)
                    .foregroundColor(w.viewDay < totalDays ? c.link : c.muted)
            }
            .font(.system(size: 14))
            .padding(.top, 14)

            if pending {
                Button { model.completeWritingDay() } label: {
                    Text("Mark day complete").font(.system(size: 14, weight: .medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(c.accent).foregroundColor(c.onAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.top, 8)
            }
        }
        .padding(.horizontal, 20)
    }

    /// The "Get feedback" button, the allowance line, and any error.
    @ViewBuilder
    private func feedbackControls(_ c: AppColors, now: Date) -> some View {
        let limitReached = w.quota?.limitReached(now: now) == true
        let canAsk = !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && w.feedback != .loading && !limitReached

        VStack(spacing: 10) {
            Button { model.getWritingFeedback() } label: {
                Text(w.feedback == .loading ? "✦ Getting feedback…" : "✦ Get feedback")
                    .font(.system(size: 14, weight: .medium)).foregroundColor(c.gold)
                    .frame(maxWidth: .infinity).padding(.vertical, 10)
                    .background(c.accentSoft.opacity(canAsk ? 1 : 0.5))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .disabled(!canAsk)

            if limitReached, let quota = w.quota {
                Text("Daily AI feedback limit reached. Next one available in \(WritingLogic.formatWait(quota.secondsUntilReset(now: now))).")
                    .font(.system(size: 12)).foregroundColor(c.muted).multilineTextAlignment(.center)
            } else if let quota = w.quota, let limit = quota.limit {
                Text("\(quota.remaining ?? 0) of \(limit) AI feedback\(limit == 1 ? "" : "s") left")
                    .font(.system(size: 12)).foregroundColor(c.muted).multilineTextAlignment(.center)
            }

            if w.feedback == .busy {
                Text("The AI is busy right now. Try again in a minute — that didn't use any of your allowance.")
                    .font(.system(size: 12)).foregroundColor(c.danger).multilineTextAlignment(.center)
            } else if w.feedback == .failed {
                Text("Couldn't get feedback — check your connection and try again.")
                    .font(.system(size: 12)).foregroundColor(c.danger).multilineTextAlignment(.center)
            }
        }
    }
}
