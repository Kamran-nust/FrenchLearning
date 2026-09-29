package com.frenchnclc7.app

import com.frenchnclc7.app.data.AnkiItem
import com.frenchnclc7.app.data.Direction
import com.frenchnclc7.app.data.MissedList
import com.frenchnclc7.app.data.MissedWord
import com.frenchnclc7.app.data.MissedWords
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MissedWordsTest {
    private fun item(id: String, french: String, english: String) = AnkiItem(id, french, english, Direction.FE, 1, "$id-k")

    @Test
    fun togglesACardOnAndOff() {
        var r = MissedWords.toggle(emptyMap(), item("a", "le pain", "bread"))
        assertEquals(mapOf("a" to MissedWord("a", "le pain", "bread")), r)
        r = MissedWords.toggle(r, item("a", "le pain", "bread"))
        assertEquals(emptyMap<String, MissedWord>(), r)
    }

    @Test
    fun mergesARoundIntoTheSavedListEachWordOnceInOrder() {
        val saved = listOf(MissedWord("a", "A", "a"))
        var round = MissedWords.toggle(emptyMap(), item("b", "B", "b"))
        round = MissedWords.toggle(round, item("a", "A", "a"))
        assertEquals(listOf("a", "b"), MissedWords.merge(saved, round).map { it.i })
        assertEquals(emptyList<MissedWord>(), MissedWords.merge(emptyList(), emptyMap()))
    }

    @Test
    fun readsTheSavedValueSafely() {
        assertEquals(MissedWords.EMPTY, MissedWords.decode(null))
        assertEquals(MissedWords.EMPTY, MissedWords.decode("junk"))
        assertEquals(MissedWords.EMPTY, MissedWords.decode("[1,2]"))
        assertEquals(
            MissedList(4, listOf(MissedWord("a", "A", "a"))),
            MissedWords.decode("""{"day":4,"words":[{"i":"a","f":"A","e":"a"},{"i":"a","f":"A","e":"a"},{"bad":1},{"i":2,"f":"B","e":"b"}]}"""),
        )
        assertNull(MissedWords.decode("""{"day":"x","words":[]}""").day)
    }

    @Test
    fun savesTheSameShapeAsTheWebApp() {
        assertEquals("""{"day":null,"words":[]}""", MissedWords.encode(MissedWords.EMPTY))
        val list = MissedList(1, listOf(MissedWord("d1c1", "bonjour", "hello")))
        assertEquals("""{"day":1,"words":[{"i":"d1c1","f":"bonjour","e":"hello"}]}""", MissedWords.encode(list))
        assertEquals(list, MissedWords.decode(MissedWords.encode(list)))
    }

    @Test
    fun findsTheMissedWordsNotYetFlaggedHard() {
        val words = listOf(MissedWord("a", "A", "a"), MissedWord("b", "B", "b"))
        assertEquals(listOf("b"), MissedWords.unflagged(words, setOf("a")).map { it.i })
    }
}
