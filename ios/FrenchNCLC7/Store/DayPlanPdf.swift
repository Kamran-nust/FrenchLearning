import UIKit

/// Draws the day-plan PDF on the phone: an A4, print-friendly white page with a blue header, a tick box
/// per section (so it works as a checklist) and page numbers. Plain text only, no links.
enum DayPlanPdf {
    private static let pageW: CGFloat = 595 // A4 in points
    private static let pageH: CGFloat = 842
    private static let margin: CGFloat = 45
    private static let bottom: CGFloat = pageH - 62
    private static let contentW: CGFloat = pageW - 2 * margin

    private static let ink = UIColor(red: 0x1B / 255, green: 0x22 / 255, blue: 0x33 / 255, alpha: 1)
    private static let muted = UIColor(red: 0x5B / 255, green: 0x66 / 255, blue: 0x7A / 255, alpha: 1)
    private static let line = UIColor(red: 0xD5 / 255, green: 0xDA / 255, blue: 0xE3 / 255, alpha: 1)
    private static let blue = UIColor(red: 0x25 / 255, green: 0x63 / 255, blue: 0xEB / 255, alpha: 1)
    private static let red = UIColor(red: 0xC8 / 255, green: 0x28 / 255, blue: 0x32 / 255, alpha: 1)
    private static let shade = UIColor(red: 0xF4 / 255, green: 0xF6 / 255, blue: 0xFA / 255, alpha: 1)

    /// Returns the finished PDF file's bytes.
    static func render(_ content: DayPlanContent, dateText: String) -> Data {
        let bounds = CGRect(x: 0, y: 0, width: pageW, height: pageH)
        // First pass only counts pages, so every footer can say "page 2 of 3".
        let counter = Drawer(content: content, dateText: dateText, totalPages: 0)
        _ = UIGraphicsPDFRenderer(bounds: bounds).pdfData { ctx in
            counter.context = ctx
            counter.run()
        }
        let drawer = Drawer(content: content, dateText: dateText, totalPages: counter.pageNo)
        return UIGraphicsPDFRenderer(bounds: bounds).pdfData { ctx in
            drawer.context = ctx
            drawer.run()
        }
    }

    private static func attributes(_ size: CGFloat, _ color: UIColor, bold: Bool = false, spaced: Bool = false) -> [NSAttributedString.Key: Any] {
        var attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: bold ? .bold : .regular),
            .foregroundColor: color,
        ]
        if spaced {
            let style = NSMutableParagraphStyle()
            style.lineHeightMultiple = 1.2
            attrs[.paragraphStyle] = style
        }
        return attrs
    }

    private static func height(_ text: String, _ attrs: [NSAttributedString.Key: Any], width: CGFloat) -> CGFloat {
        ceil((text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attrs, context: nil).height)
    }

    private static func draw(_ text: String, _ attrs: [NSAttributedString.Key: Any], x: CGFloat, y: CGFloat, width: CGFloat) {
        (text as NSString).draw(
            with: CGRect(x: x, y: y, width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attrs, context: nil)
    }

    /// Lays the content out page by page and draws it. `pageNo` ends up as the number of pages.
    private final class Drawer {
        let content: DayPlanContent
        let dateText: String
        let totalPages: Int
        var context: UIGraphicsPDFRendererContext?
        var y: CGFloat = 0
        var pageNo = 0

        init(content: DayPlanContent, dateText: String, totalPages: Int) {
            self.content = content
            self.dateText = dateText
            self.totalPages = totalPages
        }

        private var cg: CGContext { context!.cgContext }

        private func startPage() {
            pageNo += 1
            context?.beginPage()
            y = margin + 6
        }

        private func endPage() {
            cg.setStrokeColor(line.cgColor)
            cg.setLineWidth(0.6)
            cg.move(to: CGPoint(x: margin, y: pageH - 42))
            cg.addLine(to: CGPoint(x: pageW - margin, y: pageH - 42))
            cg.strokePath()
            let small = attributes(9, muted)
            draw("French NCLC 7 Study App", small, x: margin, y: pageH - 34, width: 250)
            let right = "Day \(content.day)  -  page \(pageNo) of \(totalPages)"
            let w = (right as NSString).size(withAttributes: small).width
            draw(right, small, x: pageW - margin - w, y: pageH - 34, width: w + 4)
        }

        private func ensure(_ h: CGFloat) {
            if y + h > bottom {
                endPage()
                startPage()
            }
        }

        private func header() {
            blue.setFill()
            UIRectFill(CGRect(x: 0, y: 0, width: pageW, height: 86))
            red.setFill()
            UIRectFill(CGRect(x: 0, y: 86, width: pageW, height: 5))
            draw("Day \(content.day)", attributes(28, .white, bold: true), x: margin, y: 14, width: 300)
            let sub = attributes(11, .white)
            draw("French NCLC 7 Preparation Plan  -  Week \(content.week)", sub, x: margin, y: 56, width: 380)
            let w = (dateText as NSString).size(withAttributes: sub).width
            draw(dateText, sub, x: pageW - margin - w, y: 56, width: w + 4)
            y = 122
        }

        private func heading(_ title: String, _ note: String?) {
            muted.setStroke()
            let box = UIBezierPath(rect: CGRect(x: margin, y: y - 11, width: 13, height: 13))
            box.lineWidth = 1
            box.stroke()
            draw(title, attributes(15, ink, bold: true), x: margin + 22, y: y - 14, width: 320)
            if let note {
                let a = attributes(10, muted)
                let w = (note as NSString).size(withAttributes: a).width
                draw(note, a, x: pageW - margin - w, y: y - 10, width: w + 4)
            }
            y += 8
            cg.setStrokeColor(line.cgColor)
            cg.setLineWidth(0.6)
            cg.move(to: CGPoint(x: margin, y: y))
            cg.addLine(to: CGPoint(x: pageW - margin, y: y))
            cg.strokePath()
            y += 18
        }

        /// The most words of `words` that fit in `room` points of height (at least one).
        private func fittingCount(_ words: [Substring], _ attrs: [NSAttributedString.Key: Any], room: CGFloat) -> Int {
            var lo = 1, hi = words.count
            while lo < hi {
                let mid = (lo + hi + 1) / 2
                if height(words[0..<mid].joined(separator: " "), attrs, width: contentW) <= room { lo = mid } else { hi = mid - 1 }
            }
            return lo
        }

        private func paragraph(_ text: String) {
            let attrs = attributes(11.5, ink, spaced: true)
            ensure(min(height(text, attrs, width: contentW), 60))
            var words = text.split(separator: " ", omittingEmptySubsequences: true)
            while !words.isEmpty {
                let whole = words.joined(separator: " ")
                let h = height(whole, attrs, width: contentW)
                let room = bottom - y
                if h <= room {
                    draw(whole, attrs, x: margin, y: y, width: contentW)
                    y += h + 4
                    break
                }
                let count = fittingCount(words, attrs, room: room)
                let part = words[0..<count].joined(separator: " ")
                draw(part, attrs, x: margin, y: y, width: contentW)
                y += height(part, attrs, width: contentW) + 4
                words = Array(words[count...])
                if !words.isEmpty {
                    endPage()
                    startPage()
                }
            }
        }

        private func cards(_ cards: [AnkiCard]) {
            let colW = contentW / 2
            let fr = attributes(11.5, ink, bold: true)
            let en = attributes(11.5, muted)
            for (i, card) in cards.enumerated() {
                let h = max(height(card.f, fr, width: colW - 12), height(card.e, en, width: colW - 8)) + 9
                ensure(h)
                if i % 2 == 0 {
                    shade.setFill()
                    UIRectFill(CGRect(x: margin, y: y - 3, width: contentW, height: h))
                }
                draw(card.f, fr, x: margin + 6, y: y, width: colW - 12)
                draw(card.e, en, x: margin + colW, y: y, width: colW - 8)
                y += h
            }
        }

        private func items(_ items: [String]) {
            let attrs = attributes(11.5, ink)
            for item in items {
                let h = height(item, attrs, width: contentW - 16)
                ensure(h + 6)
                blue.setFill()
                UIBezierPath(ovalIn: CGRect(x: margin + 1, y: y + 5, width: 5, height: 5)).fill()
                draw(item, attrs, x: margin + 14, y: y, width: contentW - 16)
                y += h + 6
            }
        }

        func run() {
            startPage()
            header()
            for s in content.sections {
                ensure(70)
                heading(s.title, s.note)
                if let text = s.text { paragraph(text) }
                if !s.cards.isEmpty { cards(s.cards) }
                if !s.items.isEmpty { items(s.items) }
                y += 28
            }
            endPage()
        }
    }
}
