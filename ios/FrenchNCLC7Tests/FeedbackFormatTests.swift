import XCTest
@testable import FrenchNCLC7

final class FeedbackFormatTests: XCTestCase {
    func testBulletsBecomeDots() {
        XCTAssertEqual(FeedbackFormat.bulletize("* one\n- two\n• three\nplain"), "• one\n• two\n• three\nplain")
        XCTAssertEqual(FeedbackFormat.bulletize("  * indented"), "• indented")
    }

    func testOnlyRealBulletsAreChanged() {
        XCTAssertEqual(FeedbackFormat.bulletize("2 * 3 = 6"), "2 * 3 = 6")
        XCTAssertEqual(FeedbackFormat.bulletize("*bold* start"), "*bold* start")
        XCTAssertEqual(FeedbackFormat.bulletize("Très bien.\n\nContinue !"), "Très bien.\n\nContinue !")
        XCTAssertEqual(FeedbackFormat.bulletize(""), "")
    }

    func testAsterisksDisappearFromTheDrawnText() {
        let text = "Here is how:\n* **Accent on *à*:** You wrote *\"a Toronto\"* → correct to **\"à Toronto\"**."
        let drawn = String(FeedbackFormat.attributed(text).characters)
        XCTAssertFalse(drawn.contains("*"))
        XCTAssertTrue(drawn.contains("• Accent on à: You wrote"))
    }
}
