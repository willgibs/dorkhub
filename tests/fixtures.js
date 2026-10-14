// Hand-written pages in the v2 format, each built around one way a writer can bend it. The parser
// tests stream every one of them, a few characters at a time, alongside the recorded pages.

const HEAD = (/** @type {string} */ title) => `# ${title}
> A deck that makes the reader want to keep going.
~ You came here from the page before, and this is the moment it connects to.
+++
[[Lewis gun]] :: thing
[[Western Australian wheatbelt]] :: place
[[Campion]] :: place
[[Bren gun]] :: thing
---
`;
const TAIL = `>>>
[[Bren gun]] :: The gun that replaced it, and why the army wanted a lighter one.
===
- [[Bren gun]] :: The Czech design Britain adopted in 1935 :: deeper :: thing
- [[Campion]] :: A wheatbelt town that asked for soldiers :: sideways :: place
- [[Gizzard stone]] :: Why emus swallow pebbles :: wild :: mechanism
???
Why did the emus scatter?
How heavy was a Lewis gun?
Who asked for the army?
`;
const HOOKS = `&&&
[[Lewis gun]] :: A First World War machine gun sent after birds.
[[Western Australian wheatbelt]] :: Farmland carved from scrub after the war.
[[Campion]] :: The town at the centre of the campaign.
[[Bren gun]] :: The lighter gun that followed it.
`;

/** @type {{ title: string, text: string }[]} */
export const FIXTURES = [
  { title: 'clean: two panels, hooks last', text: `${HEAD('The Great Emu War')}In 1932 soldiers with a [[Lewis gun]] drove into the [[Western Australian wheatbelt]].

::: timeline
1932 :: Soldiers reach [[Campion]] with two guns
1932 :: The first ambush fails as the birds scatter
:::

The birds split into small groups and ran.
^ A note about the paragraph before the timeline's neighbour.

Later the army tried again, and the guns jammed in the dust.

::: compare Lewis gun | [[Bren gun|Bren]]
Weight :: 13 kg | 10 kg
Feed :: 47-round pan | 30-round box
:::

The campaign ended in December.
${TAIL}${HOOKS}` },
  { title: 'missing closer, ended by prose', text: `${HEAD('Lewis gun')}The [[Lewis gun]] was air-cooled.

::: facts
Weight :: 13 kg
Rate of fire :: about 550 rounds a minute
Its shrouded barrel pulled air along its length, a design copied for decades afterwards in other guns.

A second paragraph keeps going.
${TAIL}${HOOKS}` },
  { title: 'missing closer, ended by a heading and a note', text: `${HEAD('Bren gun')}The [[Bren gun]] came from Brno.

::: steps How it fed
Load :: A curved box sits on top
Fire :: Gas drives the bolt back
## Where it served
It served for decades.
^ An aside that also ends nothing.
${TAIL}` },
  { title: 'bulleted rows, a title, unknown type', text: `${HEAD('Campion')}[[Campion]] sits in the wheatbelt.

::: figures By the numbers
- 986 :: emus confirmed killed
- 9,860 :: rounds fired
:::

A paragraph between.

::: sparkline
2001 :: something
:::

The end.
${TAIL}${HOOKS}` },
  { title: 'extra and adjacent panels are dropped', text: `${HEAD('Emus')}First paragraph.

::: facts
Height :: up to 1.9 m
:::

::: myth
Myth :: The emus won.
Actually :: The army withdrew.
:::

Second paragraph.

::: guess
Question :: How many rounds were fired?
Answer :: About 10,000
Why :: The guns kept jamming in the dust.
:::

Third paragraph.

::: formula
Equation :: x = y
:::

Fourth paragraph.
${TAIL}${HOOKS}` },
  { title: 'a panel before the first paragraph', text: `${HEAD('Wheatbelt')}::: theories Why the birds came
Drought :: Dry seasons pushed them west :: accepted
Fences :: Rabbit-proof fences funnelled them :: partly
:::

The [[Western Australian wheatbelt]] drew farmers after the war.

A second paragraph follows it.
${TAIL}${HOOKS}` },
  { title: 'a panel between list items', text: `${HEAD('Soldier settlers')}Farmers took up land after the war.

- One item
- Two items

::: timeline
1920s :: Soldier settlers clear the land
1932 :: The emus arrive
:::

- Three items

A closing paragraph.
${TAIL}${HOOKS}` },
  { title: 'no hooks, hooks under +++, and "::" in prose', text: `${HEAD('C++ in the field')}Code like std::vector and an address like fe80::1 are prose, not panels.

The second paragraph mentions a [[Lewis gun]].
${TAIL}+++
[[Lewis gun]] :: Hooks under a second plan marker still count.
` },
];
