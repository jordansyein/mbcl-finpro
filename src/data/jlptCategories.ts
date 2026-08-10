// Quick-tap fallback for sessions with nothing to photograph. Not exhaustive —
// just enough common grammar patterns and vocab themes per level to seed a
// manual entry. User picks a level first, then categories within it.
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

export interface QuickCategory {
  item_type: 'grammar' | 'vocab'
  label: string
}

export const GRAMMAR_BY_LEVEL: Record<JlptLevel, QuickCategory[]> = {
  N5: [
    '〜てください', '〜ないでください', '〜てもいいです', '〜てはいけません', '〜ことができます',
    '〜前に', '〜てから', '〜ながら', '〜たり〜たりします', '〜と思います',
    '〜でしょう', '〜かもしれません', '〜つもりです', '〜たいです', '〜ましょう',
    '〜ませんか', '〜なければなりません', '〜なくてもいいです', '〜方（かた）', '〜すぎる',
    '〜やすい', '〜にくい', '〜という', '〜とき',
  ].map((label) => ({ item_type: 'grammar', label })),

  N4: [
    '〜ようになる', '〜ことにする', '〜ことになる', '〜そうです（様態）', '〜そうです（伝聞）',
    '〜ようだ', '〜らしい', '〜はずです', '〜のに', '〜ば',
    '〜たら', '〜と（条件）', '〜（さ）せる', '〜（ら）れる', '〜てあげる',
    '〜てもらう', '〜てくれる', '〜ておく', '〜てしまう', '〜ていく',
    '〜てくる', '〜まま', '〜おかげで', '〜ばかり',
  ].map((label) => ({ item_type: 'grammar', label })),

  N3: [
    '〜ば〜ほど', '〜たとたん', '〜たびに', '〜において', '〜として',
    '〜わりに', '〜つつ', '〜一方で', '〜末に', '〜おそれがある',
    '〜に決まっている', '〜に違いない', '〜どころか', '〜に伴って', '〜ものだから',
    '〜わけにはいかない', '〜からといって', '〜次第', '〜上で', '〜反面',
    '〜ぬく', '〜がち', '〜げ', '〜ぎみ',
  ].map((label) => ({ item_type: 'grammar', label })),

  N2: [
    '〜あげく', '〜一方だ', '〜おかげで', '〜かねる／かねない', '〜からには',
    '〜くせに', '〜げ', '〜ことに', '〜ざるを得ない', '〜しかない',
    '〜つつある', '〜において', '〜に応じて', '〜に限らず', '〜に加えて',
    '〜にすぎない', '〜に対して', '〜にほかならない', '〜にわたって', '〜ぬきで',
    '〜ばかりに', '〜べきではない', '〜ものの', '〜わけがない', '〜をきっかけに',
    '〜を通じて',
  ].map((label) => ({ item_type: 'grammar', label })),

  N1: [
    '〜あっての', '〜いかんによらず', '〜おいて', '〜が早いか', '〜がゆえに',
    '〜かたわら', '〜からある', '〜きらいがある', '〜ずくめ', '〜ずにはおかない',
    '〜たりとも', '〜つ〜つ', '〜てからというもの', '〜てやまない', '〜とあって',
    '〜といえども', '〜ないまでも', '〜にあたらない', '〜にかまけて', '〜にたえない',
    '〜に足る', '〜のいたり', '〜べからず', '〜まみれ', '〜をおいて',
    '〜を余儀なくされる',
  ].map((label) => ({ item_type: 'grammar', label })),
}

export const VOCAB_THEMES_BY_LEVEL: Record<JlptLevel, QuickCategory[]> = {
  N5: [
    '日常生活 (daily life)', '家族 (family)', '食べ物 (food)', '学校 (school)', '天気 (weather)',
    '買い物 (shopping)', '交通 (transportation)', '時間・予定 (time / schedule)', '体・健康 (body / health)', '趣味 (hobbies)',
  ].map((label) => ({ item_type: 'vocab', label })),

  N4: [
    '仕事 (work basics)', '気持ち・感情 (feelings)', '旅行 (travel)', '家事 (housework)', '季節・行事 (seasons / events)',
    '電話・メール (phone / email)', '病気・けが (illness / injury)', '約束・予定 (appointments)', '性格 (personality)', '街・場所 (town / places)',
  ].map((label) => ({ item_type: 'vocab', label })),

  N3: [
    '社会・くらし (society / life)', 'ニュース (news)', '環境 (environment)', '人間関係 (relationships)', '教育 (education)',
    'お金 (money)', '文化・習慣 (culture / customs)', '科学・技術 (science / technology)', 'スポーツ (sports)', '心理・気持ち (psychology)',
  ].map((label) => ({ item_type: 'vocab', label })),

  N2: [
    'ビジネス・仕事 (business / work)', '感情・気持ち (emotions)', '社会・ニュース (society / news)', '自然・環境 (nature / environment)', '健康・医療 (health / medicine)',
    '経済・お金 (economy / money)', '人間関係 (relationships)', '教育・学校 (education)', '政治・法律 (politics / law)', 'テクノロジー (technology)',
    '敬語表現 (keigo / polite speech)', 'オノマトペ (onomatopoeia)',
  ].map((label) => ({ item_type: 'vocab', label })),

  N1: [
    '学術・研究 (academia / research)', '政治・外交 (politics / diplomacy)', '経済・金融 (economics / finance)', '法律・司法 (law / judiciary)', '医療・福祉 (medicine / welfare)',
    '環境問題 (environmental issues)', 'メディア・報道 (media / journalism)', '国際関係 (international relations)', '哲学・思想 (philosophy / thought)', '文学・芸術 (literature / art)',
    'ビジネス・経営 (business / management)', '慣用句・ことわざ (idioms / proverbs)',
  ].map((label) => ({ item_type: 'vocab', label })),
}
