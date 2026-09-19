import PDFKit
import SwiftUI

/// Reads a grammar-pages PDF inside the app, with a Back button. Pinch to zoom and scroll are built in.
struct PdfReaderView: View {
    @EnvironmentObject var model: AppModel
    let info: PdfDocumentInfo
    let onBack: () -> Void

    var body: some View {
        let c = model.colors
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Button(action: onBack) {
                    Text("‹ Back").font(.system(size: 14)).foregroundColor(c.text)
                }
                Text(info.label).font(.system(size: 12)).foregroundColor(c.muted)
                Spacer()
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            Divider().background(c.border)
            PdfKitView(data: info.data)
        }
    }
}

/// Apple's own PDF viewer, wrapped for SwiftUI.
private struct PdfKitView: UIViewRepresentable {
    let data: Data

    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.document = PDFDocument(data: data)
        return view
    }

    func updateUIView(_ uiView: PDFView, context: Context) {}
}
