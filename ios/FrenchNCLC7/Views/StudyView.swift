import SwiftUI

/// The day-by-day study screen for Grammar, Kwiziq, TV5MONDE and Writing: read the day's task, mark it
/// complete, keep a streak. Progress is saved to the same place as the web app.
struct StudyView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.openURL) private var openURL
    let study: StudyState

    var body: some View {
        let c = model.colors
        if let viewer = study.pdfViewer {
            PdfReaderView(info: viewer) { model.closeGrammarPdf() }
        } else if study.loading {
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
        let done = study.progress.completed_days.count
        let finished = study.phase == .finished
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Button { model.goHome() } label: {
                    Text("‹").font(.system(size: 24)).foregroundColor(c.muted)
                }
                Text(finished ? study.section.title + " plan complete"
                              : "\(study.section.title) · Day \(study.viewDay) of \(totalDays)")
                    .font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
                Text("🔥 \(study.progress.streak_count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(study.progress.streak_count > 0 ? c.text : c.muted)
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

    // MARK: Warnings about saving

    @ViewBuilder
    private func notices(_ c: AppColors) -> some View {
        if study.loadFailed {
            notice("Couldn't load your saved progress, so nothing will be saved this session (to protect what you already have). Check your connection and reopen this section.", c)
        } else if study.saveFailed {
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
        switch study.phase {
        case .finished:
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("All \(totalDays) days done").font(.system(size: 24)).foregroundColor(c.text)
                Text("Longest streak: \(study.progress.longest_streak) days. The \(study.section.title) module is finished.")
                    .font(.system(size: 14)).foregroundColor(c.muted).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)

        case .complete:
            VStack(spacing: 6) {
                Text("✓").font(.system(size: 40)).foregroundColor(c.success)
                Text("Day \(study.completion?.day ?? 0) done").font(.system(size: 24)).foregroundColor(c.text)
                Text("\(study.completion?.remaining ?? 0) days left · streak \(study.completion?.streak ?? 0)")
                    .font(.system(size: 14)).foregroundColor(c.muted)
                primaryButton("Start next day", c) { model.continueNext() }.padding(.top, 18)
            }
            .frame(maxWidth: .infinity).padding(.horizontal, 24).padding(.vertical, 48)

        case .day:
            if let viewed = model.plan.days(study.section).first(where: { $0.day == study.viewDay }) {
                dayCard(viewed, c)
            } else {
                Text("Nothing to show.").font(.system(size: 14)).foregroundColor(c.muted).padding(24)
            }
        }
    }

    private func dayCard(_ viewed: DayContent, _ c: AppColors) -> some View {
        let chips = LessonChips.chips(study.section, viewed)
        let pending = viewed.day == study.progress.current_day && study.progress.current_day <= totalDays
        return VStack(alignment: .leading, spacing: 0) {
            if viewed.day != study.progress.current_day {
                Text("Reading only — your current day is Day \(min(study.progress.current_day, totalDays))")
                    .font(.system(size: 12)).foregroundColor(c.muted).padding(.bottom, 8)
            }

            VStack(spacing: 14) {
                if let badge = viewed.badge {
                    Text(badge).font(.system(size: 11, weight: .medium)).foregroundColor(c.link)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(c.accentSoft).clipShape(Capsule())
                }
                Text(LessonChips.body(study.section, viewed))
                    .font(.system(size: 15)).lineSpacing(4).multilineTextAlignment(.center).foregroundColor(c.text)

                // Kwiziq / TV5MONDE lesson chips. Premium and super open the real lesson page when one is known
                // (📖); every other chip, and every chip for free accounts, opens a Google search (🔍).
                ForEach(chips, id: \.self) { chip in
                    let direct = LessonLinkLogic.hasDirect(chip, study.lessonLinks)
                    let icon = study.section == .tv5 ? "📺" : (direct ? "📖" : "🔍")
                    Button {
                        if let url = LessonLinkLogic.href(study.section, chip, study.lessonLinks) { openURL(url) }
                    } label: {
                        HStack {
                            Text("\(icon)  \(chip)").font(.system(size: 12)).foregroundColor(c.link).lineLimit(3)
                            Spacer()
                            Text("↗").font(.system(size: 12)).foregroundColor(c.link)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                // Extra lessons for this day (premium and super)
                ForEach(LessonLinkLogic.extrasFor(viewed.day, study.lessonLinks), id: \.url) { extra in
                    Button {
                        if let url = URL(string: extra.url) { openURL(url) }
                    } label: {
                        HStack {
                            Text("📖  " + extra.label).font(.system(size: 12)).foregroundColor(c.link).lineLimit(3)
                            Spacer()
                            Text("↗").font(.system(size: 12)).foregroundColor(c.link)
                        }
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(20)
            .background(c.card)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
            .clipShape(RoundedRectangle(cornerRadius: 16))

            HStack {
                Button("‹ Previous") { model.studyMove(-1) }
                    .disabled(viewed.day <= 1)
                    .foregroundColor(viewed.day > 1 ? c.link : c.muted)
                Spacer()
                Button("Next ›") { model.studyMove(1) }
                    .disabled(viewed.day >= totalDays)
                    .foregroundColor(viewed.day < totalDays ? c.link : c.muted)
            }
            .font(.system(size: 14))
            .padding(.top, 14)

            // Grammar: the book chapters for the day, as PDF pages (premium and super)
            if study.section == .grammar && !viewed.chapters.isEmpty {
                Group {
                    if model.tier.atLeast(.premium) {
                        VStack(spacing: 8) {
                            ForEach(viewed.chapters, id: \.book) { group in
                                Button { model.openGrammarPdf(group) } label: {
                                    Text(study.pdfLoading ? "Loading pages…" : "📖 Open " + group.label)
                                        .font(.system(size: 12, weight: .medium)).foregroundColor(c.link)
                                        .frame(maxWidth: .infinity).padding(.vertical, 11)
                                        .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .disabled(study.pdfLoading)
                            }
                            if let error = study.pdfError {
                                Text(error).font(.system(size: 12)).foregroundColor(c.danger).multilineTextAlignment(.center)
                            }
                        }
                    } else {
                        Text("🔒 Grammar chapter PDFs are a Premium feature")
                            .font(.system(size: 12)).foregroundColor(c.muted)
                            .frame(maxWidth: .infinity).padding(.vertical, 11)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                    }
                }
                .padding(.top, 12)
            }

            if pending {
                primaryButton("Mark day complete", c) { model.completeDay() }.padding(.top, 8)
            }
        }
        .padding(.horizontal, 20)
    }

    private func primaryButton(_ title: String, _ c: AppColors, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title).font(.system(size: 14, weight: .medium))
                .frame(maxWidth: .infinity).padding(.vertical, 14)
                .background(c.accent).foregroundColor(c.onAccent)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    // MARK: Reset

    private func resetControl(_ c: AppColors) -> some View {
        VStack {
            if !study.confirmingReset {
                Button("↺ Reset progress") { model.askReset(true) }
                    .font(.system(size: 12)).foregroundColor(c.muted)
            } else {
                HStack {
                    Text("Erase all saved progress?").font(.system(size: 12)).foregroundColor(c.text)
                    Spacer()
                    Button("Yes, reset") { model.doReset() }
                        .font(.system(size: 12, weight: .medium)).foregroundColor(c.danger)
                    Button("Cancel") { model.askReset(false) }
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
