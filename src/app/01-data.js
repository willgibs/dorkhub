/* ================= data ================= */
/* Nerd levels: the deeper you read, the nerdier the paper gets */
const LEVELS = [
  { name: 'Curious', medium: 'Graph paper' },
  { name: 'Hooked', medium: 'Engineering pad' },
  { name: 'Invested', medium: 'Punch card' },
  { name: 'Obsessed', medium: 'Blueprint' },
  { name: 'Deep nerd', medium: 'Chalkboard' },
  { name: 'Specialist', medium: 'Amber phosphor' },
  { name: 'Galaxy brain', medium: 'Star chart' },
  { name: 'Beyond', medium: 'The void' },
];
const STRATA = LEVELS.map(l => l.name);
const ACC = {
  light: ['#2563EB', '#0E7C86', '#2F7D32', '#A16207', '#C2410C', '#BE123C', '#A21CAF', '#6D28D9'],
  dark: ['#93B4FF', '#5CD0D8', '#7FD483', '#F5B94A', '#FF9F6E', '#FF8A9E', '#F08CF5', '#B89CFF'],
};
const PAL = { light: ACC.light.map(a => ['#FCFCFB', '#18181B', a]), dark: ACC.dark.map(a => ['#111214', '#ECECEE', a]) };
/* Voices: the name and description shown in the voice menu. The wording the writer actually
   gets lives on the server, in lib/prompts.js. */
const LENSES = {
  encyclopedic: ['Encyclopedic', 'Precise and dense, like the best reference writing, but warm.'],
  story: ['Storyteller', 'Built around people, moments and scenes.'],
  nerd: ['Deep nerd', 'Mechanisms, numbers and jargon, briefly glossed.'],
  kid: ['Curious kid', 'For a sharp 12-year-old. Never condescending.'],
  skeptic: ['Skeptic', 'Separates what is known from what is claimed.'],
};
const EXAMPLE_DIG = ['Voynich manuscript', 'Radiocarbon dating', 'Bomb pulse', 'Adult neurogenesis', 'Hippocampus', 'Path integration', 'Grid cells', 'Hexagonal lattices'];

/* A prewritten rabbit hole: the demo reads without spending a page, even offline. */
const DEMO = {
  'voynich manuscript': `# Voynich manuscript
> A 15th-century illustrated book written in a script nobody has ever convincingly read.
~ A great first page: a real object you can look at, a century of failed codebreakers, and links leading into botany, astronomy, cryptography and forgery.
@ drift 0
: Held at = Beinecke Library, Yale (MS 408)
: Vellum dated = 1404–1438, by radiocarbon
: Pages = About 240 survive
: Script = Unknown, unread so far

The Voynich manuscript is a small handwritten codex filled with an unknown alphabet and strange illustrations: plants that match no identified species, circular star charts, and pages of women bathing in green pools connected by tubes. It takes its name from [[Wilfrid Voynich]], a Polish antiquarian bookseller who bought it in 1912, and it now lives at Yale's [[Beinecke Rare Book and Manuscript Library]].

## What is on the pages
Scholars usually divide the book by its pictures: a botanical section, an astronomical or [[astrology|astrological]] section with zodiac-like wheels, a "balneological" section of bathing figures, a pharmaceutical section of jars and roots, and a final stretch of dense text marked with stars in the margins. The writing flows confidently, with few corrections, which suggests the scribe knew exactly what they were writing, whatever it was.

## Old, but how old?
For decades, guesses about its age ranged from the 13th century to a modern forgery. In 2009, researchers used [[radiocarbon dating]] on samples of the vellum and placed the animal skins between roughly 1404 and 1438. That dates the parchment rather than the ink, but most specialists now accept an early 15th-century origin, possibly in Central Europe.

## A chain of owners
A 1665 letter found tucked inside claims the book was once bought by the Holy Roman Emperor [[Rudolf II]] for 600 ducats, though that story is secondhand. It later reached the Jesuit scholar [[Athanasius Kircher]], who was sent it as a puzzle, and spent centuries in Jesuit hands before Voynich acquired it.

## A century of failed readings
Codebreakers, including [[William Friedman]], who worked on military ciphers in both world wars, tried and failed to crack it. Statistical studies find word patterns that resemble natural language, including a rough fit to [[Zipf's law]], yet the text also repeats words in ways real languages rarely do. Some researchers argue it is an elaborate [[hoax]]; others propose a lost language, a cipher, or an invented script. New claimed decipherments appear almost every year, and so far none has convinced the field.

===
- [[Radiocarbon dating]] :: How a scrap of calfskin got its birthday back. :: deeper
- [[Zipf's law]] :: Why "the" beats every other word, in almost every language. :: deeper
- [[Rudolf II]] :: The emperor who collected alchemists, clocks and curiosities. :: sideways
- [[Athanasius Kircher]] :: A 17th-century polymath who tried to decode everything. :: sideways
- [[Codex Seraphinianus]] :: A 1981 encyclopedia written in an invented script, on purpose. :: wild
>>>
[[Radiocarbon dating]] :: The book's age is the one hard fact anyone has. Here is how it was measured.
^^^
2 :: The bathing pages are the strangest: some read the tubes as plumbing, others as anatomy, others as allegory.
4 :: Kircher also believed he had deciphered Egyptian hieroglyphs. He had not.
5 :: Friedman came to suspect an early artificial "philosophical" language, an idea others have since revived.
???
Could the Voynich manuscript be a medical text?
Has AI been used to try to decode it?
Why would anyone fake a book in an unreadable script?
+++
[[Wilfrid Voynich]] :: Antiquarian bookseller who bought the manuscript in 1912. :: person
[[Beinecke Rare Book and Manuscript Library]] :: Yale's library for rare books and manuscripts. :: place
[[astrology]] :: Tradition of reading meaning into the positions of stars and planets. :: idea
[[Radiocarbon dating]] :: A clock hidden in every living thing that starts at death. :: mechanism
[[Rudolf II]] :: Holy Roman Emperor from 1576 to 1612, patron of alchemy and science. :: person
[[Athanasius Kircher]] :: 17th-century Jesuit scholar of languages, geology and magnetism. :: person
[[William Friedman]] :: Pioneering American cryptologist of the 20th century. :: person
[[Zipf's law]] :: The strange rule that makes "the" win in almost every language. :: phenomenon
[[hoax]] :: A deliberate deception presented as genuine. :: idea
[[Codex Seraphinianus]] :: Luigi Serafini's illustrated encyclopedia in an invented script. :: work`,

  'radiocarbon dating': `# Radiocarbon dating
> A clock built into every living thing, which starts ticking the moment it dies.
~ You came down from the Voynich manuscript, whose vellum was dated this way to 1404–1438. Here is how a lab can read a calf's death date from a page of parchment.
@ drift 38
: Developed = Late 1940s, by Willard Libby
: Isotope = Carbon-14
: Half-life = About 5,730 years
: Useful range = Up to roughly 50,000 years

Radiocarbon dating estimates the age of once-living material by measuring how much [[carbon-14]] it still contains. The method was developed by the chemist [[Willard Libby]] and colleagues at the University of Chicago in the late 1940s, and it earned Libby the [[Nobel Prize in Chemistry]] in 1960.

## Where the carbon-14 comes from
High in the atmosphere, [[cosmic rays]] knock neutrons loose, and some of those neutrons strike nitrogen-14 atoms and turn them into carbon-14. That radioactive carbon ends up in carbon dioxide, plants take it in through [[photosynthesis]], and animals eat the plants. While an organism is alive, its ratio of carbon-14 to ordinary carbon-12 roughly matches the air around it.

## The clock starts at death
When an organism dies it stops taking in new carbon, and its carbon-14 decays with a half-life of about 5,730 years. Measure how much is left, compare it with how much there should have been, and you get an age. The calf whose skin became Voynich vellum stopped eating grass sometime in the early 1400s; the lab measured that moment, not the moment someone picked up a pen.

## Why raw dates need correcting
The amount of carbon-14 in the atmosphere has not been constant, so raw radiocarbon ages are adjusted with [[calibration curves]] built from tree rings ([[dendrochronology]]), lake sediments, cave formations and corals. [[Accelerator mass spectrometry]] counts carbon-14 atoms directly, which is why milligrams of material can now be enough.

## When humans broke the clock
Burning fossil fuels, which contain no carbon-14, dilutes the atmospheric signal. And in the 1950s and 60s, above-ground nuclear weapons tests nearly doubled the carbon-14 in the air of the Northern Hemisphere, a spike known as the [[bomb pulse]]. That spike is a nuisance for some measurements and a gift for others.

===
- [[Bomb pulse]] :: How Cold War bomb tests left a timestamp in every living body. :: deeper
- [[Accelerator mass spectrometry]] :: Counting atoms one by one instead of waiting for decays. :: deeper
- [[Dendrochronology]] :: Reading centuries of weather from tree rings. :: sideways
- [[Willard Libby]] :: The chemist who turned decay into a calendar. :: sideways
- [[Shroud of Turin]] :: The most argued-about radiocarbon result of all. :: wild
>>>
[[Bomb pulse]] :: The moment humans broke the carbon clock, and accidentally built a better one.
^^^
1 :: Libby's team first checked the method on objects of known age, including wood from ancient Egyptian tombs.
3 :: Back to the [[Voynich manuscript]]: its vellum was dated this way, which fixes the parchment's age but not the ink's.
4 :: Calibration curves are revised every few years as new tree-ring, cave and coral records come in.
???
Why can't radiocarbon date dinosaur bones?
How is a sample cleaned before it is dated?
What other radioactive clocks do scientists use?
+++
[[carbon-14]] :: Radioactive isotope of carbon with a half-life of about 5,730 years. :: thing
[[Willard Libby]] :: American chemist who developed radiocarbon dating. Nobel Prize, 1960. :: person
[[Nobel Prize in Chemistry]] :: Annual prize for major achievements in chemistry. :: thing
[[cosmic rays]] :: High-energy particles from space that strike Earth's atmosphere. :: thing
[[photosynthesis]] :: How plants turn light, water and carbon dioxide into sugar. :: idea
[[calibration curves]] :: Records that convert radiocarbon ages into calendar dates. :: idea
[[dendrochronology]] :: Reading centuries of weather from the rings of a single tree. :: mechanism
[[Accelerator mass spectrometry]] :: A technique that counts individual carbon-14 atoms. :: idea
[[bomb pulse]] :: Cold War bomb tests left a timestamp inside every living body. :: phenomenon
[[Shroud of Turin]] :: Linen cloth radiocarbon-dated in 1988 to the Middle Ages. :: thing
[[Voynich manuscript]] :: The unreadable 15th-century book where this rabbit hole began. :: work`,

  'bomb pulse': `# Bomb pulse
> The spike in atmospheric carbon-14 from Cold War nuclear tests, now used to date everything from wine to human brain cells.
~ From radiocarbon dating you followed the thread where humans broke the clock. The break itself turned out to be one of the most precise clocks we have.
@ drift 71
: Cause = Above-ground nuclear tests, mid-1950s to 1963
: Peak = Mid-1960s, near double natural levels
: Turning point = Partial Test Ban Treaty, 1963
: Used for = Dating cells, wine, ivory and more

Between the mid-1950s and 1963, hundreds of above-ground [[nuclear weapons testing|nuclear weapons tests]] flooded the atmosphere with neutrons. Those neutrons created extra [[carbon-14]], and in the Northern Hemisphere its level in the air climbed to nearly twice its natural value by the mid-1960s. After the [[Partial Test Ban Treaty]] of 1963 pushed most testing underground, the excess began to fall as oceans and plants absorbed it.

## A curve with a sharp edge
Ordinary radiocarbon dating works in centuries. The bomb curve works in years. Because the atmospheric level rose and fell so steeply, measuring carbon-14 in something that formed after the mid-1950s can often pin its formation to within a year or two. Every plant, animal and person alive since then carries that signature, written into tissues as they formed.

## Your body as a timeline
In 2005 a team led by the Swedish researcher [[Jonas Frisén]] used the bomb pulse to estimate the age of cells in the human body, reasoning that a cell's DNA is laid down once, when the cell is born. The approach has since been used to study how often [[fat cells]], heart muscle cells and neurons in the [[hippocampus]] are replaced in adults. Forensic scientists use it too: carbon-14 in [[tooth enamel]], which forms in childhood, can help estimate the birth year of unidentified remains.

## Catching fakes and poachers
The same signal separates old goods from new. It has been used to test claims about vintage wine, and wildlife investigators apply it to seized [[elephant ivory]] to show whether tusks came from animals killed after international trade bans, which matters in court.

## A fading clock
The bomb signal is slowly disappearing as it spreads through the oceans and as fossil-fuel carbon dilutes the air. That makes it an unusual scientific tool: a precise clock that only works for one stretch of human history.

===
- [[Adult neurogenesis]] :: Does the adult brain grow new neurons? The argument continues. :: deeper
- [[Tooth enamel]] :: The hardest tissue in your body doubles as a birth certificate. :: deeper
- [[Partial Test Ban Treaty]] :: The 1963 deal that moved the bombs underground. :: sideways
- [[Elephant ivory]] :: How carbon dating became a tool against poaching. :: sideways
- [[Castle Bravo]] :: The 1954 test that came out more than twice as big as planned. :: wild
>>>
[[Adult neurogenesis]] :: The bomb pulse's most famous use: asking whether you are still growing new brain cells.
^^^
1 :: The oceans are slowly soaking up the excess, which is why the signal keeps fading.
3 :: Full circle from the [[Voynich manuscript]]: the same carbon-14 that dated a medieval calf now dates your own cells.
4 :: The ivory work relies on the same curve: a tusk's growth layers record when each one formed.
???
Is the bomb pulse visible in the Southern Hemisphere too?
How precise is bomb-pulse dating for one person?
What will replace it once the signal fades?
+++
[[nuclear weapons testing]] :: Detonations carried out to develop and demonstrate nuclear weapons. :: event
[[carbon-14]] :: Radioactive isotope of carbon with a half-life of about 5,730 years. :: thing
[[Partial Test Ban Treaty]] :: 1963 treaty banning nuclear tests in the air, space and underwater. :: event
[[Jonas Frisén]] :: Swedish stem-cell researcher who pioneered bomb-pulse cell dating. :: person
[[fat cells]] :: Cells that store energy as fat, replaced slowly over years. :: thing
[[hippocampus]] :: Brain region central to memory and navigation. :: thing
[[tooth enamel]] :: Mineralized outer layer of teeth, formed in childhood. :: thing
[[elephant ivory]] :: Tusk material whose international trade is heavily restricted. :: thing
[[Adult neurogenesis]] :: Does your adult brain still grow new neurons? Scientists still argue. :: mystery
[[Castle Bravo]] :: 1954 US hydrogen bomb test, far larger than predicted. :: event
[[Voynich manuscript]] :: The unreadable 15th-century book where this rabbit hole began. :: work`,
};
