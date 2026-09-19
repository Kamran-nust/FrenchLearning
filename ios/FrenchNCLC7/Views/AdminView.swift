import SwiftUI

/// Users and their tiers, for super users: search, see who is on which tier and how active they are,
/// and change a tier. Every change is checked by the database, so this screen is only a convenience.
struct AdminView: View {
    @EnvironmentObject var model: AppModel
    let a: AdminState

    var body: some View {
        let c = model.colors
        let users = a.users
        let shown = users.map { AdminLogic.filter($0, query: a.query) } ?? []

        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 10) {
                    Button { model.goHome() } label: {
                        Text("‹").font(.system(size: 24)).foregroundColor(c.muted)
                    }
                    Text("Admin").font(.system(size: 12)).foregroundColor(c.muted)
                }
                .padding(.bottom, 20)

                Text("Users").font(.system(size: 24, design: .serif)).foregroundColor(c.text)
                Text("Change what each person can use. Changes apply the next time they open the app.")
                    .font(.system(size: 12)).foregroundColor(c.muted).padding(.top, 4)

                if let users, !users.isEmpty {
                    let counts = AdminLogic.counts(users)
                    HStack(spacing: 8) {
                        ForEach(Tier.ordered, id: \.rawValue) { t in
                            Text("\(counts[t] ?? 0) \(t.label.lowercased())")
                                .font(.system(size: 12)).foregroundColor(c.text)
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(c.accentSoft).clipShape(Capsule())
                        }
                    }
                    .padding(.top, 14)
                }

                TextField("Search by email or username", text: Binding(get: { a.query }, set: { model.setAdminQuery($0) }))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .keyboardType(.emailAddress)
                    .padding(12).background(c.card)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
                    .foregroundColor(c.text)
                    .padding(.top, 14)

                if users == nil && a.loadError == nil {
                    Text("Loading users…").font(.system(size: 13)).foregroundColor(c.muted)
                        .frame(maxWidth: .infinity).padding(.vertical, 40)
                }
                if let error = a.loadError {
                    HStack(spacing: 4) {
                        Text(error).font(.system(size: 12)).foregroundColor(c.danger)
                        Button("Retry") { model.loadAdminUsers() }.font(.system(size: 12)).foregroundColor(c.danger)
                    }
                    .padding(.top, 10)
                }
                if let users, !users.isEmpty, shown.isEmpty {
                    Text("No one matches \"\(a.query)\".").font(.system(size: 12)).foregroundColor(c.muted)
                        .frame(maxWidth: .infinity).padding(.vertical, 20)
                }

                VStack(spacing: 10) {
                    ForEach(shown, id: \.userId) { u in
                        userCard(u, c)
                    }
                }
                .padding(.top, 14)
            }
            .padding(20)
        }
        // Asked before making someone a super user
        .alert("Make super user?",
               isPresented: Binding(get: { a.confirmSuper != nil }, set: { presented in if !presented { model.cancelPromotion() } }),
               presenting: a.confirmSuper) { _ in
            Button("Make super", role: .destructive) { model.confirmPromotion() }
            Button("Cancel", role: .cancel) { model.cancelPromotion() }
        } message: { user in
            Text(AdminLogic.confirmText(user))
        }
    }

    private func userCard(_ u: AdminUser, _ c: AppColors) -> some View {
        let isMe = u.userId == model.session?.userId
        let saving = a.saving.contains(u.userId)
        let locked = AdminLogic.isLocked(u, myId: model.session?.userId, saving: saving)
        return VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(u.displayName).font(.system(size: 14, weight: .medium)).foregroundColor(c.text).lineLimit(1)
                        if isMe { Text("(you)").font(.system(size: 12)).foregroundColor(c.muted) }
                    }
                    if u.username != nil, let email = u.email {
                        Text(email).font(.system(size: 12)).foregroundColor(c.muted).lineLimit(1)
                    }
                }
                Spacer()
                // Tier selector: your own row is locked, and a row is locked while it is being saved
                Menu {
                    ForEach(Tier.ordered, id: \.rawValue) { t in
                        Button(t.label) { model.requestTierChange(u, t) }
                    }
                } label: {
                    Text((saving ? "… " : "") + u.tier.label + "  ▾")
                        .font(.system(size: 12)).foregroundColor(locked ? c.muted : c.text)
                        .padding(.horizontal, 10).padding(.vertical, 7)
                        .background(c.bg)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(c.border))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .disabled(locked)
            }
            Text(AdminLogic.activityLine(u)).font(.system(size: 12)).foregroundColor(c.muted)
            if let error = a.rowErrors[u.userId] {
                Text(error).font(.system(size: 12)).foregroundColor(c.danger)
            }
        }
        .padding(16)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
