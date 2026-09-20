import SwiftUI

/// The Word Bank (Premium and Super): the person's own list of French words. They join the Anki review cards from
/// the next session. Starter words can be hidden and brought back; words the person added can be edited and deleted.
struct WordBankView: View {
    @EnvironmentObject var model: AppModel
    let w: WordBankState

    var body: some View {
        let c = model.colors
        if !model.tier.atLeast(.premium) {
            locked(c)
        } else {
            list(c)
        }
    }

    // MARK: Free accounts

    private func locked(_ c: AppColors) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                header(c)
                Text("Word Bank").font(.system(size: 24, design: .serif)).foregroundColor(c.text).padding(.top, 8)
                VStack(spacing: 6) {
                    Text("🔒").font(.system(size: 26))
                    Text("Word Bank is a Premium feature").font(.system(size: 14, weight: .medium)).foregroundColor(c.text)
                    Text("Keep your own list of French words. They join your Anki reviews from your next session.")
                        .font(.system(size: 12)).foregroundColor(c.muted).multilineTextAlignment(.center)
                    Button { model.openPlans() } label: {
                        Text("See plans").font(.system(size: 14, weight: .medium))
                            .padding(.horizontal, 24).padding(.vertical, 12)
                            .background(c.accent).foregroundColor(c.onAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.top, 10)
                }
                .frame(maxWidth: .infinity).padding(20)
                .background(c.card)
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(20)
        }
    }

    // MARK: Premium and Super

    private func list(_ c: AppColors) -> some View {
        let words = w.words ?? []
        let visible = words.filter { !$0.hidden }
        let hiddenStarters = words.filter { $0.hidden && $0.starter_id != nil }.count
        let shown = WordBankLogic.filter(WordBankLogic.sortForDisplay(visible), query: w.query)
        let ownCount = WordBankLogic.ownCount(visible)
        let limit = WordBankLogic.ownLimit(model.tier)

        return ScrollView {
            LazyVStack(alignment: .leading, spacing: 8) {
                header(c)
                Text("Word Bank").font(.system(size: 24, design: .serif)).foregroundColor(c.text).padding(.top, 8)
                Text("Your own words. They join the review cards in Anki from your next session.")
                    .font(.system(size: 12)).foregroundColor(c.muted)

                HStack(spacing: 8) {
                    stat("Words in rotation", "\(visible.count)", c)
                    stat("Words you added", model.tier == .premium ? "\(ownCount) of \(limit)" : "\(ownCount)", c)
                }
                .padding(.vertical, 6)

                addForm(c)

                TextField("Search your words", text: Binding(get: { w.query }, set: { model.wbQuery($0) }))
                    .textFieldStyle(.plain).padding(12).background(c.card)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
                    .foregroundColor(c.text)
                    .padding(.top, 6)

                if w.words == nil {
                    Text("Loading your words…").font(.system(size: 12)).foregroundColor(c.muted)
                        .frame(maxWidth: .infinity).padding(24)
                } else if w.loadError {
                    HStack {
                        Text("Couldn't load your words.").font(.system(size: 12)).foregroundColor(c.hard)
                        Button("Retry") { model.loadWordBank() }.font(.system(size: 12)).foregroundColor(c.link)
                    }
                } else if shown.isEmpty {
                    Text(w.query.isEmpty ? "No words yet. Add your first one above." : "No words match that search.")
                        .font(.system(size: 12)).foregroundColor(c.muted).frame(maxWidth: .infinity).padding(24)
                }

                ForEach(Array(shown.prefix(w.showCount))) { word in
                    if w.editingId == word.id { editRow(word, c) } else { row(word, c) }
                }

                if shown.count > w.showCount {
                    Button { model.wbShowMore() } label: {
                        Text("Show more (\(shown.count - w.showCount) left)").font(.system(size: 12)).foregroundColor(c.link)
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
                    }
                }

                resetControl(hiddenStarters, c).padding(.top, 16)
            }
            .padding(20)
        }
    }

    private func header(_ c: AppColors) -> some View {
        HStack(spacing: 10) {
            Button { model.goHome() } label: { Text("‹").font(.system(size: 24)).foregroundColor(c.muted) }
            Text("Word Bank").font(.system(size: 12)).foregroundColor(c.muted)
        }
    }

    private func stat(_ label: String, _ value: String, _ c: AppColors) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.system(size: 12)).foregroundColor(c.muted)
            Text(value).font(.system(size: 18, weight: .medium)).foregroundColor(c.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(12)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func field(_ placeholder: String, _ value: String, _ set: @escaping (String) -> Void, _ c: AppColors) -> some View {
        TextField(placeholder, text: Binding(get: { value }, set: set))
            .textFieldStyle(.plain).padding(12).background(c.bg)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
            .foregroundColor(c.text)
            .autocorrectionDisabled()
    }

    // MARK: Add form

    private func addForm(_ c: AppColors) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("＋ Add a word").font(.system(size: 14, weight: .medium)).foregroundColor(c.text)
            field("French, for example le fromage", w.french, { model.wbSetFrench($0) }, c)
            field("English, for example cheese", w.english, { model.wbSetEnglish($0) }, c)
            field("Note (optional)", w.note, { model.wbSetNote($0) }, c)
            if let error = w.addError {
                Text(error).font(.system(size: 12)).foregroundColor(c.hard)
            }
            Button { model.wbAdd() } label: {
                Text("Add word").font(.system(size: 14, weight: .medium))
                    .frame(maxWidth: .infinity).padding(.vertical, 13)
                    .background(c.accent).foregroundColor(c.onAccent)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(w.busy)
            if let notice = w.notice {
                Text(notice).font(.system(size: 12)).foregroundColor(c.muted)
                    .frame(maxWidth: .infinity).multilineTextAlignment(.center)
            }
        }
        .padding(16)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: Rows

    private func row(_ word: WordBankWord, _ c: AppColors) -> some View {
        let own = WordBankLogic.isOwn(word)
        return HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text(word.french).font(.system(size: 14, weight: .medium)).foregroundColor(c.text)
                Text(word.english + (word.note.map { " · " + $0 } ?? "")).font(.system(size: 12)).foregroundColor(c.muted)
                Text(own ? "Mine" : "Starter").font(.system(size: 10)).foregroundColor(c.link)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(c.accentSoft).clipShape(Capsule()).padding(.top, 4)
            }
            Spacer()
            if w.confirmId == word.id {
                HStack(spacing: 14) {
                    Button(own ? "Delete" : "Hide") { model.wbRemove(word) }.foregroundColor(c.hard)
                    Button("Keep") { model.wbAskDelete(nil) }.foregroundColor(c.muted)
                }
                .font(.system(size: 12))
            } else {
                HStack(spacing: 16) {
                    Button { model.wbStartEdit(word) } label: { Text("✎").font(.system(size: 18)).foregroundColor(c.muted) }
                        .accessibilityLabel("Edit \(word.french)")
                    Button { if own { model.wbAskDelete(word.id) } else { model.wbRemove(word) } } label: {
                        Text("🗑").font(.system(size: 16)).foregroundColor(c.muted)
                    }
                    .accessibilityLabel((own ? "Delete " : "Hide ") + word.french)
                }
            }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.border))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func editRow(_ word: WordBankWord, _ c: AppColors) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            field("French", w.editFrench, { model.wbSetEditFrench($0) }, c)
            field("English", w.editEnglish, { model.wbSetEditEnglish($0) }, c)
            field("Note (optional)", w.editNote, { model.wbSetEditNote($0) }, c)
            if let error = w.editError {
                Text(error).font(.system(size: 12)).foregroundColor(c.hard)
            }
            HStack(spacing: 8) {
                Button { model.wbSaveEdit(word) } label: {
                    Text("Save").font(.system(size: 13, weight: .medium))
                        .frame(maxWidth: .infinity).padding(.vertical, 10)
                        .background(c.accent).foregroundColor(c.onAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .disabled(w.busy)
                Button { model.wbCancelEdit() } label: {
                    Text("Cancel").font(.system(size: 13))
                        .frame(maxWidth: .infinity).padding(.vertical, 10)
                        .foregroundColor(c.muted)
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(c.border))
                }
            }
        }
        .padding(12)
        .background(c.card)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.accent))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: Reset starter words

    private func resetControl(_ hidden: Int, _ c: AppColors) -> some View {
        VStack(spacing: 8) {
            if w.confirmReset {
                Text("Bring back hidden starter words and undo edits to them? Words you added stay as they are.")
                    .font(.system(size: 12)).foregroundColor(c.muted).multilineTextAlignment(.center)
                HStack(spacing: 24) {
                    Button("Reset") { model.wbReset() }.foregroundColor(c.link).disabled(w.busy)
                    Button("Cancel") { model.wbAskReset(false) }.foregroundColor(c.muted)
                }
                .font(.system(size: 13))
            } else {
                Button("↺ Reset starter words" + (hidden > 0 ? " (\(hidden) hidden)" : "")) { model.wbAskReset(true) }
                    .font(.system(size: 12)).foregroundColor(c.muted)
            }
        }
        .frame(maxWidth: .infinity)
    }
}
