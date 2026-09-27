-- Word Bank: 30 more starter words for Super users
-- (source: "French Vocabulary - New Standalone Additions (30)", duplicate-checked against Sets 1-3).
--
-- tier_min = 'super', so Premium users are unaffected. Existing Super users receive these automatically
-- the next time their Word Bank loads: word_bank_list() copies in any starter words they don't have yet.
-- Checked against the existing 148 starter words before adding: no overlaps.
-- Notes keep only what helps the learner; the source's "Related original entry" remarks (about how the
-- list was de-duplicated) are left out.

insert into word_bank_starter (tier_min, position, french, english, note) values
  ('super', 149, 'le matin', 'Morning', null),
  ('super', 150, 'le soir', 'Evening', null),
  ('super', 151, 'ennuyeux/ennuyeuse', 'Boring', null),
  ('super', 152, 'célibataire', 'Single', null),
  ('super', 153, 'les consignes / les lignes directrices', 'Guidelines', null),
  ('super', 154, 'le directeur / la directrice', 'Director', null),
  ('super', 155, 'un écrivain / une écrivaine', 'Writer', null),
  ('super', 156, 'des universitaires / des érudits', 'Scholars', null),
  ('super', 157, 'une fraise', 'Strawberry', null),
  ('super', 158, 'les cheveux', 'Hair', null),
  ('super', 159, 'les bras', 'Arms', null),
  ('super', 160, 'un œil', 'Eye', null),
  ('super', 161, 'les yeux', 'Eyes', null),
  ('super', 162, 'un cheval', 'Horse', null),
  ('super', 163, 'le papier', 'Paper', null),
  ('super', 164, 'devant', 'In front', null),
  ('super', 165, 'près d''ici', 'Near here', null),
  ('super', 166, 'voir', 'See', null),
  ('super', 167, 'détester', 'Hate', null),
  ('super', 168, 'un écureuil', 'Squirrel', null),
  ('super', 169, 'une souris', 'Mouse', null),
  ('super', 170, 'des noix / les fruits à coque', 'Nuts', 'Food meaning'),
  ('super', 171, 'un nez', 'Nose', null),
  ('super', 172, 'un visage', 'Face', null),
  ('super', 173, 'le feu', 'Fire', null),
  ('super', 174, 'un drapeau', 'Flag', null),
  ('super', 175, 'un pneu', 'Tire', 'Vehicle tire'),
  ('super', 176, 'des ongles', 'Nails', 'Fingernails; hardware nails = des clous'),
  ('super', 177, 'autre / l''autre', 'Other', null),
  ('super', 178, 'embrasser / un baiser', 'Kiss', 'Verb / noun')
on conflict (french, english) do nothing;
