import XCTest
@testable import FrenchNCLC7

/// Tests for the Anki "I got it wrong" list (the same cases as the web and Android tests).
final class MissedWordsTests: XCTestCase {
    private func item(_ id: String, _ french: String, _ english: String) -> AnkiItem {
        AnkiItem(cardId: id, french: french, english: english, dir: .fe, sourceDay: 1, key: "\(id)-k")
    }

    func testTogglesACardOnAndOff() {
        var r = MissedWords.toggle([], item("a", "le pain", "bread"))
        XCTAssertEqual(r, [MissedWord(i: "a", f: "le pain", e: "bread")])
        r = MissedWords.toggle(r, item("a", "le pain", "bread"))
        XCTAssertEqual(r, [])
    }

    func testMergesARoundIntoTheSavedListEachWordOnceInOrder() {
        let saved = [MissedWord(i: "a", f: "A", e: "a")]
        let round = [MissedWord(i: "b", f: "B", e: "b"), MissedWord(i: "a", f: "A", e: "a")]
        XCTAssertEqual(MissedWords.merge(saved, round).map { $0.i }, ["a", "b"])
        XCTAssertEqual(MissedWords.merge([], []), [])
    }

    func testReadsTheSavedValueSafely() {
        XCTAssertEqual(MissedWords.decode(nil), MissedWords.empty)
        XCTAssertEqual(MissedWords.decode("junk"), MissedWords.empty)
        XCTAssertEqual(MissedWords.decode("[1,2]"), MissedWords.empty)
        XCTAssertEqual(
            MissedWords.decode(#"{"day":4,"words":[{"i":"a","f":"A","e":"a"},{"i":"a","f":"A","e":"a"},{"bad":1},{"i":2,"f":"B","e":"b"},7]}"#),
            MissedList(day: 4, words: [MissedWord(i: "a", f: "A", e: "a")])
        )
        XCTAssertNil(MissedWords.decode(#"{"day":"x","words":[]}"#).day)
    }

    func testSavesTheSameShapeAsTheWebApp() {
        let empty = MissedWords.encode(MissedWords.empty)
        XCTAssertTrue(empty.contains(#""day":null"#))
        XCTAssertEqual(MissedWords.decode(empty), MissedWords.empty)
        let list = MissedList(day: 1, words: [MissedWord(i: "d1c1", f: "bonjour", e: "hello")])
        XCTAssertEqual(MissedWords.decode(MissedWords.encode(list)), list)
        // A list saved by the web app reads the same.
        XCTAssertEqual(MissedWords.decode(#"{"day":1,"words":[{"i":"d1c1","f":"bonjour","e":"hello"}]}"#), list)
    }

    func testFindsTheMissedWordsNotYetFlaggedHard() {
        let words = [MissedWord(i: "a", f: "A", e: "a"), MissedWord(i: "b", f: "B", e: "b")]
        XCTAssertEqual(MissedWords.unflagged(words, hard: ["a"]).map { $0.i }, ["b"])
    }
}
