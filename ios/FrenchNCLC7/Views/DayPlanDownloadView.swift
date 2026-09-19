import SwiftUI
import UIKit

/// "Download Day N plan (PDF)" for premium (1 per rolling 24 hours) and super (unlimited). Free accounts see
/// a lock note. The limit itself is enforced by the database; this button just reflects it.
struct DayPlanDownloadView: View {
    @EnvironmentObject var model: AppModel
    let day: Int

    var body: some View {
        let c = model.colors
        if !model.tier.atLeast(.premium) {
            Text("🔒 Day plan PDF download is a Premium feature")
                .font(.system(size: 12)).foregroundColor(c.muted)
                .frame(maxWidth: .infinity).padding(.vertical, 14)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                .padding(.top, 20)
        } else {
            let state = model.dayPlan
            let usedUp = state.quota?.allowed == false
            let disabled = state.busy || state.ready != nil || usedUp || state.quota == nil
            VStack(spacing: 8) {
                Button { model.requestDayPlanPdf(day: day) } label: {
                    Text(state.busy ? "Preparing PDF…" : "⬇ Download Day \(day) plan (PDF)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(disabled ? c.muted : c.onAccent)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(disabled ? c.card : c.accent)
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(disabled ? c.border : c.accent))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .disabled(disabled)

                if usedUp, let quota = state.quota {
                    // the countdown refreshes every minute
                    TimelineView(.periodic(from: Date(), by: 60)) { context in
                        Text(quota.resetsAt != nil ? DayPlanLogic.waitText(quota, now: context.date) : "Not available right now.")
                            .font(.system(size: 12)).foregroundColor(c.muted)
                    }
                }
                if let error = state.error {
                    Text(error).font(.system(size: 12)).foregroundColor(c.danger).multilineTextAlignment(.center)
                }
            }
            .padding(.top, 20)
            .onAppear { model.loadPdfQuota() }
            // Bring the button back when the wait is over.
            .task(id: state.quota) {
                guard let quota = state.quota, !quota.allowed, quota.resetsAt != nil else { return }
                let wait = max(quota.secondsUntilReset(), 0) + 1
                try? await Task.sleep(nanoseconds: UInt64(wait * 1_000_000_000))
                if !Task.isCancelled { model.loadPdfQuota() }
            }
            // The system share sheet lets the person choose "Save to Files" (or share it anywhere).
            .sheet(isPresented: Binding(get: { model.dayPlan.ready != nil }, set: { _ in })) {
                if let ready = model.dayPlan.ready {
                    ShareSheet(url: ready.url) { saved in model.dayPlanShareFinished(saved: saved) }
                        .ignoresSafeArea()
                }
            }
        }
    }
}

/// Apple's share sheet for one file.
private struct ShareSheet: UIViewControllerRepresentable {
    let url: URL
    let onFinish: (Bool) -> Void

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        // called when the sheet closes; `completed` is false if the person backed out
        controller.completionWithItemsHandler = { _, completed, _, _ in onFinish(completed) }
        return controller
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
