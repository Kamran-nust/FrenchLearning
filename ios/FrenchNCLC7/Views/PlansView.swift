import SwiftUI

/// Free versus Premium, with a monthly/yearly choice. Buying goes through Apple's In-App Purchase (not connected yet).
struct PlansView: View {
    @EnvironmentObject var model: AppModel
    let p: PlansState

    var body: some View {
        let c = model.colors
        let yearly = p.period == .yearly
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Button { model.goHome() } label: { Text("‹").font(.system(size: 24)).foregroundColor(c.muted) }
                    Text("Plans").font(.system(size: 12)).foregroundColor(c.muted)
                }

                Text("Study every day for NCLC 7, with less friction")
                    .font(.system(size: 22, design: .serif)).foregroundColor(c.text)
                    .multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(.top, 8)
                Text("Cancel anytime. Your progress always stays with you.")
                    .font(.system(size: 12)).foregroundColor(c.muted).frame(maxWidth: .infinity)

                // Monthly | Yearly
                HStack(spacing: 0) {
                    ForEach(BillingPeriod.allCases, id: \.self) { period in
                        let on = p.period == period
                        Button { model.setPlanPeriod(period) } label: {
                            Text(period.label).font(.system(size: 13))
                                .foregroundColor(on ? c.bg : c.muted)
                                .padding(.horizontal, 18).padding(.vertical, 8)
                                .background(on ? c.text : Color.clear).clipShape(Capsule())
                        }
                    }
                }
                .padding(3).background(c.card)
                .overlay(Capsule().stroke(c.border))
                .clipShape(Capsule())
                .frame(maxWidth: .infinity)

                freeCard(c)
                premiumCard(c, yearly: yearly)
                comparison(c)

                Text("Subscriptions are billed through your Apple ID. We never see your card details.")
                    .font(.system(size: 11)).foregroundColor(c.muted).multilineTextAlignment(.center).frame(maxWidth: .infinity)
            }
            .padding(20)
        }
    }

    private func freeCard(_ c: AppColors) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Free").font(.system(size: 12)).foregroundColor(c.muted)
            Text("$0").font(.system(size: 26, weight: .medium)).foregroundColor(c.text)
            Text("forever").font(.system(size: 12)).foregroundColor(c.muted)
            Text("The full 301-day plan, all five sections.").font(.system(size: 12)).foregroundColor(c.muted).padding(.top, 6)
            if model.tier == .free { pill("Your current plan", c).padding(.top, 10) }
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(16)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func premiumCard(_ c: AppColors, yearly: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text("Premium").font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
                if yearly {
                    Text("Best value").font(.system(size: 12)).foregroundColor(c.link)
                        .padding(.horizontal, 10).padding(.vertical, 3)
                        .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text(p.period.price).font(.system(size: 26, weight: .medium)).foregroundColor(c.text)
                Text(p.period.per).font(.system(size: 12)).foregroundColor(c.muted)
            }
            Text(PlansLogic.note(p.period)).font(.system(size: 12)).foregroundColor(c.link)
            Text("Real lesson links, PDFs, and more AI feedback.").font(.system(size: 12)).foregroundColor(c.muted).padding(.top, 6)

            Group {
                switch model.tier {
                case .free:
                    Button { model.upgrade() } label: {
                        Text(p.busy ? "Opening the App Store…" : "Upgrade to Premium").font(.system(size: 14, weight: .medium))
                            .frame(maxWidth: .infinity).padding(.vertical, 13)
                            .background(c.accent).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(p.busy)
                case .premium:
                    VStack(spacing: 8) {
                        pill("Your current plan", c)
                        Button { model.manageSubscription() } label: {
                            Text("Manage subscription").font(.system(size: 14)).foregroundColor(c.link)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                        }
                        .disabled(p.busy)
                    }
                case .superUser:
                    pill("You have Super, which includes Premium", c)
                }
            }
            .padding(.top, 12)

            if let message = p.message {
                Text(message).font(.system(size: 12)).foregroundColor(c.muted)
                    .multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(16)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.accent, lineWidth: 2))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func comparison(_ c: AppColors) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Feature").font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
                Text("Free").font(.system(size: 12)).foregroundColor(c.muted).frame(width: 76)
                Text("Premium").font(.system(size: 12)).foregroundColor(c.muted).frame(width: 76)
            }
            .padding(.vertical, 6)
            ForEach(PlansLogic.groups) { group in
                Text(group.title).font(.system(size: 12)).foregroundColor(c.muted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 8).padding(.vertical, 5)
                    .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 6))
                ForEach(group.rows) { row in
                    HStack {
                        Text(row.label).font(.system(size: 12)).foregroundColor(c.text)
                            .frame(maxWidth: .infinity, alignment: .leading).padding(.trailing, 6)
                        cell(row.free, c).frame(width: 76)
                        cell(row.premium, c).frame(width: 76)
                    }
                    .padding(.vertical, 9)
                }
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    @ViewBuilder
    private func cell(_ cell: PlanCell, _ c: AppColors) -> some View {
        switch cell {
        case .included: Text("✓").font(.system(size: 15, weight: .medium)).foregroundColor(c.accent)
        case .notIncluded: Text("–").font(.system(size: 15)).foregroundColor(c.muted)
        case .text(let value): Text(value).font(.system(size: 11)).foregroundColor(c.muted).multilineTextAlignment(.center)
        }
    }

    private func pill(_ text: String, _ c: AppColors) -> some View {
        Text(text).font(.system(size: 13)).foregroundColor(c.muted)
            .frame(maxWidth: .infinity).padding(.vertical, 11)
            .background(c.accentSoft).clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
