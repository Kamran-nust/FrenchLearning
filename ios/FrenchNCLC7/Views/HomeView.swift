import SwiftUI

struct HomeView: View {
    @EnvironmentObject var model: AppModel
    @State private var jump = ""

    var body: some View {
        let c = model.colors
        VStack(spacing: 0) {
            // Top strip: who is signed in, their tier, log out
            HStack(spacing: 12) {
                Text("Signed in as " + (model.username ?? model.session?.email ?? ""))
                    .font(.system(size: 12)).foregroundColor(c.muted).lineLimit(1)
                Spacer()
                if model.tier == .free {
                    Button { model.openPlans() } label: {
                        Text("Go Premium").font(.system(size: 11, weight: .medium)).foregroundColor(c.onAccent)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(c.accent).clipShape(Capsule())
                    }
                }
                Text(model.tier.label)
                    .font(.system(size: 11, weight: .medium)).foregroundColor(c.link)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(c.accentSoft).clipShape(Capsule())
                Button("Log out") { model.signOut() }
                    .font(.system(size: 12)).foregroundColor(c.link)
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(c.card)

            ScrollView {
                VStack(spacing: 8) {
                    // Theme picker
                    HStack(spacing: 10) {
                        ForEach(Themes.order, id: \.self) { id in
                            let t = Themes.get(id)
                            let selected = model.themeId == id
                            Circle().fill(t.bg)
                                .frame(width: 28, height: 28)
                                .overlay(Circle().stroke(selected ? c.accent : c.border, lineWidth: selected ? 3 : 1))
                                .overlay(Circle().fill(t.accent).frame(width: 10, height: 10))
                                .onTapGesture { model.setTheme(id) }
                                .accessibilityLabel(t.label)
                        }
                    }
                    .padding(.top, 8).padding(.bottom, 16)

                    Text("A DAILY LANGUAGE JOURNEY")
                        .font(.system(size: 11, weight: .semibold)).tracking(1).foregroundColor(c.gold)
                    Text("French NCLC 7\nPreparation Plan")
                        .font(.system(size: 30, weight: .semibold, design: .serif))
                        .multilineTextAlignment(.center).foregroundColor(c.text)
                    Text("From absolute beginner to confident exam readiness")
                        .font(.system(size: 13)).foregroundColor(c.muted).multilineTextAlignment(.center)

                    // "Day N complete" - shown only once Day 1 is complete in every section
                    if let done = model.completedThrough {
                        VStack(spacing: 6) {
                            if done > 0 {
                                Text("Day \(done) complete")
                                    .font(.system(size: 12, weight: .medium)).foregroundColor(c.text)
                                    .padding(.horizontal, 12).padding(.vertical, 6)
                                    .background(c.accentSoft).clipShape(Capsule())
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(c.border)
                                    Capsule().fill(c.accent)
                                        .frame(width: geo.size.width * CGFloat(done) / CGFloat(totalDays))
                                }
                            }
                            .frame(width: 200, height: 4)
                            Text("\(done) / \(totalDays) days").font(.system(size: 12)).foregroundColor(c.muted)
                        }
                        .padding(.top, 12)
                    }

                    VStack(spacing: 10) {
                        ForEach(PlanSection.allCases) { section in
                            Button { model.open(section) } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(section.title).font(.system(size: 15, weight: .medium)).foregroundColor(c.text)
                                        Text(section.tagline).font(.system(size: 12)).foregroundColor(c.muted)
                                    }
                                    Spacer()
                                    Text("›").font(.system(size: 22)).foregroundColor(c.accent)
                                }
                                .padding(16)
                                .background(c.card)
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.accent))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            }
                        }
                    }
                    .padding(.top, 20)

                    // Jump to a day (opens the Anki cards for that day; the day screen switches section)
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Jump to a day (1–\(totalDays))").font(.system(size: 12)).foregroundColor(c.muted)
                        HStack(spacing: 8) {
                            TextField("Day", text: $jump)
                                .keyboardType(.numberPad)
                                .padding(12).background(c.card)
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
                                .foregroundColor(c.text)
                            Button("Go") {
                                if let n = Int(jump), (1...totalDays).contains(n) { model.browseDay(n) }
                            }
                            .fontWeight(.medium)
                            .padding(.horizontal, 20).padding(.vertical, 12)
                            .background(c.accent).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.top, 16)

                    // Word Bank: the person's own words (Premium and Super; free accounts see it locked)
                    Button { model.openWordBank() } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("📚 Word Bank").font(.system(size: 15, weight: .medium)).foregroundColor(c.text)
                                Text("Your own words, mixed into Anki reviews").font(.system(size: 12)).foregroundColor(c.muted)
                            }
                            Spacer()
                            Text(model.tier.atLeast(.premium) ? "›" : "🔒 Premium")
                                .font(.system(size: model.tier.atLeast(.premium) ? 22 : 12))
                                .foregroundColor(model.tier.atLeast(.premium) ? c.accent : c.muted)
                        }
                        .padding(16)
                        .background(c.card)
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.accent))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .padding(.top, 14)

                    Button { model.openPlans() } label: {
                        Text("Plans and pricing").font(.system(size: 13, weight: .medium)).foregroundColor(c.text)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                    }
                    .padding(.top, 14)

                    // Super users only: manage everyone's tier (the database refuses anyone else too)
                    if model.tier == .superUser {
                        Button { model.openAdmin() } label: {
                            Text("👥 Admin: manage users").font(.system(size: 13, weight: .medium)).foregroundColor(c.muted)
                                .frame(maxWidth: .infinity).padding(.vertical, 14)
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                        }
                        .padding(.top, 14)
                    }

                    Text("~90 minutes a day · Listening · Speaking · Reading · Writing")
                        .font(.system(size: 11)).foregroundColor(c.muted).multilineTextAlignment(.center)
                        .padding(.top, 20)

                    // Not offered to Super accounts (the server refuses them too)
                    if AccountLogic.canDelete(model.tier) {
                        Button("Delete my account") { model.openDeleteAccount() }
                            .font(.system(size: 12)).foregroundColor(c.muted).padding(.top, 14)
                    }
                }
                .padding(.horizontal, 20).padding(.bottom, 30)
            }
        }
    }
}
