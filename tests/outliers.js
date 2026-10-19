// The outliers: what a writer can send that a prompt asks it not to. Every page is generative, so the page has to
// hold these as well as it holds a tidy one (Will, 2026-10-19). Real names where they exist: the Welsh village, the
// lung disease and the German law each have an encyclopedia article of their own.
// Used by the parser tests and by the browser walk (scripts/e2e.mjs), which serves this page for QUESTION.

export const VILLAGE = 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch';
export const DISEASE = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
export const LAW = 'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz';
export const RULES = 'The International Commission on Zoological Nomenclature and its rules for naming a species from a single specimen';
/* a typed question of 149 characters, near the composer's limit of 160 */
export const QUESTION = 'Why do some deep-sea anglerfish males fuse permanently into the bodies of much larger females, sharing their blood supply for the rest of their lives?';

const LONG_HOOK = 'A mating system in which the male becomes part of the female for the rest of his life, sharing her blood, her skin and in some species even her bones';

/** The page for QUESTION (or any title): long names, unbroken words, a long heading, wide panel cells, long questions. */
export const outlierPage = (/** @type {string} */ title = QUESTION) => `# ${title} :: creature
> In the lightless deep, a male anglerfish a few millimetres long can bite a female many times his size, fuse to her body and live on as a permanent part of her, his blood running into hers.
!!!
Smallest mature males on record :: About 6 to 7 millimetres long, roughly the size of a grain of rice
Largest females :: Up to about 1.2 metres
Longest name on this page :: ${VILLAGE}
+++
[[Sexual parasitism]] :: phenomenon
[[Ceratias holboelli]] :: creature
[[Major histocompatibility complex]] :: mechanism
[[Bioluminescent lure]] :: thing
[[${VILLAGE}]] :: place
[[${DISEASE}]] :: concept
[[${LAW}]] :: thing
[[${RULES}]] :: concept
[[Dana expeditions]] :: event
[[Tate Regan]] :: person
---
In the deep sea a female anglerfish can go weeks without meeting another of her kind, and a few species have answered that with [[Sexual parasitism]]: the male bites into her side and stays. In [[Ceratias holboelli]] the two bodies fuse until their blood runs together, and the male becomes little more than a source of sperm she carries for life. Naming such a fish from one preserved female, with a male still fused to her, tested [[the rules for naming a species from a single specimen|${RULES}]], and the longest words on this page, [[${DISEASE}]] among them, are here only to see whether a column can hold them.
^ ${LAW} was the real name of a German law, repealed in 2013, and no column on any screen is wide enough for it on one line.

## Why a male that gives up his eyes, his fins and most of his own organs to become a permanent part of a female's body is not an evolutionary dead end
Fusion would kill most animals: the female's immune system should treat the male as a graft and reject him. A study in 2020 found that fused species have lost much of the [[Major histocompatibility complex]], the part of the immune system that recognises foreign tissue, which lets the male stay. The female still hunts with her [[Bioluminescent lure]], so one meal feeds two bodies, and a mate is never more than a few millimetres away. The trade only pays in the emptiest water, which may be why it evolved more than once and only there.
::: compare Free-living males | Fused males
Body length when mature :: About 6 to 10 millimetres, depending on the species and how deep it lives | Similar at first, then growing slowly while attached to the female
Longest single word in a cell :: ${DISEASE} | ${VILLAGE}
Feeding :: Never feeds after the larval stage | Fed entirely through the female's blood
:::

## Records
The first fused males were noticed on females brought up by the [[Dana expeditions]], and [[Tate Regan]] described them in 1925, choosing the word parasite that biologists still argue over. A village in Anglesey, [[${VILLAGE}]], has nothing to do with any of it, and is here because its name is the longest link a page might carry. Its name was stretched in the 1860s to draw tourists off the railway, and the sign on its station is famous for running past the edge of most photographs.
::: timeline
Between about 1922 and 1925, during the Danish Dana expeditions :: The first fused males are noticed on preserved females brought up from the deep
1925 :: Tate Regan calls the fused males of Ceratias holboelli parasites, a word still argued over a century later
2020 :: A study in Science links fusion to the loss of parts of the immune system
:::
===
- [[${VILLAGE}]] :: A Welsh village renamed in the 1860s to draw tourists off the railway :: place
- [[${RULES}]] :: Why a species can be named from one preserved female with a male fused to her side, and what happens when the name turns out to be wrong :: concept
- [[${LAW}]] :: A German law whose name ran to 63 letters :: thing
- [[Bioluminescent lure]] :: The glowing bait, lit by bacteria the fish cannot make for itself :: gizmo
- [[Major histocompatibility complex]] :: How fused fish dodge rejection :: mechanism
- [[${DISEASE}]] :: Coined in 1935 to be the longest word in an English dictionary :: concept
???
Why would an anglerfish male give up his eyes, his fins and his organs to fuse with a female many times his size, for good?
How do fused anglerfish avoid the immune rejection that destroys most transplanted organs in other animals, including us?
Is ${VILLAGE} really the longest place name in Europe?
&&&
[[Sexual parasitism]] :: ${LONG_HOOK}
[[Ceratias holboelli]] :: The anglerfish whose fused males were the first ever described, in 1925
[[Major histocompatibility complex]] :: The immune system's way of telling self from other, given up by the fused species
[[Bioluminescent lure]] :: A glowing fishing rod on the head, lit by bacteria living inside it
[[${VILLAGE}]] :: A name stretched to 58 letters in the 1860s to draw tourists off the railway
[[${DISEASE}]] :: ${DISEASE}, coined in 1935 to be the longest word in a dictionary
[[${LAW}]] :: A law about labelling beef, named in one word of 63 letters
[[${RULES}]] :: ${LONG_HOOK}
[[Dana expeditions]] :: Danish voyages that brought up the first fused males from the deep
[[Tate Regan]] :: The ichthyologist who named the fused males parasites in 1925
`;

/** Around this, for any page: ten neighbours, some with names and relations far longer than the task asks for. */
export const OUTLIER_AROUND = JSON.stringify([
  { name: VILLAGE, relation: 'A name stretched to 58 letters in the 1860s to draw tourists off the railway and onto the platform', kind: 'place', bearing: 'elsewhere', distance: 3 },
  { name: RULES, relation: 'How a species can be named from a single preserved female with a male still fused to her side', kind: 'idea', bearing: 'science', distance: 2 },
  { name: LAW, relation: 'A German law about labelling beef, named in one word', kind: 'thing', bearing: 'culture', distance: 3 },
  { name: DISEASE, relation: 'The longest word in a major English dictionary', kind: 'idea', bearing: 'elsewhere', distance: 3 },
  { name: 'Sexual parasitism', relation: 'The mating system itself', kind: 'idea', bearing: 'science', distance: 1 },
  { name: 'Major histocompatibility complex', relation: 'The immune genes the fused species lost', kind: 'thing', bearing: 'mechanism', distance: 1 },
  { name: 'Bioluminescent lure', relation: 'The glowing bait on the female\'s head', kind: 'thing', bearing: 'mechanism', distance: 1 },
  { name: 'Dana expeditions', relation: 'The voyages that found the first fused males', kind: 'event', bearing: 'history', distance: 2 },
  { name: 'Tate Regan', relation: 'Named the fused males parasites in 1925', kind: 'person', bearing: 'people', distance: 2 },
  { name: 'Marine snow', relation: 'The falling food the deep lives on', kind: 'thing', bearing: 'science', distance: 2 },
]);
