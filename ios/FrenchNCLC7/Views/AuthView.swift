import SwiftUI

struct AuthView: View {
    @EnvironmentObject var model: AppModel
    @State private var creating = false
    @State private var useUsername = false
    @State private var who = ""
    @State private var email = ""
    @State private var username = ""
    @State private var password = ""

    var body: some View {
        let c = model.colors
        ScrollView {
            VStack(spacing: 12) {
                Text("A DAILY LANGUAGE JOURNEY")
                    .font(.system(size: 11, weight: .semibold)).tracking(1).foregroundColor(c.gold)
                Text("French NCLC 7\nPreparation Plan")
                    .font(.system(size: 30, weight: .semibold, design: .serif))
                    .multilineTextAlignment(.center).foregroundColor(c.text)
                    .padding(.bottom, 12)
                Text(creating ? "Create your account" : "Sign in")
                    .font(.system(size: 18, weight: .medium)).foregroundColor(c.text)

                if !creating {
                    Picker("Sign in with", selection: $useUsername) {
                        Text("Email").tag(false)
                        Text("Username").tag(true)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: useUsername) { _ in who = "" }

                    field(useUsername ? "Username" : "Email", text: $who, keyboard: useUsername ? .default : .emailAddress)
                } else {
                    field("Email", text: $email, keyboard: .emailAddress)
                    field("Username (3-20 letters, numbers, _)", text: $username, keyboard: .default)
                }
                SecureField("Password", text: $password)
                    .padding(12)
                    .background(c.card)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
                    .foregroundColor(c.text)

                if let error = model.authError {
                    Text(error).font(.system(size: 13)).foregroundColor(c.danger).multilineTextAlignment(.center)
                }
                if let notice = model.authNotice {
                    Text(notice).font(.system(size: 13)).foregroundColor(c.success).multilineTextAlignment(.center)
                }

                Button {
                    if creating {
                        model.signUp(email: email, username: username, password: password)
                    } else {
                        model.signIn(useUsername: useUsername, who: who, password: password)
                    }
                } label: {
                    Text(model.authBusy ? "Please wait…" : (creating ? "Create account" : "Sign in"))
                        .fontWeight(.medium)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(c.accent).foregroundColor(c.onAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(model.authBusy)

                Button(creating ? "Already have an account? Sign in" : "New here? Create an account") {
                    creating.toggle()
                    model.clearAuthMessages()
                }
                .font(.system(size: 13)).foregroundColor(c.link)
            }
            .padding(.horizontal, 24).padding(.vertical, 40)
        }
    }

    private func field(_ title: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        let c = model.colors
        return TextField(title, text: text)
            .keyboardType(keyboard)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled(true)
            .padding(12)
            .background(c.card)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
            .foregroundColor(c.text)
    }
}
