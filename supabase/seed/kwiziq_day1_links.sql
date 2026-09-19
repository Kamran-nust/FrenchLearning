-- Day 1 (Kwiziq), requested manually.
-- 1) The plan chip "subject pronouns je, tu, il, elle, vous" -> the Tu/Vous lesson (approved).
update lesson_links
   set url = 'https://french.kwiziq.com/revision/grammar/tu-and-vous-are-used-for-three-types-of-you',
       title = 'Using Tu and Vous to express three types of you in French (French Subject Pronouns)',
       approved = true
 where module = 'kwiziq' and chip = 'subject pronouns je, tu, il, elle, vous';

-- 2) An additional Day 1 link that is not one of the plan's chips.
insert into lesson_extra_links (module, day, label, url, sort) values
  ('kwiziq', 1, 'Me/te/nous/vous = Me/you/us/you (Direct and Indirect Object Pronouns)',
   'https://french.kwiziq.com/revision/grammar/when-to-use-me-te-nous-and-vous-as-me-you-us-and-you-direct-and-indirect-object-pronouns', 1)
on conflict (module, day, url) do update set label = excluded.label, sort = excluded.sort, approved = true;
