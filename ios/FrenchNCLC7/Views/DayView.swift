import SwiftUI

/// Read-only view of one day of one section, with previous/next and a way to switch section.
struct DayView: View {
    @EnvironmentObject var model: AppModel
    let section: PlanSection
    let day: Int

    var body: some View {
        let c = model.colors
        let days = model.plan.days(section)
        let current = days.first { $0.day == min(max(day, 1), totalDays) }

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    Button("‹ Home") { model.goHome() }
                        .font(.system(size: 13)).foregroundColor(c.link)
                    if let current {
                        Text("\(section.title) · Day \(current.day) of \(totalDays) · Week \(current.week)")
                            .font(.system(size: 12)).foregroundColor(c.muted)
                    }
                }

                // Switch between the five sections for the same day
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(PlanSection.allCases) { s in
                            let selected = s == section
                            Button(s.title) { if s == .anki { model.browseDay(day) } else { model.open(s, day: day) } }
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(selected ? c.onAccent : c.link)
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .background(selected ? c.accent : c.accentSoft)
                                .clipShape(Capsule())
                        }
                    }
                }

                if let current {
                    VStack(spacing: 12) {
                        if let badge = current.badge {
                            Text(badge).font(.system(size: 11, weight: .medium)).foregroundColor(c.link)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(c.accentSoft).clipShape(Capsule())
                        }
                        if section == .anki {
                            Text(current.text).font(.system(size: 12)).foregroundColor(c.muted)
                            ForEach(current.cards, id: \.i) { card in
                                HStack(alignment: .top) {
                                    Text(card.f).font(.system(size: 15, weight: .medium)).foregroundColor(c.text)
                                    Spacer(minLength: 12)
                                    Text(card.e).font(.system(size: 14)).foregroundColor(c.muted).multilineTextAlignment(.trailing)
                                }
                            }
                        } else {
                            Text(current.text).font(.system(size: 15)).lineSpacing(4).foregroundColor(c.text)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(20)
                    .background(c.card)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    Button { model.open(.anki, day: current.day) } label: {
                        Text("Practice this day's flashcards").font(.system(size: 14, weight: .medium))
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(c.accent).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    HStack {
                        Button("‹ Previous") { model.browseDay(current.day - 1) }
                            .disabled(current.day <= 1)
                            .foregroundColor(current.day > 1 ? c.link : c.muted)
                        Spacer()
                        Button("Next ›") { model.browseDay(current.day + 1) }
                            .disabled(current.day >= totalDays)
                            .foregroundColor(current.day < totalDays ? c.link : c.muted)
                    }
                    .font(.system(size: 14))
                }
            }
            .padding(20)
        }
    }
}
