/* ================= recorded writer output, replayed for free =================
   Raw pages and quick-tool answers a real writer produced for the exact prompts in
   lib/prompts.js, following real rabbit holes link by link. The mock writer (lib/mock.js)
   replays one whenever a reader asks for the same thing, at a writer's pace, so local
   development, the browser test and preview deployments read like the real thing at no cost.
   The parser tests run against every recorded page.

   `source` says who wrote each one. "Claude Haiku 5.5 stand-in" means it was written before
   Dorkhub's AI Gateway had credits: Claude Haiku 5.5, the trial's model, given the production
   prompt verbatim through a Claude Code subagent (which thinks before answering, unlike the
   trial). Replace stand-ins with live output once it exists. Add or replace entries with
   scripts/recorded.mjs; a page's `title` is the title as requested, before it was written. */

/** @type {{ task: string, key: string, source: string, text: string }[]} */
export const RECORDED_TOOLS = [
  {
    task: "sketch",
    key: "tulip breaking virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `{"shape": "chain", "title": "How an aphid spreads the virus", "caption": "Stylet-borne transmission: the virus clings to an aphid's stylet tip, so short probes move it between plants.", "nodes": [{"label": "Aphid probes infected plant", "note": "Its fine stylet pushes into plant tissue"}, {"label": "Virus clings to stylet", "note": "Sits on the tip, not inside the gut"}, {"label": "Probe on next plant", "note": "Only seconds of probing can be enough"}, {"label": "Virus dropped, plant infected", "note": "The same aphid also spreads Potato virus Y"}], "links": ["picks virus up", "moves it onward", "drops it off"]}`,
  },
  {
    task: "thread",
    key: "tulip mania > tulip breaking virus > tobacco mosaic virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `You started at Tulip mania, where Dutch traders staked fortunes on bulbs until the buyers all but vanished in February 1637. The next page explains the stripes that made some bulbs rare. They were no artist's work. Botanists trace them to the Tulip breaking virus, which nobody in the 1630s could have named, and that is the most surprising turn: a market mania rested on a disease no one could see. The leap onward feels natural, because the virus's first clue slipped through a filter built to stop bacteria. The same kind of filter test, run on tobacco in 1892, led you to Tobacco mosaic virus, the first virus ever crystallised, photographed and rebuilt from its parts. Each page answered the question the last one raised, and you finished with a virus that could be taken apart and put back together.

Thread: Invisible causes revealed by visible effects`,
  },
  {
    task: "quiz",
    key: "tulip mania > tulip breaking virus > tobacco mosaic virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `[{"q": "Which tulip variety was the star of the Dutch bulb market in the 1630s?", "options": ["Silver Dawn", "Golden Lantern", "Semper Augustus", "Violet Crown"], "answer": 2, "why": "The page names Semper Augustus, a striped variety, as the star of the market.", "chamber": "Tulip mania"}, {"q": "Why was most of the tulip trading in 1636 and 1637 made up of promises?", "options": ["Bulbs lifted only in summer", "Taverns banned tulip deals", "Bulbs were banned from sale", "Bulbs bloomed only in winter"], "answer": 0, "why": "Bulbs could only be dug up in summer, so most trading was in contracts for bulbs not yet available.", "chamber": "Tulip mania"}, {"q": "Which insect carries the virus behind tulip stripes?", "options": ["Honey bee", "Japanese beetle", "Ladybird beetle", "Green peach aphid"], "answer": 3, "why": "The page lists the green peach aphid as the carrier, with aphids and infected bulbs as the ways it spreads.", "chamber": "Tulip breaking virus"}, {"q": "After passing through Ivanovsky's Chamberland filter, what did the liquid still do?", "options": ["Was fully strained out", "Made healthy plants sick", "Turned into a bacterium", "Killed the aphids"], "answer": 1, "why": "The page says the liquid that came through the Chamberland filter still made healthy plants sick.", "chamber": "Tulip breaking virus"}, {"q": "Roughly how many identical protein pieces make up the tobacco mosaic virus coat?", "options": ["About 300", "About 6,400", "About 2,130", "About 1,000"], "answer": 2, "why": "The page gives the coat as about 2,130 identical protein pieces, while 6,400 is the RNA genome's base count.", "chamber": "Tobacco mosaic virus"}]`,
  },
  {
    task: "peek",
    key: "tulip breaking virus | green peach aphid",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `The Green peach aphid (Myzus persicae) is a sap-sucking insect that attacks hundreds of plant species, not just peaches. Females usually bear live young without mating, and those young can be born already carrying embryos of their own, a pattern called [[Telescoping generations]]. Aphids also host [[Buchnera aphidicola]], a bacterium that supplies amino acids missing from sap. It is reported to transmit more than 100 plant viruses, though counts vary by source. In this passage it matters as the usual carrier: the tulip virus clings to its stylet and hops between plants in two quick probes.`,
  },
  {
    task: "unfold",
    key: "tulip breaking virus | deeper | six years later the delft microbiologist martinus beijerinck",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `A virus cannot grow on a dish because it is an [[Obligate intracellular parasite]]: it has no metabolism of its own, so it copies its genome and builds its coat with the host's machinery. A tobacco mosaic virus particle is a rod roughly 300 by 18 nanometres, made of about 2,130 identical protein subunits coiled around 6,400 bases of RNA. Stanley called his crystals a protein, but the RNA, about 5 percent by weight, carries the infection; Fraenkel-Conrat and Williams showed in 1955 that RNA alone is infectious. Stranger still, [[Viroids]] are a few hundred bases of RNA with no protein, and still cause disease.`,
  },
  {
    task: "doubt",
    key: "growers never saw the virus behind their stripes but its first clue slipped thro",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `[
  {"quote": "Ivanovsky himself leaned towards a toxin rather than a living germ", "note": "Attributing a specific view to Ivanovsky is an interpretation of his 1892 work, so check it against that paper or a standard history of tobacco mosaic virus before relying on the attribution.", "rating": "check"},
  {"quote": "Wendell Stanley crystallised it, a first for any virus", "note": "Stanley's 1935 crystallisation of tobacco mosaic virus is well documented and generally cited as the first virus ever crystallised, so the superlative holds, though a quick look at a standard history will confirm the date and wording.", "rating": "solid"},
  {"quote": "A petal's colour comes largely from Anthocyanin", "note": "Anthocyanins explain red, purple and blue petals, but yellow and cream colours come mainly from carotenoids and flavonoids, so saying petal colour comes largely from anthocyanin overstates the point and sits badly with the pale ground colour the page itself relies on.", "rating": "shaky"},
  {"quote": "a seedling could take five to seven years to bloom at all", "note": "Five to seven years is a common rule of thumb for seed-raised tulips, but time to flowering varies by cultivar and growing conditions, so confirm the range against a bulb-breeding or horticultural source before quoting it.", "rating": "check"},
  {"quote": "the one most likely to carry the virus", "note": "Roguing targets streaked plants because streaks signal infection, but saying the most striking plant is the most likely carrier oversimplifies, since infection can be present without obvious streaks, so check the rationale in an extension or breeding source.", "rating": "check"}
]`,
  },
  {
    task: "around",
    key: "tulip breaking virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `[
  {"name": "Semper Augustus", "relation": "The bubble's priciest broken tulip; the virus caused its streaks.", "kind": "thing", "bearing": "history", "distance": 1},
  {"name": "Green peach aphid", "relation": "The aphid that spreads the virus between tulips.", "kind": "creature", "bearing": "mechanism", "distance": 1},
  {"name": "Carolus Clusius", "relation": "The Leiden botanist who first grew tulips in the Netherlands.", "kind": "person", "bearing": "people", "distance": 2},
  {"name": "Tobacco mosaic virus", "relation": "Another plant virus, and the first ever identified.", "kind": "thing", "bearing": "science", "distance": 2},
  {"name": "Dutch vanitas painting", "relation": "Still lifes painted striped tulips to show beauty and wealth fade.", "kind": "idea", "bearing": "culture", "distance": 2},
  {"name": "Anthocyanin pigment", "relation": "The petal pigment the virus scrambles into streaks.", "kind": "thing", "bearing": "mechanism", "distance": 2},
  {"name": "Dutch elm disease", "relation": "Another plant plague the Dutch identified: a fungus spread by beetles.", "kind": "event", "bearing": "elsewhere", "distance": 3},
  {"name": "Ottoman Tulip Era", "relation": "Istanbul's own tulip craze, with gardens, feasts and poetry.", "kind": "era", "bearing": "culture", "distance": 3}
]`,
  },
  {
    task: "recap",
    key: "tulip mania > tulip breaking virus > tobacco mosaic virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Recap: From tulip mania to tobacco mosaic virus

You started with Dutch traders who staked fortunes on tulip bulbs until the buyers all but vanished in February 1637. From there you followed the stripes to the virus behind them, then to the tobacco leaves where its first clue turned up. The path narrows from a market to a single rod-shaped particle about 300 nanometres long.

## Five things you now know

- Bulbs could only be lifted in summer, so most of the winter 1636–37 trade was in promises: contracts for bulbs nobody would see until the following summer.
- The tulip breaking virus is a Potyvirus, the largest of the plant viruses, carried by green peach aphids and also spread through infected bulbs.
- Dmitri Ivanovsky squeezed sap from diseased tobacco leaves and forced it through a Chamberland filter, a porcelain candle built to strain bacteria from liquids, and whatever caused the disease slipped straight through.
- A tobacco mosaic virus particle is a rod about 300 nanometres long, its roughly 6,400 bases of RNA wrapped in about 2,130 identical protein pieces.
- Tobacco mosaic virus was first passed by sap in the Netherlands in 1886, six years before Ivanovsky's filter test.

## The strangest connection

The first clue to the virus behind those tulip stripes came from tobacco, not tulips. It slipped through a filter built to stop bacteria in 1892, more than 250 years after the bulb collapse.

## Where to dig next

- Aphid stylet: the needle-like mouthpart that can carry a Potyvirus from one plant to the next.
- Movement protein: how a virus travels from cell to cell once it is inside a leaf.
- Prion: an infectious agent made of protein with no genetic material at all, a sharp contrast to a virus with one strand of RNA.`,
  },
];

/** @type {{ title: string, source: string, text: string }[]} */
export const RECORDED = [
  {
    title: "The Great Emu War",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# The Great Emu War
> In 1932 Australia sent machine guns against a flock of emus, and the emus outlasted the soldiers.
~ You start with the emus, and this war leads on to a rabbit-proof fence, a First World War machine gun and a 1940s plan to steer bombs with pigeons.
@ drift 0
: Estimated flock = roughly 20,000 emus, figures vary
: Army force = Major Meredith and two Lewis guns
: Official tally = 986 birds shot
: Result = soldiers withdrew; the emus stayed
%%%
1901 :: Western Australia begins its rabbit-proof fence against rabbits
1932 :: Emus move into the Campion district, trampling crops and fences
1932 :: Farmers appeal for help, and soldiers arrive with two Lewis guns
1932 :: Soldiers withdraw after an official tally of 986 birds shot
+++
[[Lewis gun]] :: A pan-magazine machine gun from the First World War, now aimed at birds :: thing
[[Rabbit-proof fence]] :: Built to keep rabbits out, and damaged by emus in 1932 :: thing
[[Thomas Austin's rabbits]] :: Twenty-four rabbits released in Victoria in 1859 spread across the continent :: event
[[Campion district]] :: The farming district where two army machine guns faced an estimated flock :: place
[[Western Australian wheatbelt]] :: Grain country where returned soldiers battled birds and a collapsing wheat price :: place
[[Soldier settlement schemes]] :: Post-war land grants that often gave returned soldiers poor blocks and heavy debt :: mechanism
[[Dingo fence]] :: The world's longest fence, built to keep dingoes out of sheep country :: thing
[[Trove]] :: The National Library's digitised newspapers, holding the war's original 1932 coverage :: thing
[[Southern cassowary]] :: A forest relative whose inner toe carries a dagger-like claw :: creature
[[Dingo]] :: Australia's wild dog, with an origin story still argued over :: creature
---
In 1932 a flock of emus moved into the [[Campion district]] of the [[Western Australian wheatbelt]] and began eating the crops. Emus stand up to about 1.9 metres, are the second-tallest living birds after the ostrich, and cannot fly at all. Their close relative, the [[Southern cassowary]], lives in rainforest and carries a dagger-like claw on its inner toe. The farmers who held the land, many of them returned soldiers, asked for help, and the government answered by sending the army.
^ Emus can reach about 50 km/h, faster than any human sprinter has ever run.

## Settlers on marginal ground

Many of the farms in the [[Campion district]] were a product of post-war land policy. After the First World War, returned soldiers were settled on blocks under [[Soldier settlement schemes|soldier settlement schemes]], which often gave them poor soil and heavy debt. Wheat prices then collapsed through the Depression, leaving little margin for a bad season, let alone a flock of birds.

Emus eat grass, seeds and insects, and a ripening paddock was an easy meal. The birds also damaged the [[Rabbit-proof fence|rabbit-proof fence]], a wire barrier built to keep rabbits out of the farmland, and a barrier with gaps does little good.

## Two Lewis guns against a flock

The army sent Major G. P. W. Meredith with two [[Lewis gun|Lewis guns]], light machine guns with a distinctive drum-like pan magazine on top. Each pan held 47 rounds, and the ammunition was .303 British, the same cartridge as the infantry rifle. Accounts describe the flock splitting into small mobs, running off in different directions and regrouping out of range, so the gunners fired thousands of rounds at birds that kept moving.

The army's own tally was 986 birds shot, a figure that rests on official reports and the newspapers that repeated them. A tally of that kind counts only the birds found afterwards, so treat it as the army's version rather than a precise count. The soldiers pulled out in November, and the emus stayed in the district.
^ The same kind of gun had fired on the Western Front only fourteen years before.

## Fences, rabbits and dingoes

Rabbits were the reason the fence existed in the first place. [[Thomas Austin's rabbits|Twenty-four rabbits released in 1859]] multiplied and spread, and by the turn of the century they had reached farmland in several colonies. Governments built barriers against them, and Western Australia's rabbit-proof fence was one of those barriers.
^ Austin wanted something to hunt, and the continent got a plague instead.

The same logic built the [[Dingo fence|dingo fence]], more than 5,000 kilometres of wire meant to keep [[Dingo|dingoes]] out of sheep country. It was built in sections over several decades, a sign of how far the idea could be pushed.

## What the record keeps

Much of what is known about the war comes from the 1932 press, which is searchable in [[Trove]], the National Library's digitised newspaper archive. Read those pages with care, since many repeat the army's own figures. Reactions were mixed, with some papers treating the episode as a joke and others taking the farmers' losses seriously. Emus remain common across much of Australia today.

===
- [[Emu migration]] :: Emus wander after rain, so flocks turn up with little warning :: deeper :: phenomenon
- [[.303 British cartridge]] :: The rifle round that fed the Lewis gun from trench to scrubland :: deeper :: thing
- [[Myxomatosis]] :: A 1950 virus release that worked spectacularly, until resistance crept in :: sideways :: event
- [[Ostrich feather boom]] :: Victorian hats once made ostrich plumes a fortune, until fashion moved on :: sideways :: era
- [[Project Pigeon]] :: Birds drafted into war too: pigeons once tried to steer bombs :: wild :: event
>>>
[[Rabbit-proof fence]] :: The structure the emus damaged, and the rabbit story it was built to hold back.
???
Did the army really shoot 986 emus?
Why did the gunners struggle to hit fast-moving birds?
What happened to the farms after the soldiers left?
`,
  },
  {
    title: "Lanchester's laws",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Lanchester's laws
> Put 100 aimed rifles against 80 and the winner keeps 60, not 20, and the reason is stranger than it sounds.
~ The line that brought you here made the emu campaign look winnable on paper, and this is the arithmetic behind that line, including the part the emus broke.
@ drift 30
: Developed by = Frederick W. Lanchester, British engineer
: First published = 1916, in Aircraft in Warfare
: Square law = strength grows with numbers squared
: Linear law = strength grows in step with numbers
%%%
1914 :: Lanchester works on the combat equations during the First World War.
1916 :: Lanchester publishes the square and linear laws in Aircraft in Warfare.
1954 :: Joseph Engel tests the square law against Second World War records.
+++
[[Aircraft in Warfare]] :: Lanchester's 1916 book, where the two laws were set out. :: work
[[Phalanx]] :: Overlapping shields, one opponent per man: the world of the linear law. :: thing
[[Aimed fire]] :: One assumption, aimed fire, is what squares the numbers. :: technique
[[Concentration of force]] :: Lanchester turned an old military maxim into testable arithmetic. :: concept
[[Conserved quantity]] :: One combination of the two forces stays fixed until one side is gone. :: concept
[[Monte Carlo method]] :: Modern war models run thousands of randomised battles to test the equations. :: technique
[[Frederick Lanchester]] :: British car builder and aerodynamicist who also wrote the combat equations. :: person
[[Disc brake]] :: The equations' author also patented an early disc brake, in 1902. :: thing
[[Pincer movement]] :: Splitting an army to encircle an enemy, the move the square law punishes. :: technique
[[Dogfight]] :: Lanchester's 1916 equations were written with air combat in mind. :: event
[[Fog of war]] :: Clausewitz's name for the blur that the model's clean assumptions ignore. :: concept
---
In 1916, in [[Aircraft in Warfare]], a book about the new air arm, the British engineer [[Frederick Lanchester]] set out two rules for how a battle is decided. Both are short enough to write on a card, yet the answers they give are hard to believe until you do the sums yourself.

## Two rules for two kinds of fighting

Lanchester tied the linear law to ancient warfare, the world of the [[Phalanx]], where each spear-and-shield man meets one opponent and strength rises in step with numbers. The square law belongs to modern warfare, where [[aimed fire|Aimed fire]] lets every shooter hit anyone on the far side at any moment. Each side's losses then depend on the enemy's headcount, and because the two loss rates feed each other, the advantage compounds. That feedback is what squares the numbers.
^ The emus were the silent side of [[The Great Emu War]], so the feedback never started and the killing ran one way.

## The quantity that stays still

Run the square law with equal effectiveness and something holds still through the whole fight: the difference between the squares of the two forces. Start with 100 against 80 and that difference is 3,600, so the survivors number √3,600, or 60 men, not the 20 that simple subtraction suggests. Mathematicians call a quantity like this a [[conserved quantity|Conserved quantity]]: it does not change while the battle runs. Numbers matter, as every commander knows; the model's claim is that they matter squared.

The same arithmetic makes splitting an army expensive. Each half of a force of 100 fights with only a quarter of its strength, which is the logic behind [[concentration of force|Concentration of force]], the old maxim that a commander should not scatter his men. A [[pincer movement|Pincer movement]] is a bet that the enemy is weaker wherever each arm closes.
^ Under the square law, ten per cent more men means 21 per cent more fighting strength.

## Where the equations break

Despite the name, these are models rather than laws of nature, and a deliberately clean one at that. It treats every unit as equally effective and lets losses flow smoothly, a fraction of a man at a time, which no real battle does. The [[fog of war|Fog of war]] that Clausewitz described is exactly what the arithmetic leaves out, along with terrain, morale and fatigue, and reinforcements break the conserved quantity altogether. In 1954 Joseph Engel tested the square law against Second World War records, counting losses on both sides and checking whether the squares line up. Historians and analysts still argue about how well it fits real campaigns, and modern studies go further with [[Monte Carlo method|Monte Carlo]] simulations, which run thousands of randomised battles to show where the neat equations stop fitting.

## The engineer behind the equations

Lanchester was an engineer before he was a theorist of war. He built motor cars, and in 1907 and 1908 he published a two-volume treatise on aerial flight. His combat equations were written with air combat in mind, including the close-range [[Dogfight]], and were later applied to ships, tanks and infantry.
^ The same man patented an early [[disc brake|Disc brake]] in 1902, decades before the design became common on cars.

===
- [[Lanchester's linear law]] :: The melee rule: double the army and you only double its strength. :: deeper :: concept
- [[Salvo model]] :: Naval battles fought in volleys, a Lanchester-style model for fleets. :: deeper :: mechanism
- [[Kriegsspiel]] :: A Prussian war game from 1824 that rolled dice to settle combat. :: sideways :: thing
- [[Market share]] :: Marketers borrow the square law: the biggest brand gains more than its share. :: wild :: mechanism
- [[Predator-prey model]] :: Predators and prey share the melee law's product term, minus the rifles. :: wild :: mechanism
>>>
[[Monte Carlo method]] :: It shows how modern analysts test the equations against thousands of simulated battles.
???
Did the square law ever predict a real battle accurately?
How do modern military simulations differ from these equations?
Why did a book about aircraft contain rules for ground battles?
`,
  },
  {
    title: "Frederick Lanchester",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Frederick Lanchester
> Deck: A car builder, then a wing theorist, then the man who put war into equations, and the order is the clue.
~ You have just reached the end of Lanchester's laws and pressed on, so here is the man who wrote the formula, an engineer whose arithmetic grew out of cars and wings.
@ drift 70
: Born = 1868, Lewisham, London
: First car = petrol-engined prototype, 1895
: Combat formula = Aircraft in Warfare, 1916
: Royal Society = Fellow from 1922
%%%
1868 :: Born in Lewisham, London
1895 :: Builds a petrol-engined car prototype
1902 :: Takes out a patent for an early disc brake
1907 :: Publishes Aerodynamics, a theory of lift and trailing vortices
1916 :: Publishes Aircraft in Warfare, with the combat formula
+++
[[Disc brake]] :: A brake that clamps a spinning disc; Lanchester's 1902 patent may be the first. :: thing
[[Epicyclic gearing]] :: Nested gears spinning inside each other, in cars and in ancient astronomy. :: mechanism
[[Antikythera mechanism]] :: A shipwrecked bronze gear computer, about 2,000 years old, predicted eclipses. :: thing
[[Trailing vortex]] :: Every wing that makes lift leaves a pair of spinning air tubes behind. :: phenomenon
[[Kutta–Joukowski theorem]] :: The lift formula turning air's spin around a wing into force. :: concept
[[Boundary layer]] :: The thin air layer clinging to a wing largely decides whether it stalls. :: concept
[[Ludwig Prandtl]] :: A 1904 congress talk that introduced the boundary layer to aerodynamics. :: person
[[Leading-edge vortex]] :: A spinning air pocket on an insect wing adds lift steady theory misses. :: phenomenon
[[Bumblebee flight]] :: The 'bumblebee cannot fly' myth traces to fixed-wing sums on flapping wings. :: mystery
[[Lotka–Volterra equations]] :: Two coupled equations predicting boom-and-bust cycles of predators and prey. :: concept
[[Differential analyser]] :: A 1930s machine of rotating shafts that solved differential equations mechanically. :: thing
[[Maxim gun]] :: Hiram Maxim's 1884 gun used its own recoil to keep firing. :: thing
[[Zeppelin raids on Britain]] :: Airships were bombing English towns in the year his air-war book appeared. :: event
---
Frederick Lanchester is remembered for a formula about soldiers, but his working life began with engines. He was born in Lewisham in 1868, and by 1895 he had built a petrol-engined car, one of the first of its kind in Britain. The combat sums came later, and they grew from the same habit: take a messy physical problem, reduce it to a few quantities, and check the numbers against the machine.

^ The Antikythera gears are roughly two thousand years older than Lanchester's first car, and they already used nested wheels.

## Cars built as whole machines

His early cars were built as complete systems rather than assemblies of borrowed parts. He designed counter-rotating balance weights to damp engine shake, and in 1902 he took out a patent on a [[disc brake|Disc brake]], which clamps a spinning disc rather than a drum. The patent is often cited as the first of its kind, and the principle now sits on the front wheels of most cars. Modern automatic gearboxes depend on [[epicyclic gearing|Epicyclic gearing]], nested wheels that turn inside one another, a principle the [[Antikythera mechanism]] used in the second or first century BCE. That device was a bronze eclipse predictor hauled from a Greek shipwreck.

## Wings and the whirl of air

In 1907 he published Aerodynamics, arguing that a wing lifts because it sets the surrounding air circulating. One consequence is that every lifting wing sheds a pair of spinning air tubes, one from each wingtip, known as [[trailing vortices|Trailing vortex]]. Martin Kutta in Germany and Nikolai Zhukovsky in Russia reached related results in the same decade, and the lift formula now carries their names as the [[Kutta–Joukowski theorem]]. A second idea, about a far thinner layer, mattered as much. At a 1904 congress, [[Ludwig Prandtl]] described the [[boundary layer|Boundary layer]], the skin of slowed air clinging to a surface, which largely decides whether a wing keeps its lift or stalls.

Steady-flow theory has its limits. The popular claim that [[bumblebee flight|Bumblebee flight]] is impossible traces to fixed-wing sums applied to flapping wings, and insects keep lift partly through a [[leading-edge vortex|Leading-edge vortex]], a spinning pocket of air on the front edge of the wing that steady sums never capture.

## Sums for a new arm

In 1916 he published Aircraft in Warfare: The Dawn of the Fourth Arm, arguing that aircraft were becoming a fighting arm alongside land and sea forces. Airships were bombing English towns that same year in the [[Zeppelin raids on Britain]], so the argument was not hypothetical. His combat sums are differential equations, the kind that a [[differential analyser|Differential analyser]] was built to solve. Those 1930s machines integrated such equations with shafts and wheels, rather than by hand.

^ The emus never shot back, yet the square law assumes the enemy does; see [[Lanchester's laws]].

His arithmetic was built for an age of fast fire. The [[Maxim gun]], which Hiram Maxim built in 1884, used its own recoil to keep firing, letting a small crew do the work of many riflemen.

## A formula that outlived its war

He was elected a Fellow of the Royal Society in 1922, by which time the vortex picture was being refined by others. Prandtl's lifting-line theory of 1918 covered much of the same ground, using the vortex picture to predict how lift spreads along a wing. The combat sums had a longer afterlife, and the structure travels well: pairs of coupled rates turn up in biology, where the [[Lotka–Volterra equations]] describe predator and prey numbers rising and falling in cycles. Later analysts tested the square law against historical battle records, with mixed results, and it remains a common starting point for wargame models.
===
- [[Lanchester balancer]] :: Counter-rotating weights that damped engine shake, a fix from his cars :: deeper :: thing
- [[Aircraft in Warfare]] :: The 1916 book printing the combat formula, and arguing for a fourth arm :: deeper :: work
- [[Ackermann steering]] :: Named for an 1818 British patent; a Munich coachbuilder may have come first :: sideways :: mechanism
- [[Brooklands]] :: Britain's first purpose-built motor circuit, later a wartime aircraft factory :: sideways :: place
- [[Tunguska event]] :: A 1908 airburst flattened roughly 2,000 square kilometres of Siberian forest :: wild :: event
>>>
[[Lifting-line theory]] :: Prandtl's 1918 wing model took up the vortex picture Lanchester had published in 1907.
???
Did the square law ever predict a real battle accurately?
How did a car engineer end up explaining why wings lift?
Was Lanchester's vortex picture of lift ever seriously disputed?
`,
  },
  {
    title: "Did the square law ever predict a real battle?",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Combat Modelling in Practice
> Deck: Double the soldiers, quadruple the punch: the formula looked tidy on paper, so how did it fare against real Second World War fighting?
~ You asked this right after reading about Frederick Lanchester, the car builder who went from wings to war, so here is how his square law fared against actual battles.
@ drift 60
: Formula = fighting strength scales with numbers squared
: Assumes = aimed fire, fixed forces, no reinforcements
: Major test = J. H. Engel, 1954
: Rival exponent = nearer 1.5, per Dupuy's data (disputed)
: Verdict = mixed; depends heavily on the battle
%%%
1916 :: Lanchester publishes the square law in Aircraft in Warfare.
1954 :: J. H. Engel tests the law against Second World War data.
1979 :: Trevor Dupuy publishes Numbers, Predictions and War, testing Lanchester against history.
+++
[[Concentration of force]] :: Why a small edge in numbers can become an overwhelming one. :: concept
[[Hoplite]] :: A wall of shields where each man mostly fights just one opponent. :: thing
[[Battle of Britain]] :: Pilots' claimed kills and real losses diverged, so the numbers are still argued. :: event
[[Blackett's Circus]] :: Wartime analysts who applied quantitative methods to Coastal Command's anti-submarine campaign. :: thing
[[Quantified Judgment Model]] :: Trevor Dupuy's attempt to predict battles from historical records. :: mechanism
[[Suppressive fire]] :: Fire that never kills can still stop an enemy moving, which equations ignore. :: technique
[[Sound ranging]] :: Trench microphones located enemy guns from the arrival times of their blasts. :: technique
[[Lotka-Volterra equations]] :: Predators and prey cycle under coupled equations of Lanchester's kind. :: mechanism
[[Richardson's arms race model]] :: Rival states arming each other, modelled as coupled equations in the 1930s. :: mechanism
[[Statistics of Deadly Quarrels]] :: Richardson tallied deadly quarrels and found their sizes follow a steady power law. :: work
[[Metcalfe's law]] :: Network value said to grow with users squared, and widely disputed. :: concept
[[Kleiber's law]] :: A famous exponent of three-quarters, whose origin is still argued. :: concept
---
Short answer: sometimes, and never as neatly as its champions hoped. The square law assumes aimed fire, where each side's losses are set by the other side's surviving numbers, so the quantity αA² − βB² stays constant through the fight, with A and B the two forces and α and β how deadly each side is. Whichever side starts with the larger αA² or βB² wins, and the formula even predicts its survivors, which is why [[Concentration of force]] looked so powerful on paper.
^ Lanchester published the square law in 1916, in a book about aircraft, not armies.

## Aimed fire and the linear case

Lanchester, who went from cars to wings before he wrote about war, illustrated the square law with aircraft. The other case is the linear law, for fighting where each man can only reach the opponent in front of him. A [[Hoplite]] phalanx, a wall of shields pressed against a wall of shields, is the picture to hold. Aimed fire at range changes the arithmetic. Every rifleman can pick a target, so each side bleeds at a rate tied to the other side's shooters, and both sides do it at once. That feedback loop is what squares the result.
^ A 10 percent numerical edge is worth about 21 percent more fighting strength under the square law, since 1.1 squared is 1.21.

## Engagements and the tuning problem

A widely cited test is J. H. Engel's 1954 "verification", which checked the law against Second World War engagements and reported support for it in the data he examined. Verdicts since have turned on which casualty figures a historian trusts. The [[Battle of Britain]] shows the problem: pilots' claims ran well ahead of the Luftwaffe's own loss records, so any fit depends on which column you read. Wartime analysts in Britain, a group nicknamed [[Blackett's Circus]] after the physicist who led it, worked on the same kind of operational records.

Trevor Dupuy's [[Quantified Judgment Model]] took a more systematic route, scoring forces by many factors and checking predictions against recorded battles. His historical data pointed to an exponent nearer 1.5 than 2, a finding his critics dispute, and the argument turns on how the forces were scored.

## What the square law leaves out

Real fights break the model in predictable ways. The square law treats every man as alike, every shot as equally deadly and every target as in view. The big omission is suppression: [[Suppressive fire]] that never kills can still pin a unit, stop it moving and spoil its aim, and a model that only counts casualties has no term for that. Reinforcements, morale and terrain, which decide who can see whom, also sit outside the equations.

Effectiveness is hard to measure too, and the square law is only as good as those numbers. In the First World War the British used [[Sound ranging]], a set of trench microphones that located enemy guns from the arrival times of their blasts. That is exactly the kind of target knowledge a square law quietly assumes.
^ Earlier on your path, [[The Great Emu War]] shows where it strains: the birds scattered, and the square law assumes the enemy stays in range.

## The same shape elsewhere

The square law keeps resurfacing because its arithmetic travels. [[Lotka-Volterra equations]] describe predators and prey with coupled rate equations of Lanchester's kind. In the 1930s Lewis Fry Richardson wrote out rival states arming each other as a pair of coupled equations, his [[arms race model|Richardson's arms race model]], and in [[Statistics of Deadly Quarrels]] he tallied conflicts and found their sizes follow a steady power law. Networks have their own square: [[Metcalfe's law]] claims a network's value grows with the square of its users, a heuristic that critics still dispute. Biology has its own exponent fight, the three-quarter power in [[Kleiber's law]], whose origin is still argued.

So did it ever predict a real battle? Sometimes, and only when the conditions hold: concentrated forces, visible targets and losses counted the same way on both sides. That is a narrow set of battles, so the lasting value may be the habit it teaches: ask which exponent the fight actually obeys.
===
- [[Circular error probable]] :: The radius where half your shots land, buried inside every kill-rate estimate. :: deeper :: concept
- [[Prisoner's dilemma]] :: A two-prisoner puzzle that became a theory of trust and arms talks. :: sideways :: concept
- [[HMS Dreadnought]] :: One 1906 battleship made rival navies' fleets obsolete at a stroke. :: sideways :: thing
- [[Mpemba effect]] :: Hot water can freeze faster than cold, a claim still disputed. :: wild :: phenomenon
- [[Ant mill]] :: Army ants can circle in a loop, following each other until exhausted. :: wild :: phenomenon
>>>
[[Kriegsspiel]] :: Prussian wargames tried to simulate combat's arithmetic long before any real shot was fired.
???
Which battles fit the square law best, and what made them different?
How would a commander measure a kill rate before the battle?
Are predator-prey and arms race models really the same shape?
`,
  },
  {
    title: "Lewis gun",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Lewis gun
> An American design its own army turned down, the Lewis gun went on to arm armies from Belgium to Australia.
~ You have just watched two Lewis guns fire at birds that kept moving; this gun's story starts in America, more than a decade before those emus.
@ drift 40
: Designer = Isaac Newton Lewis, an American army officer
: Cooling = air, through a finned barrel casing
: Aircraft mount = Foster, lowers the gun to reload
: Rate = about 500 rounds a minute, in theory
%%%
1910s :: Isaac Newton Lewis designs the gun in America
1917 :: The United States Army adopts a gun it had earlier refused
1930s :: The Bren gun begins replacing the Lewis in British service
+++
[[Maxim gun]] :: The water-jacketed 1880s gun that the Lewis chose to do without :: thing
[[Gas operation]] :: How a gun borrows its own gunpowder gas to load the next round :: mechanism
[[Belt feed]] :: Why most machine guns fed from cloth belts, and the Lewis did not :: mechanism
[[Pan magazine]] :: A spiral of cartridges on top, and the gun's most recognisable feature :: thing
[[Foster mounting]] :: A hinged aircraft mount that let gunners lower the gun into the cockpit :: mechanism
[[S.E.5a]] :: The fighter that mounted its Lewis on the upper wing :: thing
[[Zeppelin raids on Britain]] :: Airship raids where aircrew fought back, sometimes with incendiary rounds :: event
[[Isaac Newton Lewis]] :: The army officer whose design his own country first passed over :: person
[[Short Magazine Lee-Enfield]] :: The rifle whose cartridge the Lewis gun shared, and its supply lines :: thing
[[Deflection shooting]] :: Why gunners aim at empty air ahead of a moving target :: technique
[[Bren gun]] :: The Czech-designed gun that replaced the Lewis in British service :: thing
---
The gun the army sent to the emus had already lived a complicated life. [[Isaac Newton Lewis]], an American army officer, designed it in the years before the First World War, and his own army passed it over. He took the design abroad. Belgium and Britain bought it, and by the end of the war it was one of the most widely used light machine guns of the conflict. Its chief virtue was portability: the result was lighter than the water-cooled machine guns most armies relied on.
^ The two guns sent after the emus were this same design, and the birds outlasted them; see [[The Great Emu War]].

## Built to be carried

The design served one goal: a gun a crew could move. The Lewis is [[Gas operation|gas-operated]], tapping powder gas from its barrel to cycle the action. It fires from a bipod and cools by air through a finned casing around the barrel, which spared it the water jacket that made the [[Maxim gun]] and its heavier descendants so cumbersome. Where most machine guns of the day fed from [[cloth belts|Belt feed]], the Lewis used a pan. The cartridge it shared with the [[Short Magazine Lee-Enfield|rifle]] was a logistical bonus: one supply chain could serve riflemen and gunners alike. The price of all that lightness was heat. Sustained fire warmed the barrel fast, so the gun was built for bursts.
^ Air cooling was a bet on weight over stamina, and the [[Bren gun]] later answered the heat problem with a barrel swapped in seconds.

## A pan, a bracket and the sky

The [[Pan magazine|pan]] is the gun's signature. Its cartridges lie in a spiral track inside the drum and are drawn round to the gun as it fires. Changing a pan meant getting at the gun itself, which became a problem once it went into the air. Aircraft used a [[Foster mounting|Foster mount]], a hinged bracket that let the gunner swing the weapon down into the cockpit to reach the pan. The [[S.E.5a]] carried its Lewis on the upper wing, where the gun could fire clear of the propeller arc. Lewis guns were also among the weapons aircrew used against the airships of the [[Zeppelin raids on Britain|Zeppelin raids]], some firing incendiary rounds designed to set the hydrogen alight.

## A refusal that travelled

The United States Army had examined the design and declined it, and that refusal sent Lewis abroad with his gun. Its first large orders came from Europe. The American army came round to the weapon only in 1917, by which time it had been fighting in Europe for years, and Australian units carried it through the same war.
^ American Lewis guns were chambered for the .30-06, so the British .303 ammunition could not be shared between the two armies.

## Hitting what moves

The birds in the emu story posed an old gunnery problem. Hitting a moving target takes [[Deflection shooting|deflection shooting]]: the gunner aims ahead of the target, not at it. A flock that keeps changing direction makes every lead a guess, and against a scattering flock every miss is a round spent. Australia's army still had Lewis guns in 1932, and two of them went after the emus. In British service the Lewis gave way in the 1930s to the [[Bren gun|Bren]], a Czech-designed weapon whose box magazine replaced the pan.
===
- [[Pan magazine]] :: The spiral track inside the drum that fed every round to the gun :: deeper :: thing
- [[Vickers machine gun]] :: The water-cooled heavyweight built for sustained fire, the Lewis's opposite :: sideways :: thing
- [[Heat sink]] :: The fins on the Lewis barrel share its trick with your laptop chip :: wild :: mechanism
- [[Deflection shooting]] :: How the lead is worked out, and why each turn resets it :: deeper :: technique
- [[Bren gun]] :: The Czech-designed successor whose box magazine ended the pan :: sideways :: thing
>>>
[[Bren gun]] :: The gun that replaced the Lewis, and the next chapter of the same story.
???
How did gunners change a pan in the middle of a fight?
What did the American army actually object to in the design?
Could a gunner really lead a bird that keeps changing direction?
`,
  },
  {
    title: "Bren gun",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Bren gun
> Its name is half a Czech city and half an English factory, and the gun was Czech before it was British.
~ You reached the end of the Lewis gun on deflection shooting, and this is the gun that replaced it: the same army, the same problem, a different answer.
@ drift 70
: Designed in = Brno, Czechoslovakia
: Chambering = .303 British
: Magazine = 30-round curved box, on top
: Rate of fire = about 500 rounds a minute
%%%
1926 :: Czechoslovakia adopts the ZB vz. 26, the gun behind the Bren.
1930s :: Britain buys the design and sets up production at Enfield.
1939 :: The British Expeditionary Force crosses to France with Brens.
1940 :: The Dunkirk evacuation leaves guns and vehicles on French beaches.
1950s :: Commonwealth troops fight in Korea with Brens.
+++
[[Brno]] :: The Moravian city whose arms works gave the gun half its name. :: place
[[Zbrojovka Brno]] :: The Czech arms works whose design Britain licensed, rebuilt and renamed. :: thing
[[ZB vz. 26]] :: The Czech gun the Bren grew from, with a smaller 20-round magazine. :: thing
[[Royal Small Arms Factory]] :: The Enfield works that tooled the Czech design for British soldiers. :: place
[[.303 British]] :: The cartridge British riflemen already carried, now fed to a machine gun. :: thing
[[7.92×57mm Mauser]] :: The German cartridge the original Czech gun was built to fire. :: thing
[[Quick-change barrel]] :: A gunner could swap a red-hot barrel in seconds and keep firing. :: mechanism
[[Cyclic rate]] :: Why a machine gun's speed never changes, however hard you pull the trigger. :: concept
[[Universal Carrier]] :: A tracked vehicle soldiers often called simply the Bren carrier. :: thing
[[Dunkirk evacuation]] :: The 1940 rescue that saved the men but abandoned their heavy kit. :: event
[[Lithgow Small Arms Factory]] :: An Australian arms works that also turned out Brens for Australian soldiers. :: place
---
The army that had fought with the Lewis wanted something lighter, steadier and easier to keep firing. The answer came from Czechoslovakia. The design came from the [[Zbrojovka Brno]] arms works, and in the 1930s Britain bought it and had the [[Royal Small Arms Factory]] at Enfield tool it for British production. The name keeps both halves: BRno and ENfield.

^ Brno and Enfield lie about 1,200 km apart as the crow flies, a distance the one-word name Bren hides completely.

## A Czech design, a British name

The [[ZB vz. 26]] had entered Czechoslovak service in 1926 with a 20-round magazine and the [[7.92×57mm Mauser]] cartridge. The British version took a 30-round curved box and the [[.303 British]], the same round the Short Magazine Lee-Enfield fired. That let a section's riflemen and its gun share one ammunition supply.

^ Where the [[Lewis gun]] carried a 47-round pan on top, the Bren's curved box held about two-thirds as many rounds.

The design's story darkened in 1939. After Germany took over the Czech lands, the [[Brno]] works kept making the gun, this time for the German army.

## Box, barrel and rate of fire

Like the Lewis, the Bren ran on gas bled from its barrel, but it answered the heat problem differently. The Lewis cooled its barrel inside a shroud of radiating fins. The Bren's barrel was made to come out: a gunner lifted it by the carrying handle and slid in a cooler spare. That [[Quick-change barrel]] let a crew keep firing while the hot one cooled. A hot barrel shoots less true, so the spare was part of the gun, not an accessory. The crew was two men, the gunner and an assistant who carried the spare magazines.

The pace came from the mechanism, not the finger. The Bren's [[Cyclic rate]] is about 500 rounds a minute, roughly eight a second, so a full 30-round box is empty in under four seconds. A gunner firing from the folding bipod still had to lead a moving target, the lesson Lewis crews had learned against aircraft.

## Carried into the war

The British Expeditionary Force crossed to France in 1939 with Brens in its infantry sections. In late May 1940 the [[Dunkirk evacuation]] brought the men home but left most of their heavy equipment behind, and the Wehrmacht later put many captured Brens into its own service.

Much of the time the gun rode in the [[Universal Carrier]], a small tracked vehicle that soldiers often called the Bren carrier.

Brens were built well beyond Britain. The [[Lithgow Small Arms Factory]] in New South Wales turned them out for Australian troops, who had fought with Lewis guns a generation earlier. A decade on, Commonwealth soldiers were still fighting with Brens in Korea, and after 1945 the gun carried the British designation L4.
===
- [[Bren gun magazine]] :: A curved 30-round box on top that gave the gun its silhouette. :: deeper :: thing
- [[Sten gun]] :: Britain's cheap wartime gun, stamped from steel tube and made by the million. :: sideways :: thing
- [[Boys anti-tank rifle]] :: A British shoulder rifle built to stop tanks, and quickly outgrown by them. :: sideways :: thing
- [[Villa Tugendhat]] :: Brno's 1930 glass villa, built the same years the gun was being perfected. :: wild :: work
- [[Metronome]] :: The Bren's fixed 500-a-minute beat is a metronome's job, in steel. :: wild :: thing
>>>
[[Bren gun variants]] :: Picks up the story after 1945, when the same gun became the L4 and kept serving.
???
Why did Britain choose a Czech design over its own guns?
What did the British change when they rebuilt the Czech gun?
Did the Germans really fire captured Brens against British troops?
`,
  },
  {
    title: "Why is ice slippery?",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Slipperiness of Ice
> Deck: Ice looks solid, yet a film of liquid-like water may be what lets you glide across it.
~ You began with the question most people ask the first time a boot skids on a frozen puddle, which makes this a wonderful first stop: one plain puzzle that opens doors into physics, sport, climate and biology.
@ drift 0
: Melting point drop = 0.0074 °C per atmosphere
: Ice-on-ice friction = about 0.03 (often cited)
: Volume gained on freezing = about nine percent
: Ice-core air record = over 800,000 years
%%%
1850s :: Faraday describes a thin liquid film on ice surfaces
1939 :: Bowden and Hughes credit frictional heating for ice's slipperiness
1949 :: Frank Zamboni builds the first machine to resurface rink ice
2000s :: Atomic force microscopy measures ice's liquid-like surface layer
+++
[[Regelation]] :: Two pressed ice blocks melt and refreeze into one solid piece. :: phenomenon
[[Pressure melting]] :: Squeezing ice lowers its melting point, but maybe not enough to explain skating. :: mechanism
[[Quasi-liquid layer]] :: A liquid-like film coats ice even well below freezing. :: phenomenon
[[Frictional heating]] :: Sliding friction melts a thin film of water that does the gliding. :: mechanism
[[Curling ice]] :: Sprayed droplets freeze into bumps that let stones glide and curl. :: technique
[[Zamboni ice resurfacer]] :: A machine that lays a thin water sheet which freezes glassy-smooth. :: thing
[[Black ice]] :: Transparent, not black: a glaze so clear you see the road beneath. :: phenomenon
[[Supercooled water]] :: Pure water can stay liquid down to about minus forty degrees. :: phenomenon
[[Hexagonal ice]] :: The open six-sided lattice behind the sixfold symmetry of snowflakes. :: concept
[[Leidenfrost effect]] :: Droplets skate on their own vapour above a very hot pan. :: phenomenon
[[Lake Vostok]] :: A liquid lake sealed under nearly four kilometres of Antarctic ice. :: place
[[Ice core]] :: Trapped air bubbles preserve samples of ancient air over 800,000 years old. :: technique
[[Snowball Earth]] :: Ice may have reached the tropics roughly 700 million years ago. :: event
[[Pseudomonas syringae]] :: A plant bacterium whose surface proteins seed ice just below freezing. :: creature
[[Michael Faraday]] :: A bookbinder's apprentice who taught himself science and studied ice's surface films. :: person
---
Ice is a solid, yet a boot slides across it as if the surface were oiled. Ice on ice has a friction coefficient often quoted near 0.03, more than twenty times lower than rubber on dry pavement. On roads the same effect appears as [[Black ice]], a glaze so clear that drivers see the asphalt beneath it. The short answer is a film of liquid-like water on the surface. The fuller answer has been argued over since the 1800s, and parts of it remain unsettled.

## The thin film

In the 1850s, [[Michael Faraday]] studied how pressed ice blocks fuse, a process called [[regelation|Regelation]], and he argued that a thin film of water on each surface does the welding. That idea anticipates the [[quasi-liquid layer|Quasi-liquid layer]], now a standard concept: ice keeps a disordered, liquid-like skin of molecules even well below freezing. Pure water in tiny droplets can stay liquid down to about minus forty degrees, a state known as [[supercooled water|Supercooled water]]. The surface film is different, because it forms on ice itself rather than in cold water.

## Pressure and friction

For a long time the textbook answer was pressure. James Thomson, elder brother of Lord Kelvin, proposed that squeezing ice lowers its melting point, and a skate concentrates a skater's weight onto a narrow blade. That is the core of [[pressure melting|Pressure melting]]. The effect is real but small: each extra atmosphere lowers the melting point by just 0.0074 °C. A skater at minus twenty would need about two thousand atmospheres to melt ice by pressure alone, far beyond what a blade can deliver.

^ Pressure melting and regelation are often credited with helping glaciers creep over bedrock, a link between skates and mountains.

A second idea is [[frictional heating|Frictional heating]]. In 1939 Frank Bowden and T. P. Hughes argued that sliding friction warms the surface enough to melt a thin film, which then does the lubricating. Critics note that deep cold leaves little meltwater to work with, so the debate has never fully closed.

## Engineering the glide

Sport has turned the puzzle into practical engineering. Curling rinks spray water droplets onto the sheet, and the droplets freeze into a field of tiny bumps. Those bumps cut the contact area, so stones on a [[pebbled sheet|Curling ice]] travel further and curl, and sweeping warms the surface to extend their path. Rink crews keep the surface even with a machine. The [[Zamboni ice resurfacer]] shaves a thin layer off the ice and lays down water that freezes glassy-smooth. Physics offers a stranger cushion too: the [[Leidenfrost effect]], described by Johann Gottlob Leidenfrost in 1756, lets droplets skate on their own vapour above a very hot pan.

## Ice beyond the rink

The same lattice shapes the wider icy world. Water molecules settle into [[hexagonal ice|Hexagonal ice]], an open structure that is why ice floats and why snowflakes have six-fold symmetry. Drilling into ice sheets recovers [[ice cores|Ice core]] whose trapped air bubbles preserve samples of ancient air from over 800,000 years ago. Beneath Antarctica, [[Lake Vostok]] has stayed liquid for millions of years, sealed under nearly four kilometres of ice. Ice has even reached the tropics, according to the [[Snowball Earth]] hypothesis, roughly 700 million years ago. Biology gets involved too: [[Pseudomonas syringae]], a plant bacterium, carries surface proteins that seed ice just below freezing, which helps frost damage crops.

^ Ice takes up about nine percent more space than the water it came from, which is why sealed bottles split in freezers.
===
- [[Clapeyron equation]] :: The equation predicting how much pressure shifts any melting point. :: deeper :: concept
- [[Ice nucleation]] :: A single speck of dust can start freezing in supercooled droplets. :: deeper :: mechanism
- [[Hydroplaning]] :: Car tyres can ride on a water film at speed, losing grip. :: sideways :: phenomenon
- [[Frost heave]] :: Growing ice lenses in soil can lift roads and footpaths. :: sideways :: phenomenon
- [[Shackleton's Endurance expedition]] :: Pack ice crushed Shackleton's ship in 1915, yet every crewman survived. :: wild :: event
>>>
[[Quasi-liquid layer]] :: The thin film at the heart of the answer, and where the debate now lives.
???
Could skate pressure really melt the ice beneath a blade?
How cold can road salt still work?
How do scientists read ancient climate records from ice cores?
`,
  },
  {
    title: "Leidenfrost effect",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Leidenfrost effect
> Deck: Heat a pan enough and a water drop nearly stops touching it, skating on a cushion of its own steam.
~ You just read that sweeping warms the surface so stones travel farther. This page is about what happens when that heat gets far stronger: a drop of water starts to float.
@ drift 40
: Described = 1756, by Johann Gottlob Leidenfrost
: Hovering layer = the drop's own vapor
: Water threshold = roughly 200 °C, depends on surface
: Liquid nitrogen = skitters on room-temperature metal
%%%
1756 :: Johann Leidenfrost describes drops dancing on a hot iron spoon
1966 :: Gottfried, Lee and Bell study drops on flat hot plates
2006 :: Researchers make drops self-propel along a ridged, ratchet-like surface
+++
[[Liquid nitrogen]] :: Colder than any weather ever recorded, yet it skitters on warm metal. :: thing
[[Hovercraft]] :: Rides on its own cushion of air, and once crossed the English Channel. :: thing
[[Boiling curve]] :: One graph shows why water can suddenly stop cooling a hot surface. :: concept
[[Quenching]] :: Red-hot steel plunged into water is wrapped in steam for a moment. :: technique
[[Maillard reaction]] :: The browning on seared steak is chemistry, not just burning. :: mechanism
[[Water strider]] :: It walks on pond skin by dimpling the surface, never breaking through. :: creature
[[Cavitation]] :: Bubbles that form and collapse in fast water can chew through ship propellers. :: phenomenon
[[Sonoluminescence]] :: A sound-shaken bubble can flash light, and scientists still debate why. :: mystery
[[Pistol shrimp]] :: Its snapping claw makes a bubble that collapses in a flash of light. :: creature
[[Meissner effect]] :: A cold superconductor pushes magnetic fields out and lets a magnet float. :: phenomenon
[[Superfluid helium]] :: Chilled near absolute zero, helium climbs container walls and leaks away. :: phenomenon
---
Flick a few drops of water onto a pan that is hot enough, and the drops stop spreading. They bead up and skitter around like loose marbles on a glass table. They barely touch the pan. Each one floats on a cushion of its own steam. The sweepers on that curling sheet warm the ice just a little. Crank the heat far past that, and water starts acting strange.

^ A drop on a hot pan can last far longer than one on a cooler pan, because the steam slows the heat that would boil it away.

## A cushion made of itself

The bottom of the drop turns to steam the moment it lands. That steam pushes up, and the drop rides on top of it, a bit like a [[hovercraft|Hovercraft]] riding on air. A hovercraft needs a fan to make its cushion. The drop needs no fan at all.

Johann Gottlob Leidenfrost, a German doctor, wrote about it in 1756. Older books call the hovering drop the spheroidal state. For water, the trick starts near 200 °C, and the exact number depends on the metal and how smooth it is.

Remember the bumps on a pebbled curling sheet, the ones that cut contact so stones slide? A Leidenfrost drop takes that idea to the extreme. It touches the metal at only a few points, if at all, so almost nothing rubs. It is a bit like a [[water strider|Water strider]] on a pond, except the drop is held up by steam, not by the water's skin.

## Why steam makes a good mitt

Heat has to cross that cushion to reach the drop, and steam carries heat poorly. It works like a thick oven mitt between your hand and a hot pan. So the drop boils slowly from below instead of all at once. Engineers draw this on a [[boiling curve|Boiling curve]]. On that graph, the Leidenfrost point sits at the bottom of a valley, where the steam blanket cuts heat flow to its lowest level.

^ The thin film that may make [[Slipperiness of Ice]] so slick is this effect's cousin. In both, a layer keeps two surfaces apart.

## Colder than weather, still floating

Here is the strangest version. [[Liquid nitrogen]] boils at about -196 °C, colder than any weather ever recorded on Earth. Drop some onto a metal plate at room temperature, and it dances. The plate is more than 200 degrees warmer than the drop, so the nitrogen boils into its own cushion. Same trick, far colder.

Cousins are everywhere. Superconductors show the [[Meissner effect]]: a cold one shoves magnetic fields out of its way and can lift a magnet. Cold [[Superfluid helium]] climbs up container walls and can leak right out. In fast water, bubbles that form and collapse can chew through ship propellers. Engineers call that [[Cavitation]].

^ Wait, really? A [[Pistol shrimp]] snaps its claw so fast the water forms a bubble that flashes light, the same family as [[Sonoluminescence]].

## Where the trick already works

Cooks test a pan with a few drops of water. If the beads skitter, the pan is hot enough to sear, and that same heat drives the [[Maillard reaction]], the chemistry behind browned steak. Metalworkers meet a similar steam blanket during [[quenching|Quenching]]. Red-hot metal goes into water, a vapor layer wraps it first, and that layer slows the cooling. How hard steel gets depends on how fast it cools, so the steam matters.

A later twist came in 2006. Researchers built a surface with angled ridges, like a ratchet. Drops on it self-propelled in one direction, with no outside push.

===
- [[Leidenfrost point]] :: The threshold temperature where a drop switches from sizzling to floating. :: deeper :: concept
- [[Steam explosion]] :: Water touching molten metal can flash to steam with a violent blast. :: deeper :: phenomenon
- [[Coffee ring effect]] :: A dried coffee drop leaves a dark ring, for a surprisingly specific reason. :: sideways :: phenomenon
- [[Antikythera mechanism]] :: A bronze gear machine from ancient Greece that predicted eclipses. :: wild :: thing
- [[Tardigrade]] :: A microscopic animal that shrugs off freezing and the vacuum of space. :: wild :: creature
>>>
[[Boiling curve]] :: It charts every stage of boiling, and the drop you just read about is one stop.
???
Does the drop ever touch the metal at all?
Can the trick work on glass or ceramic?
Why does a floating drop wander instead of sliding straight?
`,
  },
  {
    title: "Steam explosion",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Steam explosion
> Deck: Drop molten metal into water and the water can flash to steam in milliseconds, shattering the melt and sending a shockwave outward.
~ You reached this from the branches at the end of Leidenfrost effect, where water touching molten metal can flash to steam with a violent blast. The drop skating on its own steam was the gentle case; this is what happens when that cushion gives way.
@ drift 60
: Expansion = About 1,700-fold at sea level
: Speed = Often within milliseconds
: Trigger = Film collapse, pressure pulse, or mixing
: Found in = Reactors, furnaces, volcanoes, LNG spills
%%%
1920s :: William Mason's steam-blast process turns wood into fibreboard.
1961 :: SL-1 reactor's cooling water flashes to steam; three men die.
1986 :: Chernobyl Reactor 4's first blast, widely attributed to steam.
2014 :: Mount Ontake's steam eruption kills 63 people on its slopes.
2019 :: Whakaari's steam eruption kills 22 people, most of them visitors.
+++
[[Superheated liquid]] :: Water can sit far above its boiling point, storing energy like a spring. :: concept
[[Phreatic eruption]] :: Steam alone can blast a crater without any fresh magma erupting. :: phenomenon
[[Mount Ontake]] :: A steam eruption caught climbers on its slopes, killing 63, with little warning. :: place
[[Whakaari]] :: A volcano tourists could walk onto, until steam erupted in 2019. :: place
[[Keanakākoʻi crater]] :: Hawaiian oral history ties a deadly blast here to a warrior army. :: place
[[SL-1 reactor]] :: An Idaho test reactor destroyed itself when its cooling water flashed to steam. :: event
[[Chernobyl disaster]] :: Its first blast is widely attributed to a steam explosion inside the core. :: event
[[Fuel-coolant interaction]] :: Molten reactor fuel meeting water can shatter itself into a blast. :: mechanism
[[Rapid phase transition]] :: Spilled liquefied natural gas on seawater can flash to vapour with a blast. :: phenomenon
[[Kraft recovery boiler]] :: Pulp-mill furnaces can explode when water leaks into their molten floor. :: thing
[[Slag granulation]] :: Dumping molten slag into water yields glassy grains that make concrete last longer. :: technique
[[Popcorn]] :: Each kernel is a sealed pressure vessel that bursts at roughly 135 psi. :: thing
[[Masonite]] :: Steam pressure, then a sudden release, pulled wood apart into board fibres. :: thing
---
Thin layers have already done strange work on your path: a film of meltwater may be what lets a skate glide on ice, and a cushion of steam holds a drop above a pan. A steam explosion is what happens when a liquid meets something far hotter than its boiling point and flashes to vapour faster than the vapour can escape, turning its energy into pressure. Pure, still water can stay liquid well past 100°C because bubbles need somewhere to start, and water held in that state is [[superheated water|Superheated liquid]].

## How the cushion gives way

When molten metal meets water, a film of vapour forms between them and keeps the two apart for a while. When something breaks that film, such as a pressure pulse or water mixed into the melt, cold liquid touches hot metal directly. Nuclear engineers call the general case [[Fuel-coolant interaction]], where molten reactor fuel meets its coolant.
^ The cushion you met in [[Leidenfrost effect]] is the first barrier, and a steam explosion follows when it breaks.

Breaking the melt into fragments makes the blast fast. Heat passes into the water in milliseconds, so the water flashes to steam all at once, and steam needs far more room than water does.
^ A litre of water boiled at sea level makes roughly 1,700 litres of steam, all demanding room at once.

## Accidents and industry

Some of the best-documented accidents involve reactors. In January 1961 an experimental Idaho reactor, [[SL-1|SL-1 reactor]], suffered a power excursion; its cooling water flashed to steam, the blast wrecked the core, and three men died. The first blast at [[Chernobyl disaster|Chernobyl]]'s Reactor 4 in April 1986 is widely attributed to a steam explosion in the core, though its sequence is still argued over.

Kraft pulp mills burn spent cooking liquor in a [[Kraft recovery boiler]], where molten smelt collects on the floor, and water that leaks into it can blow the furnace open. Spilled liquefied natural gas can trigger a [[Rapid phase transition]] on seawater. Steelworks use controlled contact on purpose: in [[Slag granulation]], water jets turn blast-furnace slag into glassy grains that make concrete last longer.
^ LNG boils near -162°C, so a spill onto seawater starts with a temperature gap of 160 degrees or more.

## Volcanoes that flash

A [[Phreatic eruption]], named for the Greek word for well, contains no fresh magma. Groundwater or a hydrothermal system is heated by hot rock below, flashes to steam, and blasts through the rock above. On 27 September 2014 one such eruption at [[Mount Ontake]] in Japan killed 63 people on its slopes. On 9 December 2019 a steam eruption on [[Whakaari]], New Zealand's White Island, killed 22 people, most of them visitors.

Hawaiian oral history describes a blast in [[Keanakākoʻi crater]], traditionally dated to 1790, that killed a band of warriors. Whether steam caused it, and how many died, is still debated.

## The useful version

Each [[Popcorn]] kernel is a sealed pressure vessel: its moisture turns to steam until the hull gives way at roughly 135 psi, near 180°C. In the 1920s William Mason used a comparable blast to tear wood into fibres, and the board that followed carried the name [[Masonite]].

The difference between a useful blast and a catastrophe is speed and escape. Control the contact and let the vapour leave, and you get glass grains, puffed grain or board. Let fragments meet hot liquid in a rush, with nowhere to go, and the same water becomes a shockwave.
===
- [[Critical point]] :: Above 374°C, water no longer has a boundary between liquid and gas. :: deeper :: concept
- [[Boiling liquid expanding vapour explosion]] :: A pressurised tank in a fire can flash its contents into a fireball. :: sideways :: phenomenon
- [[Steam hammer]] :: Condensing steam can slam a pipe's water like a hammer, rupturing it. :: sideways :: phenomenon
- [[Bombardier beetle]] :: A beetle's chemistry heats its chamber until it fires boiling spray. :: wild :: creature
- [[Tunguska event]] :: A 1908 Siberian airburst flattened forest, yet left no crater. :: wild :: mystery
>>>
[[Homogeneous nucleation]] :: It explains how pure water overheats, and why any speck of impurity ends that wait.
???
Can water really stay liquid past its boiling point?
Do steam explosions need confinement to do real damage?
Why does water in hot oil spit so violently?
`,
  },
  {
    title: "popcorn",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Popcorn
> Every kernel is a sealed pressure vessel that bursts at about 135 psi, and the snack is the aftermath.
~ You typed "popcorn" into that chamber while the molten-metal blast was still fresh, so here is the same kind of burst at kitchen size, sealed inside a kernel.
@ drift 86
: Botanical name = Zea mays everta
: Moisture at popping = 13.5 to 14 percent
: Burst pressure = about 135 psi
: Expansion = dozens of times its volume
%%%
1885 :: Charles Cretors builds a steam-powered popcorn machine.
1912 :: Cracker Jack starts packing a toy prize in every box.
2000s :: Workers at a Missouri microwave-popcorn plant develop severe, irreversible airway damage.
+++
[[Starch gelatinization]] :: Wet, hot starch granules swell until their crystal order collapses into paste. :: mechanism
[[Pericarp]] :: Botanically a fruit wall, this tough hull keeps the pressure building. :: thing
[[Old maid kernel]] :: Unpopped stragglers often lost their steam through a hull crack before pressure peaked. :: thing
[[Cretors popper]] :: The 1885 steam-powered machine that turned popping into a vendor's trade. :: thing
[[Gun puffing]] :: A sealed steel chamber, a sudden release, and grain becomes breakfast cereal. :: technique
[[Mushroom popcorn]] :: Genetics picks the shape, round mushrooms for coatings or ragged butterflies for butter. :: thing
[[Nixtamalization]] :: Lime-soaked maize releases niacin that raw grain keeps unavailable to the body. :: technique
[[Cracker Jack]] :: Caramel popcorn sold in a sealed box with a toy hidden inside it. :: thing
[[Diacetyl]] :: A four-carbon molecule with two ketone groups that tastes unmistakably of butter. :: thing
[[Popcorn lung]] :: A lung disease named for the factory workers who breathed in butter fumes. :: phenomenon

---
Popcorn is Zea mays everta, a variety of maize selected for one trick. Flick water into a hot skillet and it skates on a cushion of its own steam, the Leidenfrost effect from earlier. A kernel never gets to skate. Its water is sealed inside a hard, glassy starch core wrapped in a tough hull, and the seal holds right through the heat.

## A hull that holds 135 psi
Kernels pop best at about 13.5 to 14 percent moisture. Drier ones have too little water to build pressure, and the starch matters just as much. The hard endosperm keeps steam from leaking out, which is why soft, floury corn does not pop. As the kernel heats, its water stays liquid well past 100 °C. By about 180 °C the pressure inside reaches roughly 135 psi, and the [[Pericarp]], the hull itself, tears at its weakest point.
^ At 135 psi, a kernel's hull holds roughly four times the pressure of a car tyre.

## Starch that turns to foam
At those temperatures the starch changes character. Its granules swell and lose their crystalline order, a change called [[Starch gelatinization]], so the endosperm stops behaving like a solid and becomes a viscous melt. When the hull splits, the pressure collapses, the trapped water flashes to steam, and that steam blows the melt outward into foam. The foam sets as it cools into the familiar white puff, and a popped kernel can reach dozens of times its original volume. The audible pop comes mainly from the hull splitting.
^ Sealed water, a containing shell and a sudden flash to steam: the same logic as [[Steam explosion]], shrunk to grain size.

Not every kernel gets there. The [[old maids|Old maid kernel]] left in the bottom of the bowl usually lost their steam through a hull crack before pressure peaked, or started too dry to build any at all.

Industry borrowed the same burst. [[Gun puffing]] seals grain in a steel chamber under heat and pressure, then releases it, and the sudden expansion makes puffed rice and wheat cereals.

## Shapes, carts and caramel
Shape is largely genetics. [[Mushroom popcorn]] pops into dense, round pieces that hold coatings well, while the ragged butterfly types catch melted butter and salt in their wings. In 1885 Charles Cretors built a [[steam-powered popper|Cretors popper]], which turned popping from a kitchen chore into a vendor's trade. Sweet versions followed, and [[Cracker Jack]] began packing a toy in every box in 1912.

Popcorn predates all of this. Dry caves in New Mexico and Peru have yielded popcorn several thousand years old. Mesoamerican cooks took a different tack with the same hull: [[Nixtamalization]] soaks maize in lime, loosening the pericarp so it rubs off, and releases niacin that raw grain keeps unavailable to the body.

## The butter that hurt lungs
The buttery smell of microwave popcorn comes from [[Diacetyl]], a compound that gives real butter its taste. In the early 2000s, workers at a microwave-popcorn plant in Jasper, Missouri, were diagnosed with severe, irreversible damage to their smallest airways, a condition that came to be called [[Popcorn lung]]. Investigators traced it to vapour from the flavouring, and many manufacturers later replaced the chemical.
^ Eating microwave popcorn has not been shown to cause the disease; the exposure was airborne, at work.

===
- [[Zea mays everta]] :: Its Latin name means 'turned outward', describing the pop itself. :: deeper :: thing
- [[Amylopectin]] :: The branched starch molecule that gives cooked starch its thick, sticky body. :: deeper :: concept
- [[Jiffy Pop]] :: A foil pan that balloons into a dome as kernels pop beneath it. :: sideways :: thing
- [[Pop Rocks]] :: Sugar candy with carbon dioxide sealed inside, released as saliva dissolves it. :: sideways :: thing
- [[Thomae's function]] :: Nicknamed the popcorn function, it is discontinuous at every rational number. :: wild :: concept

>>>
[[Bronchiolitis obliterans]] :: It is the disease the story has been circling, and it explains why the damage cannot reverse.
???
Does eating microwave popcorn actually harm the lungs?
Why do a few kernels refuse to pop at all?
Would popcorn still pop in a vacuum?
`,
  },
  {
    title: "Tulip mania",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Tulip mania
> Deck: Dutch traders staked fortunes on flower bulbs until one February in 1637, when the buyers all but vanished.
~ You started with tulip mania, which makes it a wonderful first stop: one flower, a few frantic winters and a crash that still gets cited whenever markets overheat.
@ drift 0
: Period = 1634 to 1637
: Where = Dutch Republic, with Haarlem a centre
: Star bulb = Semper Augustus
: Collapse = February 1637
%%%
1550s :: Habsburg envoy in Istanbul sends tulip bulbs to Vienna
1593 :: Carolus Clusius takes charge of Leiden's botanic garden
1634 :: Speculation in bulbs takes off in Dutch towns
1636 :: Bulb contracts change hands in taverns at a frantic pace
1637 :: February: buyers vanish at a Haarlem auction; prices collapse
1841 :: Charles Mackay's book turns the craze into a classic cautionary tale
+++
[[Carolus Clusius]] :: The Leiden botanist whose garden put tulips on the Dutch map :: person
[[Ogier Ghiselin de Busbecq]] :: A Habsburg envoy who sent tulip bulbs from the Ottoman court to Vienna :: person
[[Semper Augustus]] :: The striped tulip that reportedly fetched thousands of guilders :: thing
[[Tulip breaking virus]] :: A virus, carried by aphids, painted the flames that made bulbs prized :: phenomenon
[[Hortus Botanicus Leiden]] :: One of the world's oldest botanic gardens, and home to early Dutch tulips :: place
[[Tulip Era]] :: An Ottoman age of tulip gardens that ended in revolt in 1730 :: era
[[Extraordinary Popular Delusions and the Madness of Crowds]] :: The 1841 book that turned a Dutch flower craze into a legend :: work
[[South Sea Bubble]] :: Britain's 1720 mania followed the same script and the same crash :: event
[[Dutch disease]] :: Coined after Dutch gas riches made the country's other industries uncompetitive :: phenomenon
[[Hunger Winter]] :: The 1944–45 famine when Dutch families ate tulip bulbs to survive :: event
[[Vanitas]] :: Still lifes that used flowers and skulls to remind viewers that everything fades :: concept
[[Keukenhof]] :: Each autumn, millions of bulbs go into the ground for one spring season :: place
[[Dutch auction]] :: Prices fall until someone bids, a format named after Dutch flower markets :: technique
---
In the winter of 1636 and 1637, Dutch traders were buying and selling tulip bulbs faster than anyone could grow them. Bulbs could only be lifted from the soil in summer, so most of the trade was in promises: contracts for bulbs that would not be seen until then, sometimes sold on again before anything had been dug up. The deals were often struck in taverns, over drinks, and the star of the market was a striped variety called [[Semper Augustus]].

## A flower goes west

The tulip's journey west began in the Ottoman Empire. In the 1550s, [[Ogier Ghiselin de Busbecq]], the Habsburg envoy in Istanbul, admired the flower in Ottoman gardens and sent bulbs back to Vienna. More than a century and a half later, the court in Istanbul ran a whole [[Tulip Era]] of gardens, poetry and evening parties, which ended in revolt in 1730.
^ The word tulip is usually traced to a Persian word for turban.

In 1593 the botanist [[Carolus Clusius]] took charge of the [[Hortus Botanicus Leiden]], a garden that is still open and counts among the oldest botanic gardens in the world. Legend says thieves once raided his plots for bulbs. The story may be more legend than record, but it shows how precious the flower had already become.

## Stripes, contracts and a virus

In winter, traders bought and sold the promise of a bulb. Semper Augustus was the most coveted of the striped varieties, with white petals and fiery red streaks. One reported sale ran into the thousands of guilders, though historians dispute how typical such prices were.

The stripes were no artist's work. Modern botanists trace them to the [[Tulip breaking virus]], which nobody in the 1630s could have named. Growers could see only that striped bulbs were scarce, and scarcity was enough to make them valuable.
^ The virus that streaked the petals is spread by aphids, the same pests gardeners still fight.

## The auction that broke the spell

Speculation had been building since about 1634, and it peaked that winter. Then, in early February 1637, a Haarlem auction drew almost no buyers. Prices slid, sellers and buyers lost their nerve, and the market collapsed. Contract holders were left arguing over paper that suddenly looked worthless. Eventually the authorities stepped in, letting buyers settle contracts for a small fraction of their price.

Some eight decades later, Britain's [[South Sea Bubble]] of 1720 followed much the same script, with a company's shares as the bait.

## Afterlife of a bubble

Much of the legend owes its shape to Charles Mackay, who in 1841 published [[Extraordinary Popular Delusions and the Madness of Crowds]]. The book cast the Dutch fad as a warning about crowds. Modern historians argue that the mania was smaller in scope than the legend, and that its wider economic damage was limited. The myth has proved far more durable than the evidence.
^ A famous sailor who ate a costly bulb, mistaking it for an onion, is probably invented.

The flower outlasted the mania. Dutch painters of the same decades filled still lifes with blooms, and the [[Vanitas]] genre used them to remind viewers that beauty fades. Three centuries later, during the [[Hunger Winter]] of 1944 and 1945, Dutch families ate tulip bulbs to survive.

[[Keukenhof]] near Lisse plants millions of bulbs each autumn for one spring season, and Dutch flower markets still run auctions where the price falls until someone bids, a format called the [[Dutch auction]]. The Netherlands had a later boom of its own, in natural gas, and in 1977 The Economist coined the phrase [[Dutch disease]] for the damage it did to other industries.
===
- [[Haarlem]] :: The city where a February 1637 auction found almost no buyers :: deeper :: place
- [[Dutch East India Company]] :: Its shares were already traded in Amsterdam before the tulip craze began :: sideways :: thing
- [[The Night Watch]] :: A 1642 Amsterdam militia portrait, later cut down to fit a wall :: sideways :: work
- [[Voynich manuscript]] :: A 15th-century codex whose plant drawings still defy identification :: wild :: mystery
- [[Tardigrade]] :: Microscopic animals that survive vacuum, radiation and freezing :: wild :: creature
>>>
[[Semper Augustus]] :: The craze's star bulb, and the strange biology that gave it its stripes
???
Why did a virus make some tulips more valuable?
Did anyone actually get rich, or was it all rumour?
Did the Dutch government ever step in to stop it?
`,
  },
  {
    title: "Tulip breaking virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Tulip breaking virus
> Growers never saw the virus behind their stripes, but its first clue slipped through a filter built to stop bacteria.
~ You opened this from the line about a virus that nobody in the 1630s could have named, so here is the name, and the insect that carried it from plant to plant.
@ drift 40
: Genus = Potyvirus, largest of the plant viruses
: Carrier = Green peach aphid
: Genome = One strand of RNA
: Spreads through = Aphids and infected bulbs
: Visible sign = Pale streaks in petal colour
%%%
1892 :: Ivanovsky's filtered sap still infects healthy tobacco.
1898 :: Beijerinck calls the agent a "living fluid" contagion.
1935 :: Wendell Stanley crystallises tobacco mosaic virus, a first for any virus.
+++
[[Green peach aphid]] :: Picks up a virus while probing, then passes it to the next leaf. :: creature
[[Stylet-borne transmission]] :: The virus rides on the aphid's mouthparts, not inside its body. :: mechanism
[[Potyvirus]] :: The largest genus of plant viruses, and the one behind the stripes. :: thing
[[Anthocyanin]] :: The pigment behind red and purple flowers, and the one the virus disrupts. :: concept
[[Roguing]] :: Pull any plant showing stripes before the aphids spread the virus further. :: technique
[[Chamberland filter]] :: A porcelain candle meant to stop bacteria, which the tobacco agent slipped through. :: thing
[[Dmitri Ivanovsky]] :: A Russian botanist whose filter test hinted at something smaller than bacteria. :: person
[[Martinus Beijerinck]] :: The Delft microbiologist who called the tobacco agent a living fluid. :: person
[[Tobacco mosaic virus]] :: The first virus anyone crystallised, a mottling disease of tobacco. :: thing
[[Potato virus Y]] :: The aphid that spreads the tulip virus also spreads potato virus Y. :: thing
[[Bollenstreek]] :: The Dutch bulb belt where growers learned to keep their fields clean. :: place
---
Nobody in the 1630s could see the virus behind a striped petal, and for centuries afterwards nobody could name it. The first clue to such a virus came from tobacco, not tulips. In 1892 the Russian botanist [[Dmitri Ivanovsky]] squeezed sap from diseased tobacco leaves and pushed it through a porcelain candle, a [[Chamberland filter]] built to hold back bacteria. The liquid that came through still made healthy plants sick. Ivanovsky himself leaned towards a toxin rather than a living germ.

## A living fluid

Six years later, the Delft microbiologist [[Martinus Beijerinck]] ran the same kind of filter test and went further. The agent passed through the filter, would not grow on a nutrient dish, and multiplied inside the plant, so he called it a "contagium vivum fluidum", a living liquid contagion. The tobacco disease was later traced to [[Tobacco mosaic virus]], and in 1935 the biochemist Wendell Stanley crystallised it, a first for any virus.

## The courier on the leaf

The usual carrier is the [[Green peach aphid]] (Myzus persicae), a pale, soft-bodied insect that feeds by pushing a fine stylet into plant tissue. It does not carry the virus inside its gut. The virus clings to the tip of the stylet, so one short probe can pick it up and the next probe, on the next plant, can drop it off. Biologists call this [[Stylet-borne transmission]], and it is fast: a probe lasting only seconds can be enough. The tulip virus is a [[Potyvirus]], the largest genus of plant viruses, and its particles are flexible threads of protein wrapped around a single strand of RNA. The same aphid also spreads [[Potato virus Y]] from plant to plant, and that virus ranks among the most damaging potato diseases.
^ No lens of the 1600s could have shown the virus: a potyvirus particle is a thread thousands of times thinner than a hair.

## Why a stripe is a sick bulb

A petal's colour comes largely from [[Anthocyanin]], the pigment behind red and purple flowers. The leading account is that the virus disrupts pigment production in patches of petal cells, so the pale ground colour shows through as streaks. The exact route is not fully worked out, so treat it as the best current explanation.

The virus lives in the bulb and travels through its offsets far more reliably than through seed. That is why breeders could not simply sow stripes: a striped flower did not reliably give striped children, and a seedling could take five to seven years to bloom at all. Infected bulbs also tend to grow smaller and multiply more slowly, so a striped line was always a thin line.
^ Part of the scarcity behind [[Tulip mania]] was biological: the virus tended to slow the striped bulbs' own multiplication.

## Pulling the prettiest plants

Once the virus was understood, the fix was unglamorous. Growers learned to rogue their fields: walk the rows, pull out every plant showing streaks, and plant only from clean stock. The practice, called [[Roguing]], rests on a simple logic: the most striking plant in a bed is the one most likely to carry the virus. In the [[Bollenstreek]], the bulb belt around Lisse and Hillegom, the stripe went from prize to problem. Some striped varieties still survive, mainly in collections, kept on purpose.
===
- [[Aphid stylet]] :: A mouthpart that tests plant cells, one probe at a time. :: deeper :: thing
- [[Bulb offset]] :: Daughter bulbs that carry the stripe forward, year after year, in the soil. :: deeper :: thing
- [[Bulb forcing]] :: A cold-room trick that coaxes tulips into bloom in midwinter. :: sideways :: technique
- [[Tulip fire]] :: A fungal blight that scorches tulip leaves and buds, unlike any virus. :: sideways :: phenomenon
- [[Dutch elm disease]] :: Elm bark beetles carry its fungus between trees, much as aphids carry viruses. :: wild :: phenomenon
>>>
[[Tobacco mosaic virus]] :: It is the disease behind the 1892 filter test, and the first virus ever crystallised.
???
Can a virus change a flower's colour without killing the plant?
How can a grower spot an infected bulb before it flowers?
Why did commercial growers stop selling the striped lines?
`,
  },
  {
    title: "Tobacco mosaic virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Tobacco mosaic virus
> Deck: A botanist's filter test in 1892 led to a virus crystallised, photographed and rebuilt from its parts.
~ Pick up the thread in 1892, when a botanist's infected sap slipped through a filter built to catch bacteria. You have just met a virus no grower ever saw, and this is the moment that kind of agent first got past a barrier meant for germs.
@ drift 80
: First sap transfer = 1886, Netherlands
: Particle = rod about 300 nanometres long
: Genome = RNA, about 6,400 bases
: Coat = about 2,130 identical protein pieces
: Spreads by = hands, tools and sap
%%%
1886 :: Adolf Mayer spreads sick sap to healthy plants; no germ appears.
1892 :: Ivanovsky's sap passes a bacteria-blocking filter and still infects.
1898 :: Beijerinck names the agent contagium vivum fluidum, "contagious living fluid."
1935 :: Wendell Stanley crystallises the agent; dissolved crystals still infect plants.
1939 :: Electron microscope pictures show the rods themselves, about 300 nanometres long.
1955 :: Fraenkel-Conrat splits the virus into RNA and protein, then rebuilds it.
+++
[[Chamberland filter]] :: Porcelain filter built to trap bacteria, which failed to stop this agent. :: thing
[[Dmitri Ivanovsky]] :: Botanist whose filtered sap stayed infectious, leaving him guessing the culprit. :: person
[[Martinus Beijerinck]] :: Named the unseen agent a contagious living fluid, then showed it multiplied. :: person
[[Wendell Stanley]] :: Crystallised the agent in 1935; the crystals still infected healthy plants. :: person
[[Electron microscope]] :: Produced the first photographs of these rods, in 1939. :: thing
[[X-ray crystallography]] :: Turned the virus's crystals into X-ray patterns in 1941. :: technique
[[Virus reconstitution]] :: Split a virus into RNA and protein; rebuilt, it still infected plants. :: technique
[[Virus self-assembly]] :: Protein pieces coil around RNA unaided, forming a hollow, ordered rod. :: mechanism
[[Hypersensitive response]] :: Plants kill their own cells to wall the virus in. :: mechanism
[[Green peach aphid]] :: Carries more than a hundred plant viruses, yet this one never needed it. :: creature
[[Viroid]] :: Infectious RNA with no protein coat at all, found decades later. :: thing
[[Nanowire]] :: Virus rods from tobacco now serve as templates for nanoscale wires. :: thing
[[Bacteriophage]] :: Viruses that hunt bacteria, spotted just a few decades after these plant agents. :: thing
---
In 1892 a Russian botanist, [[Dmitri Ivanovsky]], ground diseased tobacco leaves and squeezed out the sap. He forced the juice through a [[Chamberland filter]], a porcelain candle built to strain bacteria from liquids, then rubbed it onto healthy plants. The leaves mottled anyway. Ivanovsky guessed at a poison made by bacteria, or bacteria too small to catch, and his filter could not settle which. Like the tulip's stripes, the cause was real and unseen.

^ A rod of this virus is about 300 nanometres long; a typical E. coli cell is roughly seven times longer.

## The disease nobody could catch

Nearly 250 years after the Dutch bulb market collapsed, Adolf Mayer was running experiments at Wageningen in the Netherlands. He rubbed juice from sick tobacco onto healthy plants and watched the mottling spread. His microscope showed no germ he could name. The tulip's agent hitched rides on insects, and the [[Green peach aphid|green peach aphid]] alone carries more than a hundred plant viruses. This one needed no such ride: hands, tools and a damp cloth were enough.

^ Same puzzle as the tulips: no grower ever saw the agent behind [[Tulip breaking virus]], and Mayer never saw his either.

Some tobacco varieties fought back. Carrying a resistance gene, they answer the virus with [[programmed cell death|Hypersensitive response]]: cells at each entry point die, leaving brown spots that wall the infection in.

## A fluid that was alive

In 1898 [[Martinus Beijerinck]] took the problem to Delft, back in the Netherlands, and went further. The agent multiplied inside living plants and spread through a jelly of agar as if it were a liquid. He never saw it. He named it contagium vivum fluidum, a "contagious living fluid".

^ Even the best light microscopes of 1898 could not resolve this agent; its 18-nanometre width lay far below light's limit.

## A crystal that still sickened

Nearly four decades later, [[Wendell Stanley]] ground infected leaves and coaxed the agent into crystals. A salt crystal does not make a plant sick. Stanley's did: dissolved in water and rubbed onto healthy tobacco, it brought the mosaic back. His 1935 report helped earn him a share of the 1946 Nobel Prize in Chemistry.

In 1939 German researchers used an [[Electron microscope]] to photograph the rods themselves, about 300 nanometres long. Two years later, [[X-ray crystallography|X-ray diffraction]] of the crystals revealed a precise, repeating internal order.

## Taken apart and rebuilt

Twenty years after Stanley's crystals, Heinz Fraenkel-Conrat and Robley Williams split the virus into RNA and protein, then put the two back together. The [[Virus reconstitution|rebuilt particles]] still infected tobacco. Later mixing experiments showed the RNA, not the protein, decided what the offspring looked like.

The rods also build themselves. The protein pieces coil around the RNA on their own, forming a hollow, ordered rod of about 2,130 identical parts. The [[Virus self-assembly|self-assembly]] needs no blueprint beyond the RNA itself.

Materials scientists now use virus rods as [[Nanowire|templates for nanoscale metal wires]], and a [[Viroid|viroid]] shows that bare RNA, with no protein coat at all, can infect a plant. Around 1915, [[Bacteriophage|bacteria-eating viruses]] were identified too, a sign that these filterable agents came in many kinds.
===
- [[Movement protein]] :: Tubes the virus builds through plant-cell holes to hop across. :: deeper :: mechanism
- [[Local lesion assay]] :: Dead leaf spots became a counting tool for infectious virus. :: deeper :: technique
- [[Prion]] :: Infectious proteins with no genes at all, made famous by mad cow disease. :: sideways :: thing
- [[Potato virus Y]] :: Seed growers test for it, since one infected tuber taints a crop. :: sideways :: thing
- [[Antikythera mechanism]] :: A corroded bronze gadget that predicted eclipses, pulled from a shipwreck. :: wild :: thing
>>>
[[Virus reconstitution]] :: It finishes the story: the parts come apart, rebuild, and reveal which half holds the instructions.
???
What exactly is inside one of these rods?
How do plants defend themselves against viruses without antibodies?
Can tobacco virus rods really build tiny metal wires?
`,
  },
  {
    title: "Tobacco mosaic virus and Tulip mania",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Invisible Stripes
> Deck: Dutch fortunes once rode on stripes caused by an infection, and the first virus was found by filtering tobacco sap.
~ You came here from the 1892 filter test, where the sap ran clear yet still made healthy plants sick. The same invisible thing turns out to explain a Dutch bulb market.
@ drift 60
: Market crash = February 1637, Haarlem
: Broken tulips = propagated by offsets, not seed
: Filter test = 1892, Dmitri Ivanovsky
: Virus particle = about 2,130 protein copies, one RNA strand
: Known carrier = green peach aphid
%%%
1637 :: Haarlem bulb auction finds its buyers gone; prices collapse
1892 :: Ivanovsky's filtered sap still infects healthy tobacco plants
1898 :: Beijerinck names the agent a contagious living fluid
1935 :: Wendell Stanley crystallises the agent; crystals stay infectious
1939 :: Electron microscope photographs the rod-shaped particles
1955 :: Fraenkel-Conrat rebuilds active virus from protein and RNA
+++
[[Bulb offsets]] :: Tulips multiply by daughter bulbs, so a rare stripe spread slowly. :: mechanism
[[Semper Augustus]] :: The most coveted broken tulip, whose flames were an infection. :: thing
[[Windhandel]] :: Dutch traders sold bulbs still in the ground, trading contracts for wind. :: mechanism
[[Haarlem]] :: Dutch town whose February 1637 auction is blamed for the crash. :: place
[[Extraordinary Popular Delusions and the Madness of Crowds]] :: Mackay's 1841 book turned the 1637 crash into a lasting legend. :: work
[[Wageningen]] :: Dutch agricultural research station where sick tobacco sap was rubbed onto healthy leaves. :: place
[[Dmitri Ivanovsky]] :: A botanist's filtered sap still made healthy tobacco sick. :: person
[[Chamberland filter]] :: A porcelain candle fine enough to stop bacteria, yet not the disease. :: thing
[[Martinus Beijerinck]] :: The Delft microbiologist who showed the agent multiplied inside the plant. :: person
[[Contagium vivum fluidum]] :: Beijerinck's 1898 name for an agent that behaved like a living liquid. :: concept
[[Wendell Stanley]] :: He crystallised the virus, and the crystals still infected healthy plants. :: person
[[Electron microscope]] :: An instrument that resolved virus rods a light microscope could never show. :: technique
[[Viral reconstitution]] :: Protein and RNA, separated and mixed again, still infected a tobacco leaf. :: technique
[[Green peach aphid]] :: A tiny sap-sucker that spreads over a hundred plant viruses. :: creature
---
The idea running through your path took centuries to arrive: a disease can spread through something too small to see and too fine to filter out. It took a Dutch market, a botanist's porcelain candle and a chemist's crystals, and the prized flower at the start was sick all along.

## Stripes that would not breed true

In the 1630s, collectors paid for broken tulips without knowing why they were broken. Seedlings from a striped parent usually came up plain, so growers depended on [[daughter bulbs|Bulb offsets]], and a weakened broken bulb made only a few. The most coveted of them, [[Semper Augustus]], was rarity built into a bulb.
^ The name probably comes from the Persian word for turban, and the flower reached Europe from Ottoman gardens.

Traders did not wait for bulbs to be lifted. They sold contracts for bulbs still in the ground, a practice called [[wind trade|Windhandel]]. In early February 1637, a sale at [[Haarlem]] found its buyers gone, and prices collapsed.

The legend came later. The Scottish journalist Charles Mackay retold it in 1841 in [[Extraordinary Popular Delusions and the Madness of Crowds]], and his picture of a nation gone mad became the lasting image. Historians such as Anne Goldgar argue the damage was far narrower.

## Sap that got through

In the 1880s, the mottled disease of tobacco worried growers. At the agricultural station in [[Wageningen]], the German chemist Adolf Mayer rubbed sick leaf juice onto healthy plants and watched the mottling spread. He was sure a bacterium was to blame and never found one.

In 1892 the Russian botanist [[Dmitri Ivanovsky]] tried a sharper test. He forced the sick juice through a [[porcelain filter|Chamberland filter]], fine enough to stop bacteria. The juice came out clear, and it still made healthy tobacco sick. Whatever was spreading it had slipped through.

Eight years later, at Delft, the Dutch microbiologist [[Martinus Beijerinck]] showed the agent multiplied inside the plant: a drop of infected juice, diluted again and again, still infected the next plant. Unable to grow it on any culture medium, he named it a [[contagious living fluid|Contagium vivum fluidum]].
^ Some colleagues read the agent as a poison or an enzyme, and the argument over whether it was alive ran for decades.

## Seeing the invisible

In 1935 [[Wendell Stanley]] crystallised the agent from infected leaves, and the crystals were still infectious. A crystal is chemistry, not life, so Stanley's agent looked like a protein that could still infect. Light microscopes could not show its particles at all.

In 1939 a Berlin team turned an [[electron microscope|Electron microscope]] on the virus and photographed its rods, about 300 nanometres long. Later X-ray work and chemistry revealed the build: a helix of about 2,130 identical protein copies around one strand of RNA, roughly 6,400 bases long. The particles survive drying and move on hands and tools, one reason the disease spread so easily through tobacco fields.

In 1955 Heinz Fraenkel-Conrat and Robley Williams [[rebuilt the virus from its parts|Viral reconstitution]]: they split it into protein and RNA, mixed them again, and got active rods that infected tobacco. The virus, it turned out, was a message wrapped in protein.

## Back to the stripe

Once a virus was understood as genetic material in a protein coat, the tulip stripe made sense as an infection with a travel plan. Tulip breaking is now linked to a potyvirus, and its carriers include the [[green peach aphid|Green peach aphid]], which passes the virus from plant to plant while it feeds.
^ The aphid from [[Tulip breaking virus]] was visible all along, which the virus never was.

The chain closes there. The virus weakened the bulb, the weak bulb made few offsets, and the scarce offsets were what buyers wanted to own. Nobody in 1637 could see the cause, and nobody needed to see it to set a price.
===
- [[Potyvirus]] :: The largest genus of plant viruses, most of them spread by aphids. :: deeper :: thing
- [[Helical capsid]] :: One protein copied along a spiral, building a 300-nanometre rod. :: deeper :: concept
- [[Dutch auction]] :: A price that falls until someone buys, still used for flowers today. :: sideways :: technique
- [[Wheat stem rust]] :: A fungus that needs a barberry bush to finish its life cycle. :: sideways :: creature
- [[Tardigrade]] :: Water bears that survived unshielded exposure to space in 2007. :: wild :: creature
>>>
[[Bacteriophage]] :: Once viruses were a category, scientists found ones that eat bacteria within two decades.
???
Is a virus alive if it can crystallise like salt?
Do any viruses help their hosts rather than harm them?
Why are broken tulips so rare in shops today?
`,
  },
  {
    title: "Mantis shrimp vision",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Mantis shrimp vision
> Its eyes read the spin of light and carry more colour channels than humans, yet seem to skip the comparison that gives hue.
~ You started with this shrimp's eyes, so the page opens three doors: bees steering by the sky, cuttlefish spotting silvery fish by their polarised glint, and a faint bow-tie visible in your own eye.
@ drift 0
: Spectral receptor types = 12 to 16, against 3 in humans
: Circular polarisation = demonstrated behaviourally in 2008
: Eyes = two stalks, each moving independently
: Hue discrimination = coarse in behavioural tests
%%%
1989 :: Cronin and Marshall count at least ten spectral types
2008 :: Chiou and colleagues show circular polarisation vision in peacock mantis shrimp
2009 :: Roberts and colleagues report an achromatic quarter-wave retarder in the eye
2014 :: Thoen and colleagues argue the colour sense is a different form
+++
[[Circular polarisation]] :: Eyes that tell a light wave's left-handed spiral from its right. :: phenomenon
[[Quarter-wave plate]] :: Eye tissue that works as one across the whole visible spectrum. :: thing
[[Trichromacy]] :: Humans manage with three cone types; the shrimp's dozen-plus raise a puzzle. :: concept
[[Colour opponency]] :: The red-green and blue-yellow comparison that builds human hue, possibly skipped here. :: mechanism
[[Opsin]] :: Light-catching proteins; filters may turn a few into a dozen channels. :: mechanism
[[Haidinger's brush]] :: A faint bow-tie smudge that hints you are weakly polarisation-sensitive too. :: phenomenon
[[Peacock mantis shrimp]] :: The species whose eyes showed circular polarisation vision in 2008. :: creature
[[Compound eye]] :: Many tiny light guides, each sampling one patch of the scene. :: thing
[[Trinocular vision]] :: A proposed depth sense from overlapping eye regions, still debated. :: mystery
[[Biofluorescence]] :: Some shells absorb ultraviolet and re-emit it as visible glow. :: phenomenon
[[Sky polarisation]] :: Scattered sunlight polarises the sky in a pattern bees steer by. :: phenomenon
[[Cuttlefish]] :: Uses polarisation contrast to spot silvery fish against the background. :: creature
[[Brewster's angle]] :: Where reflected glare turns fully polarised: about 53 degrees for water. :: concept
---
Mantis shrimp are not shrimp. They are stomatopods, a separate crustacean order, and many carry a club that can smash a crab's shell. Their eyes are the stranger gear. Each eye sits on a stalk that moves independently of its partner, and each carries between 12 and 16 spectral types of photoreceptor, depending on species, against three cone types in a human eye. That gap makes [[trichromacy|Trichromacy]] the useful yardstick: three cones suffice for humans, so the shrimp's extra channels raise a question about what colour means to it.

## Many channels, coarse hues

In 1989 Cronin and Marshall found at least ten spectral types in one retina, and later studies reported up to 16. Humans compare their cone signals in [[colour opponency|Colour opponency]], a comparison that is in effect a subtraction, turning tiny wavelength shifts into clear hue differences. Behavioural tests suggest the shrimp does not make that comparison. Thoen and colleagues argued in 2014 that its colour sense is a different form, with poor discrimination between close hues despite the channel count.
^ Four to five times the human channel count on paper, yet the hue results read as a paradox.

One proposal puts the diversity in the eye's hardware rather than its brain. Coloured filters in front of a small set of [[opsins|Opsin]], the light-catching proteins, could create most of the spectral spread, sorting light before any comparison happens.

## Reading the spin of light

Light can vibrate in one plane, which is ordinary linear polarisation, or trace a helix, which is [[circular polarisation|Circular polarisation]]. In the circular case the electric field rotates as the wave travels, and the shrimp's trick is telling left-handed spirals from right-handed ones. In 2008, trained behavioural tests showed that the [[peacock mantis shrimp|Peacock mantis shrimp]] can make that distinction.

An eye still needs a way to turn that spin into something its receptors can register. In 2009 Roberts and colleagues reported a [[quarter-wave plate|Quarter-wave plate]] built from the eye's own tissue, an achromatic retarder whose phase shift holds across the spectrum. Bench quarter-wave plates are usually tuned to one wavelength, so a version that holds across colours is notable.
^ Humans have a faint polarisation sense too: [[Haidinger's brush]] is a bow-tie smudge that shows up when you look at polarised light.

## Eyes that do not agree

The eyes add another layer. Each eye moves on its own stalk and is a [[compound eye|Compound eye]], built from many tiny light guides that each sample one patch of the scene. The central band holds a specialised strip of those units, and some researchers propose that overlapping fields there give a depth sense by triangulation. That [[trinocular vision|Trinocular vision]] idea is argued for and against, and whether the shrimp uses it for range is unresolved.
^ Chameleons also swivel their eyes independently, so the movement is less unusual than the optics.

## The light the shrimp lives in

Light is polarised long before it reaches an eye. Scattered sunlight polarises the sky in a pattern, the [[sky polarisation|Sky polarisation]] that honeybees use to steer even when the sun is hidden. Reflection off water has a fixed signature too: at [[Brewster's angle]], about 53 degrees for water, reflected light is fully polarised. The [[cuttlefish|Cuttlefish]] exploits this from the predator's side, spotting silvery fish, whose bright flanks reflect polarised light, against a cluttered background.

Some species add light of their own: their shells show [[biofluorescence|Biofluorescence]], absorbing ultraviolet and re-emitting visible glow. One study argued this boosts the colour signal they send, though whether rivals or the shrimp's own eyes care is still open.
===
- [[Screening pigments]] :: Coloured filters that may turn a few opsins into a dozen-plus channels :: deeper :: mechanism
- [[Desert ant]] :: A desert ant counts its steps and reads polarised sky to find home :: sideways :: creature
- [[Pleochroism]] :: Some gems change colour as you turn them, through polarised absorption :: sideways :: phenomenon
- [[Cavitation]] :: The club's wake forms a bubble whose collapse may add to the blow :: wild :: phenomenon
- [[Green fluorescent protein]] :: The absorb-and-re-emit glow behind the jellyfish protein that won a 2008 Nobel :: wild :: thing
>>>
[[Colour opponency]] :: It explains the comparison step the shrimp seems to skip, the page's central puzzle.
???
What do the shrimp's eyes actually tell apart, if not hue?
Why would circular polarisation help a shrimp at all?
Can a shrimp really judge distance with its eyes?
`,
  },
  {
    title: "Quarter-wave retarder",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Quarter-wave retarder
> A quartz slab 16 micrometres thick turns straight light into a corkscrew, but only at the colour it was cut for.
~ You stopped mid-sentence at 'delay one…', and this page is the rest of it: the plate that holds one polarization a quarter cycle behind the other.
@ drift 60
: Retardance = a quarter cycle, 90 degrees of phase
: Quartz birefringence = about 0.009 at 589 nm
: Zero-order quartz plate = about 16 micrometres thick
: Calcite zero-order plate = under 1 micrometre
: Thickness rule = λ / 4Δn
%%%
1669 :: Bartholin finds Iceland spar splits light into two rays.
1823 :: Fresnel's rhomb turns linear light into circular using two internal reflections.
1956 :: Pancharatnam shows polarization cycles leave a measurable phase.
1984 :: Berry extends the phase to adiabatic quantum cycles.
2008 :: Stomatopods shown to tell the two circular spins apart.
+++
[[Birefringence]] :: Calcite splits one beam into two rays racing at different speeds. :: phenomenon
[[Iceland spar]] :: Clear Icelandic calcite that doubled what was seen through it in 1669. :: thing
[[Fresnel rhomb]] :: Plain glass, no crystal: two internal reflections make a quarter-cycle shift. :: thing
[[Augustin-Jean Fresnel]] :: A road engineer who turned polarization into proof of light's transverse waves. :: person
[[Pancharatnam-Berry phase]] :: A polarization loop that returns home still leaves a measurable phase behind. :: phenomenon
[[Haidinger's brush]] :: Your own macular pigment lets you see polarization as a faint bow-tie. :: phenomenon
[[Chrysina resplendens]] :: This jewel scarab reflects left-handed circular light from its helical shell. :: creature
[[RealD 3D]] :: Tilt your head and linear 3D glasses leak images; circular ones do not. :: technique
[[OLED display]] :: Many OLED phones cancel their reflections with a 45-degree quarter-wave film. :: thing
[[Poincaré sphere]] :: Every polarization is a point; a quarter-wave plate is a quarter turn. :: concept
[[Malus's law]] :: Crossed polarizers go dark until a third filter at 45 degrees comes between. :: concept
[[Cholesteric liquid crystal]] :: A helix of molecules that reflects one handedness and passes the other. :: mechanism
[[Ellipsometry]] :: Thin films reveal their thickness by how they change polarization on reflection. :: technique
[[Circular dichroism]] :: Molecules absorb left and right circular light differently, exposing their handedness. :: phenomenon
---
A quarter-wave retarder is a plate of [[Birefringence|birefringent]] material, one whose refractive index depends on polarization direction, cut so the phase difference between its fast and slow axes is exactly 90 degrees. Launch linear light at 45 degrees to the fast axis, the quicker direction, and it leaves circular; launch circular light and it leaves linear. This is the missing piece of the mantis shrimp's trick. A linear analyzer (a polarizer used as a detector) cannot see spin on its own, so the sense few animals share needs a converter first, and this plate is that converter.

## Thickness is the whole design

Retardance is 2π·Δn·d/λ, with Δn the birefringence, d the thickness and λ the wavelength, so a zero-order plate (retardance under one full wave) is a quarter wave when d = λ/4Δn. [[Iceland spar]], the clear calcite Bartholin examined in 1669, has Δn near 0.17, which makes its zero-order quarter wave under a micrometre thick and too fragile to handle. Quartz, with Δn near 0.009, needs about 16 micrometres for a zero-order quarter wave, so most working plates are multi-order: a quarter wave plus whole waves, sturdier but far more wavelength-sensitive. A zero-order quarter wave at 589 nm gives roughly 120 degrees at 450 nm. Crossing a 1.25-wave plate with a 1-wave plate, axes at 90 degrees, nets a quarter wave while keeping both thick enough to handle. [[Ellipsometry]] rigs rotate such a retarder to read thin-film thickness from reflected polarization.

^ Wait, really? A quartz plate of ten and a quarter waves is exact at 589 nm, and again near 537 and 653 nm, but not in between.

## Spin becomes a sign

Any beam can be written as four Stokes numbers: intensity, two linear components, and S3, the circular part, whose sign is the handedness. A quarter-wave plate with its fast axis horizontal maps S3 onto the diagonal S2, so each spin leaves as linear light at plus or minus 45 degrees, and a 45-degree analyzer passes one spin at full strength and blocks the other. The edge case is alignment. Launch at 40 degrees, not 45, to the fast axis and the output is an ellipse with axis ratio tan 40°, about 0.84, not a circle. [[Malus's law]], I = I0 cos²θ, governs only linear light; circular light passes one half at every angle, so an analyzer alone sees no spin.

Retarders act as rotations of the [[Poincaré sphere]], the map of all polarization states, where a quarter-wave plate is a quarter turn. A loop of states that returns to its start still carries a [[Pancharatnam-Berry phase]], a geometric phase equal to half the solid angle the loop encloses.

## Spin in screens, eyes and beetles

Many [[OLED display|OLED]] phones cancel their own reflections with a 45-degree quarter-wave film: light reflecting off the metal electrodes returns with its handedness reversed, and the film turns it into the orientation the front polarizer blocks. [[RealD 3D]] cinema sends one handedness to each eye, so tilting your head leaks images through linear glasses but not circular ones.

^ Not a crystal at all: the film is stretched plastic, and pulling aligns its polymer chains into a birefringent sheet.

Your own eye has a faint version of the trick: yellow macular pigment absorbs the two polarizations unequally, which is why [[Haidinger's brush]] shows as a bow-tie against blue sky. [[Circular dichroism]] is the chemists' version: an absorption difference between the two spins that reads molecular handedness.

Nature builds the same selectivity: the jewel scarab [[Chrysina resplendens]] reflects left-handed circular light from a helical cuticle, a [[Cholesteric liquid crystal|cholesteric]]-like stack of layers. Glass reaches the same quarter cycle with no crystal at all: [[Augustin-Jean Fresnel]]'s [[Fresnel rhomb]] uses two total internal reflections at about 54.6 degrees in glass of index 1.51, each adding 45 degrees of relative phase.

^ Back in [[Mantis shrimp vision]], the same arithmetic runs inside the shrimp's photoreceptors, built from stacked layers rather than cut quartz.
===
- [[Babinet compensator]] :: Two quartz wedges slide past each other to dial in a continuous retardance. :: deeper :: thing
- [[Achromatic waveplate]] :: Stacking materials with opposite dispersion keeps a near-quarter cycle across colours. :: deeper :: technique
- [[Polarized sunglasses]] :: Rotate an LCD phone 90 degrees under polarized shades and it goes black. :: sideways :: thing
- [[Brewster's angle]] :: At one exact angle, reflection removes one polarization entirely. :: sideways :: concept
- [[Gravitational-wave polarization]] :: Gravitational waves have two polarizations 45 degrees apart and a spin of two. :: wild :: phenomenon
>>>
[[Pancharatnam-Berry phase]] :: The phase left when a polarization loop closes depends on geometry, not on plate thickness.
???
Why does one quartz plate fail at other colours?
Can stacked cellophane tape really make a quarter-wave plate?
Do humans have any sense of circular polarization?
`,
  },
  {
    title: "Haidinger's brush",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13",
    text: `# Haidinger's brush
> Look at blue sky and a yellow bow-tie may hover at your gaze's centre, made by pigment inside your own eye.
~ You just read that your own eye has a faint version of the retarder's trick, and this is it: the pigment works best in blue.
@ drift 40
: Discovered = 1844, by Wilhelm Karl von Haidinger
: Pigment = Lutein and zeaxanthin, densest at the fovea
: Peak absorption = Near 460 nm, in the blue
: Needs = Polarised light, such as blue sky
: Shape = Bow-tie that turns with the polariser
%%%
1669 :: Erasmus Bartholin describes Iceland spar splitting every image into two.
1809 :: Arago finds sky's neutral point, 20 degrees above the sun.
1844 :: Haidinger reports the bow-tie he sees in his own eye.
+++
[[Macular pigment]] :: A yellow screen before your cones, absorbing blue more for one polarisation :: thing
[[Henle fibres]] :: Radial nerve fibres that may align the pigment, making the bow-tie possible :: thing
[[Fovea]] :: A pit where the inner retina is shoved aside so light reaches cones :: place
[[Rayleigh scattering]] :: Why sky light is polarised, strongest a right angle from the sun :: mechanism
[[Arago point]] :: A patch of sky where polarisation vanishes, about 20 degrees above the sun :: phenomenon
[[Dorsal rim area]] :: A strip atop a bee's eye that reads sky polarisation directly :: thing
[[Blue field entoptic phenomenon]] :: Stare at bright blue and your white blood cells appear as racing specks :: phenomenon
[[Purkinje tree]] :: Move a light beside your eye; your retinal vessels cast a branching shadow :: phenomenon
[[Maxwell's spot]] :: The same pigment's yellow spot, visible with no polariser at all :: phenomenon
[[Herapathite]] :: A quinine salt whose small crystals polarised light, and led to sheet polarisers :: thing
[[Edwin Land]] :: Turned aligned crystals into sheet polarisers, then instant photography :: person
[[Iceland spar]] :: The 1669 crystal that doubles every image seen through it :: thing
[[Viking sunstone]] :: Did Norse sailors use calcite to find the sun through cloud? :: mystery
[[Circular dichroism]] :: The chemists' cousin that reads a molecule's handedness from absorption :: technique
[[Pleochroism]] :: Iolite, the water sapphire, changes colour as you turn it :: phenomenon

---

Look at a patch of polarised light, such as blue sky away from the sun, and a faint yellow bow-tie can appear at the centre of your gaze. Wilhelm Karl von Haidinger, a mineralogist, described it in 1844, and it is entoptic: the pattern is made inside your eye, not in the sky. The culprit is the [[Macular pigment]], lutein and zeaxanthin packed over the [[Fovea]], which absorbs the two polarisations unequally.

^ Wait, really? Turn a polariser over blue sky and the bow-tie rotates with it, so your eye works as a crude polarimeter.

## A filter that sorts by direction

The mechanism is linear dichroism: absorption that depends on the orientation of the light's electric field. The pigment molecules are thought to line up along the [[Henle fibres]], the radially running axons of foveal cones, so absorption depends on the light's angle to the fibres. The effect is colour-specific, much as the 16-micrometre quartz slab was, and this one peaks near 460 nanometres. The mantis shrimp counts up to 16 receptor types; you get by with three cone types and a pigment that acts like a partial polariser.

Chemists have a sibling, [[Circular dichroism]], which compares left- and right-handed circular light to read molecular handedness. The eye's version uses the linear pair, so it reads orientation rather than spin.

^ Where the mantis shrimp reads the spin of light, your pigment reads only orientation. See [[Mantis shrimp vision]].

## Why blue sky is the right light

Sky light is polarised by [[Rayleigh scattering]]: light bouncing off air molecules is most polarised at right angles to the sun, peaking near three-quarters in clear sky. Close to the sun the pattern breaks down, and the [[Arago point]] is a neutral patch about 20 degrees above it where polarisation vanishes. The brush should therefore be easiest at right angles to the sun. A uniform blue field also shows the pigment without any polariser, as [[Maxwell's spot]], a yellowish patch at the centre of gaze.

## Seeing it, and not seeing it

Haidinger's brush belongs to a family of entoptic effects that show your own eye back to you. Stare at a bright blue field and the [[blue-field effect|Blue field entoptic phenomenon]] lets you watch white blood cells drift through capillaries in front of the photoreceptors. Move a light beside your eye and the [[Purkinje tree]], the shadow of your retinal vessels, branches across the view. The brush is harder to pin down: many people need practice, and the reason for the variation is not fully settled. The fovea's centre has no vessels of its own, so it casts no such shadows.

## Crystals, bees and a disputed sunstone

Haidinger was a mineralogist who studied [[Pleochroism]], the way some crystals change colour as you turn them. A famous double image came from [[Iceland spar]], a calcite crystal Erasmus Bartholin described in 1669. [[Herapathite]], a quinine salt whose crystals were found in 1852 to polarise light, was the working material in the first sheet polarisers of [[Edwin Land]], who went on to co-found Polaroid. Bees skip the pigment: a strip atop the compound eye, the [[Dorsal rim area]], reads the sky's polarisation directly and steers by it. A medieval Icelandic saga mentions a sunstone for finding the sun through cloud. Experiments suggest calcite could do this in twilight or patchy cloud, but whether sailors used it is disputed, so the [[Viking sunstone]] is part legend, part optics experiment.

^ Calcite still makes lab polarisers: Glan prisms split light much as Bartholin's crystal did in 1669.

===
- [[Lutein]] :: The same carotenoid that yellows egg yolks, parked in your retina :: deeper :: thing
- [[Linear dichroism]] :: The physics behind the bow-tie: absorbing one polarisation more than the perpendicular :: deeper :: concept
- [[Polarised sunglasses]] :: Why glare off water is horizontally polarised, and why your sunglasses block it :: sideways :: thing
- [[Floaters]] :: Those drifting specks are shadows of debris floating in your vitreous gel :: sideways :: phenomenon
- [[BICEP2]] :: A 2014 claim of Big Bang gravitational-wave ripples, later blamed on galactic dust :: wild :: event
>>>
[[Blue field entoptic phenomenon]] :: The next trick with the same blue light: watching your own white blood cells move.
???
How do I see Haidinger's brush myself, without equipment?
Do all eyes carry enough macular pigment to show it?
Which animals detect polarised light directly, without any pigment trick?
`,
  },
  {
    title: "Floaters",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Floaters
> What you see is often your own gel, condensed into shadows that swim whenever you move.
~ You clicked the line at the foot of Haidinger's brush, which called those drifting specks shadows of debris in your vitreous gel. Here is what the gel is made of, and why its debris is often the gel itself.
@ drift 60
: Gel volume = About 4 millilitres per eye
: Gel makeup = Roughly 99% water, collagen fibrils, hyaluronan
: Latin name = Muscae volitantes, meaning flying flies
: Usual trigger = Gel shrinks and detaches, often after fifty
%%%
+++
[[Vitreous humour]] :: A gel that is roughly 99% water yet keeps the eyeball round. :: thing
[[Hyaloid artery]] :: A fetal blood vessel runs through the gel, then regresses, leaving a canal. :: thing
[[Hyaluronan]] :: The sugar polymer holding the gel's water is also a cosmetic filler. :: thing
[[Syneresis]] :: Gels squeeze out their own water as their network contracts, like cheese whey. :: concept
[[Posterior vitreous detachment]] :: The gel peels off the retina, and the tug can register as light. :: phenomenon
[[Weiss ring]] :: A ring-shaped floater left at the optic disc when the gel pulls free. :: phenomenon
[[Photopsia]] :: Flashes of light from a tug on the retina, though no light enters. :: phenomenon
[[Synchysis scintillans]] :: Cholesterol crystals that glitter in liquefied gel as the eye moves. :: phenomenon
[[Depth of field]] :: Why a smaller pupil sharpens a floater's shadow on your retina. :: concept
[[Ophthalmoscope]] :: Helmholtz's 1851 device let doctors see the retina of a living eye. :: thing
[[Vitrectomy]] :: Surgeons remove the gel and refill the eye with saline, gas or oil. :: technique
[[Nd:YAG laser vitreolysis]] :: A laser breaks floaters into smaller pieces, with mixed evidence and retinal risk. :: technique
[[Retinal detachment]] :: A tear lets fluid lift the retina off the layer that feeds it. :: phenomenon
---
Haidinger's brush is pigment in the retina; a floater is the reverse: a shadow cast onto the retina from in front of it, by something suspended in the [[Vitreous humour]]. That gel is roughly 99% water, so it is nearly invisible, which is why the few things suspended in it stand out.
^ The foot of [[Haidinger's brush]] called floaters debris, but many are collagen that has clumped.

## What the gel is made of

The vitreous fills about four millilitres. It has no blood supply, so its clarity rests on a sparse network of type II collagen fibrils, the cartilage kind, set in [[Hyaluronan]], a long sugar polymer that binds water. The gel is anchored firmly at the optic disc, where the nerve leaves the eye. Many floaters are that collagen, condensed. Old blood, pigment and inflammatory cells can cast the same shadow.

Before birth, a [[Hyaloid artery]] ran through the same space to feed the developing lens. It regresses and leaves a canal behind.

## Why they swim

A shadow's soft edge grows with pupil diameter and with the floater's distance from the retina, which is the logic of [[Depth of field]]. In bright light a constricted pupil sharpens the shadow; in a dim room a dilated one smears it. The quartz slab you read about was colour-picky, and so is your eye. The lens focuses blue and red at slightly different distances, so one floater can be crisp in one colour and soft in another.
^ A 2 mm pupil blurs a floater's shadow about a third as much as a 6 mm one.

The vitreous is viscoelastic: it both flows and springs back. When the eye rotates, the gel lags, then keeps moving for a moment after the eye stops. The shadow drifts on after your gaze has landed, which is why it darts away when you look straight at it. Uniform fields show floaters best, since a clear sky or white wall gives a faint shadow no texture to hide in.

## When the gel lets go

With age, the collagen network in the gel contracts and squeezes out water, a process called [[Syneresis]], the same expulsion that leaves whey on a cheese curd. Once the gel pulls clear of the retina you have a [[Posterior vitreous detachment]], which comes sooner in longer, short-sighted eyes. The tug can produce [[Photopsia]], flashes of light with no light entering. The ring left on the optic disc's rim is a [[Weiss ring]], a floater with a circular outline.

A sudden shower of new floaters with flashes is a reason to see an eye doctor promptly, because that tug can tear the retina. A tear lets fluid slip beneath the retina and lift it off the layer that feeds it, which is a [[Retinal detachment]] and an emergency.

## Glitter, lasers and surgery

Not every shadow is fibrils. Where the gel has liquefied, [[Synchysis scintillans]] can appear: cholesterol crystals that catch the light and glitter as the eye moves, linked with old bleeding or inflammation. Most floaters need no treatment. When one does, a [[Nd:YAG laser vitreolysis]] session fires short pulses that break it into smaller pieces. The evidence is mixed, and the risks include retinal damage.
^ The laser's pop is a cavitation bubble, the same collapse that erodes ship propellers.

The heavier option is a [[Vitrectomy]], which removes the gel and refills the eye with saline, gas or silicone oil. Surgeons usually reserve it for floaters that badly impair vision. Doctors have looked at the retina through the gel since 1851, when Helmholtz's [[Ophthalmoscope]] made the back of a living eye visible.
===
- [[Asteroid hyalosis]] :: Calcium-soap particles that look like tiny stars floating in the gel. :: deeper :: phenomenon
- [[Hyalocyte]] :: Macrophage-like cells living in the gel's outer skin, eating debris. :: deeper :: thing
- [[Presbyopia]] :: Near focus fades for everyone as the lens stiffens, starting in the forties. :: sideways :: phenomenon
- [[Jellyfish mesoglea]] :: Mostly water, held in shape by a gel much like your vitreous. :: wild :: creature
- [[Cavitation]] :: The bubbles that pop floaters obey the physics that pits ship propellers. :: wild :: phenomenon
>>>
[[Posterior vitreous detachment]] :: It explains why floaters arrive with age, and when a sudden flash needs a doctor.
???
Can a laser remove floaters, and does it work?
Why do some people never notice floaters at all?
How do I tell a harmless floater from a warning sign?
`,
  },
  {
    title: "Posterior vitreous detachment",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14",
    text: `# Posterior vitreous detachment
> The gel behind your eye usually peels off the retina quietly, but the places it refuses to let go can tear it.
~ You came from the shadows that swim, and this is the event that frees the gel from the retina behind it: its outer skin lets go.
@ drift 58
: Usual onset = 50s to 70s
: Firmest hold = vitreous base and disc rim
: Symptomatic cases that tear = a minority
: New flashes or shadow = same-day eye review
%%%
+++
[[Vitreomacular traction]] :: A gel still stuck to the fovea can pull a hole through it. :: mechanism
[[Macular hole]] :: Surgeons close it by peeling a membrane and floating a gas bubble. :: thing
[[Internal limiting membrane]] :: Surgeons stain this basement membrane blue so they can peel it. :: thing
[[Müller cell]] :: Glial cells that span the retina; their feet form the gel's grip. :: thing
[[Vitreous base]] :: The gel's strongest grip is a band fused around the retina's serrated edge. :: thing
[[Lattice degeneration]] :: A thinned oval patch of retina whose edges the gel keeps gripping. :: phenomenon
[[Horseshoe tear]] :: A U-shaped flap that turns into a one-way valve for fluid. :: thing
[[Shafer's sign]] :: Pigment dust drifting in the gel can betray a retinal tear. :: phenomenon
[[Vitreous haemorrhage]] :: A torn vessel can bleed into the gel and cloud the view. :: phenomenon
[[Axial myopia]] :: Long eyes detach their gel earlier, and their retinas tear more often. :: phenomenon
[[Pneumatic retinopexy]] :: A gas bubble presses the tear shut; positioning lasts days. :: technique
[[Hyalocyte]] :: Macrophage-like cells that live in the gel's outer cortex. :: thing
[[Allvar Gullstrand]] :: The Nobel-winning ophthalmologist whose 1911 slit lamp lets doctors look into the gel. :: person
[[Slit lamp]] :: A narrow sheet of light that shows the gel's cortex in layers. :: thing
---
The gel behind those shadows is not loose. Its outer skin, the vitreous cortex, is pinned at several firm sites and free almost everywhere else, and those pins decide where a detachment starts and where it can tear. Posterior vitreous detachment (PVD) is the moment that skin lets go of the retina. It is usually painless, and by about seventy it is the norm.

^ Each eye's gel separates on its own clock, so one eye can detach well before the other.

## Where the gel holds

The firmest grip is at the [[vitreous base|Vitreous base]], a band of gel fused around the retina's serrated front edge, and at the rim of the optic disc, where the nerve exits the eye. Between those anchors the cortex rests on the [[internal limiting membrane|Internal limiting membrane]], the retina's innermost sheet, which is partly built from the flattened tips of [[Müller cell]]s, glia (support cells) that span the retina's full thickness. A detachment is adhesion failing at that cortex-glia boundary, not the gel tearing itself.

## How the peel starts

Shrinkage is not enough by itself. Liquefaction, the gel turning watery, opens a fluid pocket behind the cortex, and that pocket lifts the skin where its anchors are weakest. The separation then travels like a peel, a moving front, and the disc rim is the last hold: when the cortex finally tears free there, it leaves the Weiss ring you met. The cortex also holds [[hyalocytes|Hyalocyte]], macrophage-like cells, so the skin being peeled is living tissue, not inert film.

## Who gets it, and when

Onset clusters in the fifties to seventies, but eye length shifts the clock. In [[axial myopia|Axial myopia]], the globe is stretched long and its gel liquefies sooner, so the cortex lets go early and the retina tears more often. Trauma and some eye operations can bring the date forward. Age predicts the odds, not the date, which is why two people of the same age can sit at very different stages.

## When the peel tears

Most separations end quietly; the dangerous ones pull where the gel refuses to release. A [[lattice degeneration|Lattice degeneration]], a thinned, oval patch of peripheral retina with its edges gripped by gel, is a classic site where the pull succeeds. It can break as a [[Horseshoe tear]], a U-shaped flap that acts as a valve, letting liquid slip beneath and lift the retina. Where the pull drags a vessel, blood enters the gel as [[vitreous haemorrhage|Vitreous haemorrhage]]. Shed pigment can drift into the gel as [[Shafer's sign]], or tobacco dust, which flags a tear in the periphery.

The fovea, a pit barely 1.5 mm across and the centre of sharpest vision, has its own failure mode. If the gel stays tethered there, the pull is [[vitreomacular traction|Vitreomacular traction]], and it can drag the centre into a [[macular hole|Macular hole]]. Surgeons close the hole by removing the gel and peeling the membrane around it, often with a gas bubble to hold the edges.

^ Your [[Haidinger's brush]] came from pigment at this same pit, so the spot that made it is where an incomplete detachment can hold on.

For breaks in the upper retina, [[pneumatic retinopexy|Pneumatic retinopexy]] avoids scleral surgery (on the white outer wall): a gas bubble floats up to press the break shut, and the head position must be held for days.

Doctors read the separation edge with a [[slit lamp|Slit lamp]], a microscope that projects a thin sheet of light, a design by [[Allvar Gullstrand]], the Nobel-winning ophthalmologist, from 1911.

A flash means the retina is being pulled, not necessarily a tear, so watch for change: a new shower of floaters, fresh flashes or a shadow at the edge of vision needs same-day eye care, because a tear caught early is usually sealed before fluid lifts the retina.
===
- [[Retrocortical cistern]] :: Liquid collecting behind the cortex is what actually lifts it off. :: deeper :: thing
- [[Wieger's ligament]] :: A fibrous cord ties the optic disc to the lens's back surface. :: deeper :: thing
- [[Epiretinal membrane]] :: A cellophane-thin membrane that often wrinkles the fovea after separation. :: sideways :: phenomenon
- [[Bruch's membrane]] :: The retina's outer basement sheet, which thickens and collects debris with age. :: sideways :: thing
- [[Griffith's criterion]] :: Like the gel's front: a crack runs when released energy beats surface cost. :: wild :: concept
>>>
[[Horseshoe tear]] :: It is the break that can turn this harmless peel into a detached retina, the natural next question.
???
Can a retinal tear form without any flashes at all?
How do clinicians decide which tears need sealing?
Why does one eye detach long before the other?
`,
  },
];
