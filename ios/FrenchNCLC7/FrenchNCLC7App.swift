import SwiftUI

@main
struct FrenchNCLC7App: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var model: AppModel

    var body: some View {
        let c = model.colors
        ZStack {
            c.bg.ignoresSafeArea()
            switch model.screen {
            case .loading:
                ProgressView().tint(c.accent)
            case .auth:
                AuthView()
            case .home:
                HomeView()
            case .study:
                if let study = model.study {
                    StudyView(study: study)
                }
            case .writing:
                if let writing = model.writing {
                    WritingView(w: writing)
                }
            case .day(let section, let day):
                DayView(section: section, day: day)
            }
        }
    }
}
