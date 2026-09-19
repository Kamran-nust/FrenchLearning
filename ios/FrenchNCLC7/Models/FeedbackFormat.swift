import Foundation

/// The AI writes its feedback with light markdown (**bold**, *italic*, and "* " bullets). Shown as it is, that
/// would be stray asterisks, so bullets become "•" and bold/italic are drawn as real bold and italic.
enum FeedbackFormat {
    /// Lines that start with "* ", "- " or "• " become "• " lines.
    static func bulletize(_ text: String) -> String {
        text.components(separatedBy: "\n").map { line -> String in
            let trimmed = line.drop(while: { $0 == " " || $0 == "\t" })
            for marker in ["* ", "- ", "• "] where trimmed.hasPrefix(marker) {
                return "• " + String(trimmed.dropFirst(marker.count))
            }
            return line
        }.joined(separator: "\n")
    }

    /// Text ready to draw, with bold and italic applied (plain text if it can't be read as markdown).
    static func attributed(_ text: String) -> AttributedString {
        let prepared = bulletize(text)
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        return (try? AttributedString(markdown: prepared, options: options)) ?? AttributedString(prepared)
    }
}
