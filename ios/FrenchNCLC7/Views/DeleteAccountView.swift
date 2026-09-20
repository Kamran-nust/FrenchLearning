import SwiftUI

/// Deleting your own account: a warning, a typed confirmation and the password. Not offered to Super accounts.
struct DeleteAccountView: View {
    @EnvironmentObject var model: AppModel
    let d: DeleteAccountState

    var body: some View {
        let c = model.colors
        let ready = AccountLogic.canConfirmDelete(typed: d.typed, password: d.password) && !d.busy
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                if !d.done {
                    HStack(spacing: 10) {
                        Button { model.goHome() } label: { Text("‹").font(.system(size: 24)).foregroundColor(c.muted) }
                        Text("Account").font(.system(size: 12)).foregroundColor(c.muted)
                    }
                    .padding(.bottom, 6)
                }
                Text(d.done ? "Account deleted" : "Delete your account")
                    .font(.system(size: 24, design: .serif)).foregroundColor(c.text)

                if d.done {
                    Text("Your account and everything saved with it has been deleted.").font(.system(size: 14)).foregroundColor(c.muted)
                    Button { model.signOut() } label: {
                        Text("Continue").font(.system(size: 14, weight: .medium))
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(c.accent).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.top, 10)
                } else if !AccountLogic.canDelete(model.tier) {
                    Text(AccountLogic.superNotAllowed).font(.system(size: 14)).foregroundColor(c.muted)
                } else {
                    Text("This permanently deletes your account and everything saved with it. It can't be undone.")
                        .font(.system(size: 14)).foregroundColor(c.muted)
                    VStack(alignment: .leading, spacing: 3) {
                        ForEach(["Your progress, streaks and Anki history", "Your Writing entries",
                                 "Your Word Bank and any words you added", "Your username and sign-in"], id: \.self) {
                            Text("•  " + $0).font(.system(size: 12)).foregroundColor(c.muted)
                        }
                    }
                    .padding(.leading, 6).padding(.bottom, 6)

                    Text("Type \(AccountLogic.deleteWord) to confirm").font(.system(size: 12)).foregroundColor(c.muted)
                    TextField("", text: Binding(get: { d.typed }, set: { model.setDeleteTyped($0) }))
                        .textInputAutocapitalization(.never).autocorrectionDisabled(true)
                        .padding(12).background(c.card)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border)).foregroundColor(c.text)
                    Text("Your password").font(.system(size: 12)).foregroundColor(c.muted)
                    SecureField("", text: Binding(get: { d.password }, set: { model.setDeletePassword($0) }))
                        .padding(12).background(c.card)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border)).foregroundColor(c.text)

                    if let error = d.error {
                        Text(error).font(.system(size: 13)).foregroundColor(c.danger)
                    }
                    Button { model.confirmDeleteAccount() } label: {
                        Text(d.busy ? "Deleting…" : "Delete my account").font(.system(size: 14, weight: .medium))
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(ready ? c.danger : c.danger.opacity(0.4)).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!ready)
                    .padding(.top, 6)
                    Button { model.goHome() } label: {
                        Text("Keep my account").font(.system(size: 14)).foregroundColor(c.muted)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                    }
                }
            }
            .padding(20)
        }
    }
}
