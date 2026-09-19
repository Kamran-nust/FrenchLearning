import XCTest
@testable import FrenchNCLC7

final class LessonLinksTests: XCTestCase {
    private func data(_ text: String) -> Data { Data(text.utf8) }

    private let chipRows = """
    [
      {"chip":"Conjugate être in the present tense in French (Le Présent)","url":"https://french.kwiziq.com/revision/grammar/conjugate-etre-in-le-present-present-tense"},
      {"chip":"noun gender","url":"https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings"}
    ]
    """
    private let extraRows = """
    [
      {"day":1,"label":"Me/te/nous/vous","url":"https://french.kwiziq.com/revision/grammar/when-to-use-me-te-nous-and-vous-as-me-you-us-and-you-direct-and-indirect-object-pronouns","sort":1},
      {"day":1,"label":"Second extra","url":"https://french.kwiziq.com/x","sort":0},
      {"day":5,"label":"Day five","url":"https://french.kwiziq.com/y","sort":3}
    ]
    """

    func testChipLinksAndExtraLinksAreRead() {
        let links = LessonLinkLogic.parse(chipRows: data(chipRows), extraRows: data(extraRows))
        XCTAssertEqual(links.links.count, 2)
        XCTAssertEqual(links.links["noun gender"], "https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings")
        // extras are grouped by day and ordered by their sort number
        XCTAssertEqual(links.extras[1]?.map { $0.label }, ["Second extra", "Me/te/nous/vous"])
        XCTAssertEqual(links.extras[5], [ExtraLink(label: "Day five", url: "https://french.kwiziq.com/y")])
        XCTAssertTrue(LessonLinkLogic.extrasFor(2, links).isEmpty)
    }

    func testADirectLinkReplacesTheGoogleSearchForThatChipOnly() {
        let links = LessonLinkLogic.parse(chipRows: data(chipRows), extraRows: nil)
        XCTAssertTrue(LessonLinkLogic.hasDirect("noun gender", links))
        XCTAssertEqual(LessonLinkLogic.href(.kwiziq, "noun gender", links)?.absoluteString,
                       "https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings")
        // a chip with no link keeps the Google search
        XCTAssertFalse(LessonLinkLogic.hasDirect("Mixed kwiz", links))
        XCTAssertEqual(LessonLinkLogic.href(.kwiziq, "Mixed kwiz", links)?.absoluteString,
                       "https://www.google.com/search?q=site%3Afrench.kwiziq.com%20Mixed%20kwiz")
    }

    func testFreeAccountsHaveNoLinksSoEveryChipIsAGoogleSearch() {
        XCTAssertEqual(LessonLinkLogic.parse(chipRows: data("[]"), extraRows: data("[]")), LessonLinks.empty)
        XCTAssertTrue(LessonLinkLogic.href(.kwiziq, "noun gender", .empty)?.absoluteString.hasPrefix("https://www.google.com/search") == true)
        XCTAssertTrue(LessonLinkLogic.href(.tv5, "les salutations", .empty)?.absoluteString.contains("site%3Atv5monde.com") == true)
    }

    func testOnlyHttpsAddressesAreEverOpened() {
        let rows = """
        [
          {"chip":"a","url":"http://insecure.example/a"},
          {"chip":"b","url":"javascript:alert(1)"},
          {"chip":"c","url":"file:///etc/passwd"},
          {"chip":"d","url":"https://ok.example/d"}
        ]
        """
        let links = LessonLinkLogic.parse(chipRows: data(rows),
                                          extraRows: data(#"[{"day":1,"label":"bad","url":"http://x.example","sort":0}]"#))
        XCTAssertEqual(Set(links.links.keys), ["d"])
        XCTAssertTrue(links.extras.isEmpty)
        XCTAssertFalse(LessonLinkLogic.isSafe("http://x"))
        XCTAssertTrue(LessonLinkLogic.isSafe("https://x"))
    }

    func testBrokenOrMissingRepliesNeverBreakTheOtherPart() {
        let onlyChips = LessonLinkLogic.parse(chipRows: data(chipRows), extraRows: nil)
        XCTAssertEqual(onlyChips.links.count, 2)
        XCTAssertTrue(onlyChips.extras.isEmpty)
        let onlyExtras = LessonLinkLogic.parse(chipRows: data("not json"), extraRows: data(extraRows))
        XCTAssertTrue(onlyExtras.links.isEmpty)
        XCTAssertEqual(onlyExtras.extras[1]?.count, 2)
        // rows with missing fields are skipped, the rest are kept
        let partial = LessonLinkLogic.parse(
            chipRows: data(#"[{"chip":"x"},{"url":"https://a.example"},{"chip":"ok","url":"https://ok.example"}]"#),
            extraRows: data(#"{"message":"nope"}"#))
        XCTAssertEqual(partial.links, ["ok": "https://ok.example"])
        XCTAssertTrue(partial.extras.isEmpty)
    }

    func testOnlyKwiziqAndTv5UseLessonLinks() {
        XCTAssertEqual(LessonLinkLogic.moduleFor(.kwiziq), "kwiziq")
        XCTAssertEqual(LessonLinkLogic.moduleFor(.tv5), "tv5")
        XCTAssertNil(LessonLinkLogic.moduleFor(.grammar))
        XCTAssertNil(LessonLinkLogic.moduleFor(.writing))
        XCTAssertNil(LessonLinkLogic.moduleFor(.anki))
    }
}
