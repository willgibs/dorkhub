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
    title: "Frederick Lanchester",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Frederick Lanchester :: person
> Deck: A car builder, then a wing theorist, then the man who put war into equations, and the order is the clue.
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
- [[Lifting-line theory]] :: Prandtl's 1918 wing model took up the vortex picture Lanchester had published in 1907. :: concept
- [[Lanchester balancer]] :: Counter-rotating weights that damped engine shake, a fix from his cars :: thing
- [[Aircraft in Warfare]] :: The 1916 book printing the combat formula, and arguing for a fourth arm :: work
- [[Ackermann steering]] :: Named for an 1818 British patent; a Munich coachbuilder may have come first :: mechanism
- [[Brooklands]] :: Britain's first purpose-built motor circuit, later a wartime aircraft factory :: place
- [[Tunguska event]] :: A 1908 airburst flattened roughly 2,000 square kilometres of Siberian forest :: event
???
Did the square law ever predict a real battle accurately?
How did a car engineer end up explaining why wings lift?
Was Lanchester's vortex picture of lift ever seriously disputed?
`,
  },
  {
    title: "Did the square law ever predict a real battle?",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Combat Modelling in Practice :: mystery
> Deck: Double the soldiers, quadruple the punch: the formula looked tidy on paper, so how did it fare against real Second World War fighting?
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
- [[Kriegsspiel]] :: Prussian wargames tried to simulate combat's arithmetic long before any real shot was fired. :: technique
- [[Circular error probable]] :: The radius where half your shots land, buried inside every kill-rate estimate. :: concept
- [[Prisoner's dilemma]] :: A two-prisoner puzzle that became a theory of trust and arms talks. :: concept
- [[HMS Dreadnought]] :: One 1906 battleship made rival navies' fleets obsolete at a stroke. :: thing
- [[Mpemba effect]] :: Hot water can freeze faster than cold, a claim still disputed. :: phenomenon
- [[Ant mill]] :: Army ants can circle in a loop, following each other until exhausted. :: phenomenon
???
Which battles fit the square law best, and what made them different?
How would a commander measure a kill rate before the battle?
Are predator-prey and arms race models really the same shape?
`,
  },
  {
    title: "Bren gun",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Bren gun :: thing
> Its name is half a Czech city and half an English factory, and the gun was Czech before it was British.
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
- [[Bren gun variants]] :: Picks up the story after 1945, when the same gun became the L4 and kept serving. :: thing
- [[Bren gun magazine]] :: A curved 30-round box on top that gave the gun its silhouette. :: thing
- [[Sten gun]] :: Britain's cheap wartime gun, stamped from steel tube and made by the million. :: thing
- [[Boys anti-tank rifle]] :: A British shoulder rifle built to stop tanks, and quickly outgrown by them. :: thing
- [[Villa Tugendhat]] :: Brno's 1930 glass villa, built the same years the gun was being perfected. :: work
- [[Metronome]] :: The Bren's fixed 500-a-minute beat is a metronome's job, in steel. :: thing
???
Why did Britain choose a Czech design over its own guns?
What did the British change when they rebuilt the Czech gun?
Did the Germans really fire captured Brens against British troops?
`,
  },
  {
    title: "Steam explosion",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Steam explosion :: phenomenon
> Deck: Drop molten metal into water and the water can flash to steam in milliseconds, shattering the melt and sending a shockwave outward.
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
- [[Homogeneous nucleation]] :: It explains how pure water overheats, and why any speck of impurity ends that wait. :: mechanism
- [[Critical point]] :: Above 374°C, water no longer has a boundary between liquid and gas. :: concept
- [[Boiling liquid expanding vapour explosion]] :: A pressurised tank in a fire can flash its contents into a fireball. :: phenomenon
- [[Steam hammer]] :: Condensing steam can slam a pipe's water like a hammer, rupturing it. :: phenomenon
- [[Bombardier beetle]] :: A beetle's chemistry heats its chamber until it fires boiling spray. :: creature
- [[Tunguska event]] :: A 1908 Siberian airburst flattened forest, yet left no crater. :: mystery
???
Can water really stay liquid past its boiling point?
Do steam explosions need confinement to do real damage?
Why does water in hot oil spit so violently?
`,
  },
  {
    title: "popcorn",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Popcorn :: phenomenon
> Every kernel is a sealed pressure vessel that bursts at about 135 psi, and the snack is the aftermath.
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
- [[Bronchiolitis obliterans]] :: It is the disease the story has been circling, and it explains why the damage cannot reverse. :: phenomenon
- [[Zea mays everta]] :: Its Latin name means 'turned outward', describing the pop itself. :: thing
- [[Amylopectin]] :: The branched starch molecule that gives cooked starch its thick, sticky body. :: concept
- [[Jiffy Pop]] :: A foil pan that balloons into a dome as kernels pop beneath it. :: thing
- [[Pop Rocks]] :: Sugar candy with carbon dioxide sealed inside, released as saliva dissolves it. :: thing
- [[Thomae's function]] :: Nicknamed the popcorn function, it is discontinuous at every rational number. :: concept

???
Does eating microwave popcorn actually harm the lungs?
Why do a few kernels refuse to pop at all?
Would popcorn still pop in a vacuum?
`,
  },
  {
    title: "Tulip breaking virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Tulip breaking virus :: concept
> Growers never saw the virus behind their stripes, but its first clue slipped through a filter built to stop bacteria.
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
- [[Tobacco mosaic virus]] :: It is the disease behind the 1892 filter test, and the first virus ever crystallised. :: thing
- [[Aphid stylet]] :: A mouthpart that tests plant cells, one probe at a time. :: thing
- [[Bulb offset]] :: Daughter bulbs that carry the stripe forward, year after year, in the soil. :: thing
- [[Bulb forcing]] :: A cold-room trick that coaxes tulips into bloom in midwinter. :: technique
- [[Tulip fire]] :: A fungal blight that scorches tulip leaves and buds, unlike any virus. :: phenomenon
- [[Dutch elm disease]] :: Elm bark beetles carry its fungus between trees, much as aphids carry viruses. :: phenomenon
???
Can a virus change a flower's colour without killing the plant?
How can a grower spot an infected bulb before it flowers?
Why did commercial growers stop selling the striped lines?
`,
  },
  {
    title: "Tobacco mosaic virus",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Tobacco mosaic virus :: thing
> Deck: A botanist's filter test in 1892 led to a virus crystallised, photographed and rebuilt from its parts.
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
- [[Virus reconstitution]] :: It finishes the story: the parts come apart, rebuild, and reveal which half holds the instructions. :: technique
- [[Movement protein]] :: Tubes the virus builds through plant-cell holes to hop across. :: mechanism
- [[Local lesion assay]] :: Dead leaf spots became a counting tool for infectious virus. :: technique
- [[Prion]] :: Infectious proteins with no genes at all, made famous by mad cow disease. :: thing
- [[Potato virus Y]] :: Seed growers test for it, since one infected tuber taints a crop. :: thing
- [[Antikythera mechanism]] :: A corroded bronze gadget that predicted eclipses, pulled from a shipwreck. :: thing
???
What exactly is inside one of these rods?
How do plants defend themselves against viruses without antibodies?
Can tobacco virus rods really build tiny metal wires?
`,
  },
  {
    title: "Tobacco mosaic virus and Tulip mania",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Invisible Stripes :: concept
> Deck: Dutch fortunes once rode on stripes caused by an infection, and the first virus was found by filtering tobacco sap.
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
- [[Bacteriophage]] :: Once viruses were a category, scientists found ones that eat bacteria within two decades. :: thing
- [[Potyvirus]] :: The largest genus of plant viruses, most of them spread by aphids. :: thing
- [[Helical capsid]] :: One protein copied along a spiral, building a 300-nanometre rod. :: concept
- [[Dutch auction]] :: A price that falls until someone buys, still used for flowers today. :: technique
- [[Wheat stem rust]] :: A fungus that needs a barberry bush to finish its life cycle. :: creature
- [[Tardigrade]] :: Water bears that survived unshielded exposure to space in 2007. :: creature
???
Is a virus alive if it can crystallise like salt?
Do any viruses help their hosts rather than harm them?
Why are broken tulips so rare in shops today?
`,
  },
  {
    title: "Quarter-wave retarder",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Quarter-wave retarder :: concept
> A quartz slab 16 micrometres thick turns straight light into a corkscrew, but only at the colour it was cut for.
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
- [[Pancharatnam-Berry phase]] :: The phase left when a polarization loop closes depends on geometry, not on plate thickness. :: phenomenon
- [[Babinet compensator]] :: Two quartz wedges slide past each other to dial in a continuous retardance. :: thing
- [[Achromatic waveplate]] :: Stacking materials with opposite dispersion keeps a near-quarter cycle across colours. :: technique
- [[Polarized sunglasses]] :: Rotate an LCD phone 90 degrees under polarized shades and it goes black. :: thing
- [[Brewster's angle]] :: At one exact angle, reflection removes one polarization entirely. :: concept
- [[Gravitational-wave polarization]] :: Gravitational waves have two polarizations 45 degrees apart and a spin of two. :: phenomenon
???
Why does one quartz plate fail at other colours?
Can stacked cellophane tape really make a quarter-wave plate?
Do humans have any sense of circular polarization?
`,
  },
  {
    title: "Haidinger's brush",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-13; converted to v3 by script",
    text: `# Haidinger's brush :: phenomenon
> Look at blue sky and a yellow bow-tie may hover at your gaze's centre, made by pigment inside your own eye.
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
- [[Blue field entoptic phenomenon]] :: The next trick with the same blue light: watching your own white blood cells move. :: phenomenon
- [[Lutein]] :: The same carotenoid that yellows egg yolks, parked in your retina :: thing
- [[Linear dichroism]] :: The physics behind the bow-tie: absorbing one polarisation more than the perpendicular :: concept
- [[Polarised sunglasses]] :: Why glare off water is horizontally polarised, and why your sunglasses block it :: thing
- [[Floaters]] :: Those drifting specks are shadows of debris floating in your vitreous gel :: phenomenon
- [[BICEP2]] :: A 2014 claim of Big Bang gravitational-wave ripples, later blamed on galactic dust :: event
???
How do I see Haidinger's brush myself, without equipment?
Do all eyes carry enough macular pigment to show it?
Which animals detect polarised light directly, without any pigment trick?
`,
  },
  {
    title: "Floaters",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Floaters :: phenomenon
> What you see is often your own gel, condensed into shadows that swim whenever you move.
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
- [[Posterior vitreous detachment]] :: It explains why floaters arrive with age, and when a sudden flash needs a doctor. :: phenomenon
- [[Asteroid hyalosis]] :: Calcium-soap particles that look like tiny stars floating in the gel. :: phenomenon
- [[Hyalocyte]] :: Macrophage-like cells living in the gel's outer skin, eating debris. :: thing
- [[Presbyopia]] :: Near focus fades for everyone as the lens stiffens, starting in the forties. :: phenomenon
- [[Jellyfish mesoglea]] :: Mostly water, held in shape by a gel much like your vitreous. :: creature
- [[Cavitation]] :: The bubbles that pop floaters obey the physics that pits ship propellers. :: phenomenon
???
Can a laser remove floaters, and does it work?
Why do some people never notice floaters at all?
How do I tell a harmless floater from a warning sign?
`,
  },
  {
    title: "Posterior vitreous detachment",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Posterior vitreous detachment :: phenomenon
> The gel behind your eye usually peels off the retina quietly, but the places it refuses to let go can tear it.
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
- [[Horseshoe tear]] :: It is the break that can turn this harmless peel into a detached retina, the natural next question. :: thing
- [[Retrocortical cistern]] :: Liquid collecting behind the cortex is what actually lifts it off. :: thing
- [[Wieger's ligament]] :: A fibrous cord ties the optic disc to the lens's back surface. :: thing
- [[Epiretinal membrane]] :: A cellophane-thin membrane that often wrinkles the fovea after separation. :: phenomenon
- [[Bruch's membrane]] :: The retina's outer basement sheet, which thickens and collects debris with age. :: thing
- [[Griffith's criterion]] :: Like the gel's front: a crack runs when released energy beats surface cost. :: concept
???
Can a retinal tear form without any flashes at all?
How do clinicians decide which tears need sealing?
Why does one eye detach long before the other?
`,
  },
  {
    title: "Müller cell",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14; converted to v3 by script",
    text: `# Müller cell :: thing
> The support cells that give your vitreous gel a grip also work as living optical fibres, steering light onto the cones.
@ drift 60
: Spans = inner limiting membrane to photoreceptor junctions
: Cell bodies = inner nuclear layer, among the neurons
: Light guiding = funnels light down to photoreceptors
: Potassium = pulled from outer retina via Kir4.1
%%%
1850s :: Heinrich Müller traces radial fibres spanning the retina's thickness.
1984 :: Retinal glia shown to siphon potassium away from active neurons.
2007 :: Müller cells shown to guide light like living optical fibres.
+++
[[Stiles-Crawford effect]] :: Pupil-edge light counts for less, blamed on cones' waveguide shape. :: phenomenon
[[Foveal pit]] :: Inner layers are pushed aside so cones see light through glia, not neurons. :: thing
[[Kir4.1 channel]] :: A potassium channel that lets glia soak up what neurons spill. :: mechanism
[[Potassium siphoning]] :: Glia lift potassium from the outer retina and dump it into the gel. :: mechanism
[[Aquaporin-4]] :: A water channel that may decide whether a swollen retina drains. :: thing
[[Retinal lactate shuttle]] :: Photoreceptors burn lactate that glia make from glucose. :: mechanism
[[Glutamate-glutamine cycle]] :: Glia recycle spent neurotransmitter back into raw material for neurons. :: mechanism
[[Reactive gliosis]] :: Injured glia swell, multiply and remodel, sometimes into a scar. :: phenomenon
[[Epiretinal membrane]] :: Glia can grow a cellophane sheet that wrinkles your central vision. :: thing
[[Zebrafish retina regeneration]] :: Damaged zebrafish retinas rebuild lost neurons from their own glia. :: phenomenon
[[Henle fibre layer]] :: Cone axons run sideways here, and the yellow pigment lives in this layer. :: thing
[[Optical coherence tomography]] :: Low-coherence light resolves retinal layers a few micrometres apart. :: technique
[[External limiting membrane]] :: A bright OCT line named for glia-cone junctions, not a membrane. :: thing
---
Müller cells are the retina's radial glia, support cells stretched like spokes between its two surfaces. Their cell bodies sit in the inner nuclear layer, the band between the two synaptic layers, but each cell sends one process to the vitreous face and another to the outer limiting membrane, a row of junctions with the photoreceptors. They are among the last cells born in the developing retina, arriving after the neurons they will support. Light reaching a cone has usually crossed one of their processes first.
^ In [[Posterior vitreous detachment]], the sheet under the gel that casts your floaters is partly Müller tips, so the glia share that grip.

## Living light pipes

In 2007 a study of isolated retinas showed that Müller cells guide light like optical fibres, because their refractive index, a measure of how strongly a material bends light, is higher than that of the tissue around them. The authors argued this cuts scatter as light crosses the crowded inner layers. Cones already act as waveguides, the basis of the [[Stiles-Crawford effect]], in which light entering at the pupil's rim counts for less than light through its centre. Müller cells sit one step earlier in the path.

The arrangement is most striking in the fovea. There the inner layers are pushed aside to form a [[foveal pit|Foveal pit]], and Müller processes make up much of what light crosses before reaching the cones. Cones at the centre see light that has passed through glia but almost no neurons.
^ The retina at the fovea is only a couple of hundred micrometres thick, yet one Müller cell can span all of it.

## Potassium, fuel and water

Müller cells also run the retina's housekeeping. Their [[Kir4.1 channel]] lets them take up the potassium that active neurons release, and the cells can release it at the vitreal endfoot in a route called [[potassium siphoning|Potassium siphoning]]. The endfeet also carry [[Aquaporin-4]], a water channel thought to help move fluid out of a swollen retina.

Fuel and transmitter are handled in the same cells. They store glycogen and make lactate that photoreceptors burn, a [[retinal lactate shuttle|Retinal lactate shuttle]] that keeps the outer retina fed. They also clear glutamate, turning it into glutamine with an enzyme called glutamine synthetase, and the glutamine returns to neurons in a [[glutamate-glutamine cycle|Glutamate-glutamine cycle]].

## Scar, sheet and regrowth

Injury makes them reactive. Müller cells upregulate GFAP, the filament protein that marks injured glia, then swell and remodel, a response called [[reactive gliosis|Reactive gliosis]] that can slow repair. Sometimes the glia spread across the inner surface as an [[epiretinal membrane|Epiretinal membrane]], a cellophane-thin sheet that wrinkles the centre of vision. Zebrafish are the exception: after damage, their Müller cells divide and regenerate lost neurons, a [[zebrafish retina regeneration|Zebrafish retina regeneration]] that mammals rarely repeat.
^ Epiretinal membranes are often found in eyes that also had a posterior vitreous detachment.

## Where the yellow sits

Heinrich Müller traced these fibres across the retina in the 1850s, and the name stuck. At the fovea their processes cross the [[Henle fibre layer]], the stretch where cone axons run obliquely and the macular pigment sits. That yellow filter is what makes the bow-tie of Haidinger's brush.

On [[optical coherence tomography|Optical coherence tomography]] (OCT) scans, the bright line just outside the photoreceptor nuclei is the [[external limiting membrane|External limiting membrane]], named for the junctions Müller cells make with photoreceptors, not for a membrane in the usual sense.
===
- [[Epiretinal membrane]] :: The glial sheet these cells form on the surface, often after the gel pulls away. :: phenomenon
- [[Glial gap junctions]] :: Connexin channels electrically couple glia, letting a signal travel sideways. :: mechanism
- [[Müller cell endfoot]] :: The vitreous-facing foot is studded with water and potassium channels. :: thing
- [[Rod photoreceptor]] :: A rod can react to one photon; its outer segment does the amplifying. :: thing
- [[Blood-retina barrier]] :: Glial feet wrap retinal capillaries, helping a barrier that diabetes breaks. :: mechanism
- [[Venus flower basket]] :: Light-piping spicules, the same job as Müller fibres, but built from inert silica. :: creature
???
Does light really travel down Müller cells in a living eye?
Why do zebrafish glia regrow neurons that mouse glia rarely make?
What makes Müller cells protect neurons in one injury and scar in another?
`,
  },
  {
    title: "The Great Emu War",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# The Great Emu War :: event
> In 1932 Australia sent soldiers with machine guns after a flock of emus, and the birds kept running.
+++
[[Lewis gun]] :: thing
[[Deflection shooting]] :: technique
[[Western Australian wheatbelt]] :: place
[[Soldier settlement in Australia]] :: concept
[[Stump-jump plough]] :: thing
[[Rabbit-Proof Fence]] :: thing
[[Myxomatosis]] :: phenomenon
[[Ratite]] :: concept
[[Cassowary]] :: creature
[[Moa]] :: creature
[[Coat of arms of Australia]] :: thing
---
In late 1932 the Australian Army went to war against birds. Farmers in the Campion district of the [[Western Australian wheatbelt]] had asked for help against emus, which were breaking through fences and trampling their crops. The government sent a small force under Major Meredith, armed with [[Lewis gun|Lewis guns]], the light machine guns that Australian troops had used on the Western Front. Newspapers covered the operation as a war, and the name stuck.
::: facts
Scientific name :: Dromaius novaehollandiae
Height :: up to about 1.9 m
Top speed :: about 50 km/h on foot
Flight :: none; its wings are too small
Eggs :: dark green, laid in ground nests
Status :: common, not endangered
:::

## Soldiers on new land
Many of the farmers were returned soldiers who had been given blocks under a [[Soldier settlement in Australia|soldier settlement]] scheme after the First World War. Much of that ground had been scrub until recently, and turning it into wheat paddocks took machinery built for hard ground. Some blocks were poor, and their owners struggled with debt. Grain was the crop, and emus found it an easy meal. With prices low through the Depression, every lost crop hurt.
^ The [[Stump-jump plough]] was an Australian invention, built so its blade could spring over a buried stump and keep going.

Rabbits were the wheatbelt's older pest. Western Australia had built the [[Rabbit-Proof Fence]] to keep them off farmland. Its main line ran for well over a thousand kilometres, and fences alone never settled the matter. Australia's later answer was [[Myxomatosis]], a virus released in 1950 that spread across the continent and killed rabbits in enormous numbers.

## Two guns, one flock
The army's answer was modest: two [[Lewis gun|Lewis guns]] and their crews. The design was American, adopted by the British and their dominions during the First World War, and its pan-shaped magazine sat on top. The guns had been built to hold back infantry, not to chase birds. A running bird is hard to hit, because the gunner has to aim ahead of it, a skill called [[Deflection shooting]]. Every change of course meant starting the aim again.

The operation was called off within weeks, and the army withdrew with little to show for it. How many birds the guns actually killed is uncertain, and the figures in circulation vary widely. The birds were never wiped out, and they still roam much of the state.
::: myth
Myth :: The emus defeated the army in battle.
Actually :: No battle was fought; the birds simply kept out of range.
:::

## The bird and its cousins
The emu is the largest bird native to Australia, and on the open plains it gets around on foot. Its relatives are a strange lot. The [[Cassowary]] lives in the rainforests of north-east Queensland, the extinct [[Moa]] of New Zealand included birds taller than a person, and the emu belongs to the wider group of [[Ratite|ratites]] that have lost the power of flight. Emus eat seeds, shoots and insects, and they swallow stones that grind food in the gizzard. Emus are nomads that follow rain and food across the inland, so a flock turning up at a farm was following the same habit.
^ A male emu sits on the eggs for about eight weeks and eats very little while he does.

Today the emu appears on the [[Coat of arms of Australia]], beside the kangaroo, which is a neat reversal for a bird the army once chased with machine guns.
===
- [[Rabbit-Proof Fence]] :: Western Australia built this wire fence decades before the emus, to protect farmland like theirs. :: thing
- [[Emu migration]] :: Why whole flocks drift across the outback, chasing rain and grass :: phenomenon
- [[Dingo Fence]] :: A wire barrier across the outback, built to keep dingoes off sheep country :: thing
- [[Passenger pigeon]] :: Flocks that darkened the sky, hunted into extinction within a few decades :: creature
- [[Dust Bowl]] :: Depression-era wheat farmers who ploughed up grassland, then watched it blow away :: event
- [[Project Pigeon]] :: Birds drafted into war too: pigeons trained to steer bombs by pecking :: event
???
How many birds did the army actually kill, and how was it counted?
Why did the flocks head for farmland in the first place?
How many emus live in Australia today?
&&&
[[Lewis gun]] :: Trench machine gun later sent after birds in a wheatbelt paddock
[[Deflection shooting]] :: Hitting a running bird means aiming at the empty air ahead
[[Western Australian wheatbelt]] :: Bush cleared for wheat, with emus still walking the old routes
[[Soldier settlement in Australia]] :: Farms handed to returned soldiers, some on land that failed them
[[Stump-jump plough]] :: An Australian invention that let farmers plough through tree roots
[[Rabbit-Proof Fence]] :: A long wire barrier built to keep rabbits out of wheat
[[Myxomatosis]] :: A virus released on purpose to cut Australia's rabbit numbers
[[Ratite]] :: Flightless birds with flying tinamous as close relatives
[[Cassowary]] :: A rainforest bird with a dagger claw and a bony helmet
[[Moa]] :: Giant New Zealand birds hunted to extinction by people
[[Coat of arms of Australia]] :: An emu and a kangaroo holding up the national shield
`,
  },
  {
    title: "Lewis gun",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Lewis gun :: thing
> A machine gun that wore its magazine like a hat, and fought from both trenches and fighter wings.
+++
[[Pan magazine]] :: mechanism
[[Gas operation]] :: mechanism
[[Recoil operation]] :: mechanism
[[Vickers machine gun]] :: thing
[[Hiram Maxim]] :: person
[[Royal Aircraft Factory S.E.5]] :: thing
[[Foster mounting]] :: thing
[[Zeppelin SL 11]] :: event
[[Bren gun]] :: thing
[[ZB vz. 26]] :: thing
[[Birmingham Small Arms Company]] :: thing
[[.303 British]] :: thing
---
The Lewis gun was a light machine gun that carried its ammunition on top. Its cartridges sat in a flat pan above the receiver, and one gunner could carry the whole weapon and fire it from a bipod. Isaac Newton Lewis, an American army officer, designed it before 1914. When war came the British Army took it up, and [[BSA|Birmingham Small Arms Company]] was among the firms building it for Britain, so the design became the main infantry light machine gun of the British Empire.
^ The Lewis was built to hit men advancing across open ground, which makes [[The Great Emu War]] a strange test: its targets kept running.

## A pan and a gas piston

The [[pan|Pan magazine]] was both the Lewis's signature and its weak point. Cartridges of [[.303 British]] coiled round a central spindle inside it. Each pan emptied quickly, so a gunner who ran dry in the middle of an attack had to fit a spare, and spares were carried as a matter of course. The action ran on [[gas|Gas operation]]: gas tapped from the barrel pushed a piston back with each shot, so the gun cycled itself from the first round to the last.
^ At roughly 500 to 600 rounds a minute, a full pan lasted about five seconds of continuous fire.

Britain's other machine gun of the war was the [[Vickers|Vickers machine gun]], a descendant of the gun [[Hiram Maxim]] built in the 1880s. The Vickers ran on [[recoil|Recoil operation]] where the Lewis ran on gas, but the real difference lay in the idea of battle behind each one. The Vickers was built for long, sustained fire from a fixed position. The Lewis was built to go forward with the men who carried it.
::: compare Lewis gun | Vickers machine gun
Cooling :: air, through a finned barrel shroud | water, in a jacket round the barrel
Feed :: 47-round pan on top | 250-round cloth belt
Mount :: a bipod, carried by one gunner | a tripod, worked by a crew
:::

## Above the propeller

The Lewis flew as well. On the [[SE5a|Royal Aircraft Factory S.E.5]] it sat on the upper wing, where its fire passed above the propeller arc instead of through the blades. Reaching a pan up there was awkward, so the gun hung on a [[Foster mounting]], a bracket that let the pilot tip it down toward the cockpit to reload. Two-seaters went further: the observer swung a Lewis on a Scarff ring, the rotating mount that let one gunner cover the sky behind.

One of its strangest aerial jobs was against an airship. Incendiary rounds fired from a Lewis are credited with bringing down the [[Zeppelin SL 11]] over Hertfordshire in 1916. The rounds were meant to ignite the hydrogen inside the envelope rather than merely puncture it.

## What replaced it

The Lewis gave way in British service to the [[Bren gun]] in the late 1930s. The Bren began as the Czech [[ZB vz. 26]], and its name joins two places: Brno, where the Czech design was made, and Enfield, the British arsenal that built it for the army.

The Lewis's lasting contribution was an idea more than a gun: a squad could carry automatic fire forward into an attack. The Bren kept that idea and swapped the pan for a curved box magazine.

===
- [[Bren gun]] :: It replaced the Lewis, and its name joins a Czech city to a British factory. :: thing
- [[Foster mounting]] :: A bracket let a pilot tip a Lewis into the cockpit to reload. :: thing
- [[Pan magazine]] :: Forty-seven cartridges coiled inside one flat pan: how the Lewis fed itself. :: mechanism
- [[Hotchkiss machine gun]] :: France's rival fed from metal strips where the Lewis fed from a pan. :: thing
- [[Zeppelin SL 11]] :: Incendiary Lewis rounds are credited with downing an airship over Hertfordshire. :: event
- [[Volkswagen Beetle]] :: Its air-cooled engine relied on the same finned-metal trick as a Lewis barrel. :: thing
???
How did a trench machine gun end up on fighter wings?
What became of the Lewis guns after the emu war?
Why was the Bren's design Czech, not British?
&&&
[[Pan magazine]] :: Cartridges spiralled inside it, and gunners swapped pans mid-attack.
[[Gas operation]] :: Barrel gas did the work, where Maxim's gun used the recoil.
[[Recoil operation]] :: The Maxim principle behind Britain's heavy guns for decades.
[[Vickers machine gun]] :: Still in British service in the 1960s, long after the Lewis.
[[Hiram Maxim]] :: Built the recoil gun that the Vickers was based on.
[[Royal Aircraft Factory S.E.5]] :: A fighter whose top-wing Lewis fired above the propeller arc.
[[Foster mounting]] :: Bracket that let a pilot tip the gun down to reload.
[[Zeppelin SL 11]] :: The airship that a Lewis's incendiary rounds are credited with downing.
[[Bren gun]] :: Its name joins a Czech city to a British factory.
[[ZB vz. 26]] :: The Czech gun behind the Bren, designed in Brno.
[[Birmingham Small Arms Company]] :: The gunmaker that built British Lewis guns, later famous for motorcycles.
[[.303 British]] :: Rimmed cartridge shared by the Lewis, Lee-Enfield and Vickers.
`,
  },
  {
    title: "Why is ice slippery?",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Ice friction :: mystery
> Ice is slippery because its surface is never fully solid, and scientists still argue over how much water is involved.
+++
[[Pressure melting]] :: mechanism
[[Regelation]] :: phenomenon
[[Quasi-liquid layer]] :: phenomenon
[[Michael Faraday]] :: person
[[Frictional heating]] :: mechanism
[[Freezing-point depression]] :: concept
[[Skate blade]] :: thing
[[Basal sliding]] :: phenomenon
[[Studded tyre]] :: thing
[[Hydrogen bond]] :: concept
[[Black ice]] :: thing
[[Curling ice]] :: thing
---
Step onto a frozen pond and you learn quickly that ice gives very little grip. The short answer is that the surface of ice is not fully solid. Its outermost molecules are less tightly locked in place than the crystal beneath them, so a thin, disordered, liquid-like skin exists even when the air is well below freezing. Sliding friction then adds meltwater, and the question has been argued over for well over a century because several mechanisms seem to be involved.

## The skate-blade story
The classic explanation for skating is [[pressure melting|Pressure melting]]. Squeezing ice lowers its melting point, a fact James Thomson predicted in the nineteenth century and his brother William, later Lord Kelvin, confirmed. The story goes that a [[skate blade|Skate blade]] melts a film of water beneath itself, and the film does the sliding.
^ Most substances melt at higher temperatures under pressure. Water does the reverse, because ice is less dense than water.

But the arithmetic is awkward. Pressure lowers the melting point by only about 0.0075 °C per atmosphere, and the pressure under a blade depends on a contact patch that is hard to measure. At the colder end of rink temperatures the effect looks too weak on its own, so many researchers now treat it as a partial cause at best.

The same squeezing produces a stranger effect, [[regelation|Regelation]]: pressed ice melts, and the water refreezes once the pressure eases. It helps explain why two ice cubes pressed together fuse, and it helps a glacier creep over bumps in its bed, one part of [[basal sliding|Basal sliding]].
^ A thin wire loaded with a weight can pass through a block of ice, which stays in one piece.

## A skin that is never quite solid
The better-supported explanation is that ice has a built-in film. Each molecule in ordinary ice is linked by [[hydrogen bonds|Hydrogen bond]] to four neighbours, but a molecule at the surface is missing some of them, so it is looser and more mobile than those inside. Physicists call the film a [[quasi-liquid layer|Quasi-liquid layer]]. It is thinnest in deep cold and thickens as the ice warms toward 0 °C, which is why ice near freezing is usually the most treacherous. The idea is old: [[Michael Faraday]] suggested in the nineteenth century that ice carries water on its surface. Later experiments support a disordered surface layer, though its measured thickness varies.

## Friction writes its own film
Sliding also heats the surface. In the 1930s the physicists F. P. Bowden and T. P. Hughes argued that [[frictional heating|Frictional heating]] under a moving object can melt a thin film, and the effect grows with speed and is easiest to trigger when the ice is already near 0 °C. The same frictional melting happens inside the Earth, where a fault can melt rock during an earthquake.
::: theories
Pressure melting :: Weight on a blade lowers the melting point, forming a water film :: disputed
Premelting :: Ice carries a thin liquid-like skin even well below freezing :: accepted
Frictional heating :: Sliding friction melts a film on the surface it crosses :: partly
:::

Taken together, the evidence points to a mixture: a permanent skin, friction that adds water as you push, and a pressure effect weaker than the textbooks suggest. Researchers still disagree about the balance.

## What rinks and roads do about it
People have learned to work around the film in several ways. Road crews spread salt because dissolved salt lowers the temperature at which water freezes, a process called [[freezing-point depression|Freezing-point depression]]. [[Studded tyres|Studded tyre]] bite through the film with metal studs to reach the ice beneath, while [[black ice|Black ice]] is dangerous precisely because it is transparent, so a road covered in it merely looks wet. [[Curling ice]] takes a different tack: it is sprayed with droplets that freeze into small bumps, and the stone rides on their tips.
===
- [[Quasi-liquid layer]] :: the film this page keeps circling, and how scientists have tried to measure it :: phenomenon
- [[Vitreous ice]] :: Ice frozen so fast it becomes glass lets microscopists see proteins intact :: thing
- [[Ice resurfacer]] :: Rink machines flood a thin water layer that freezes glass-smooth :: thing
- [[Frost heave]] :: Ice lenses growing in frozen soil can heave roads and pavements upward :: phenomenon
- [[Pseudotachylite]] :: Friction that melts a skate's film can also melt rock along faults :: thing
- [[Leidenfrost effect]] :: Drops on a red-hot pan skate on their own steam, a thin-film trick :: phenomenon
???
Why does ice grip better in deep cold than near freezing?
How much salt does it take to melt ice on a road?
Could a surface be designed to stop ice being slippery?
&&&
[[Pressure melting]] :: a melting point that falls under load, unlike most substances
[[Regelation]] :: ice cubes that fuse, and a wire that slips through ice
[[Quasi-liquid layer]] :: a liquid-like skin on a solid that shouldn't have one
[[Michael Faraday]] :: a famous physicist whose hunch about ice still largely holds
[[Frictional heating]] :: sliding can melt the very surface it rides on
[[Freezing-point depression]] :: salt makes water freeze colder, no pressure needed
[[Skate blade]] :: a sliver of steel whose glide is still argued over
[[Basal sliding]] :: glaciers partly slide on a film of meltwater at their base
[[Studded tyre]] :: metal studs that bite through the film to grip
[[Hydrogen bond]] :: a bond weak alone that makes water's oddities add up
[[Black ice]] :: a glassy film so transparent that roads look merely wet
[[Curling ice]] :: sprayed droplets freeze into bumps the stones ride on
`,
  },
  {
    title: "Lanchester's laws",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Lanchester's laws :: concept
> Double an army and its fighting power quadruples, by a wartime engineer's square law whose fit to real battles is still disputed.
+++
[[Phalanx]] :: thing
[[Battle of Cannae]] :: event
[[Maxim gun]] :: thing
[[Battle of Omdurman]] :: event
[[Concentration of force]] :: concept
[[Centre of gravity (military)]] :: concept
[[Attrition warfare]] :: concept
[[Monte Carlo method]] :: technique
[[Lotka–Volterra equations]] :: mechanism
[[Royal Flying Corps]] :: thing
[[Infantry square]] :: technique
[[Aircraft in Warfare]] :: work
---
Frederick Lanchester was an English engineer who built early motor cars and wrote on aerodynamics. In his [[Aircraft in Warfare|1916 book on aircraft in war]], written as the [[Royal Flying Corps]] grew, he set out two equations for how two forces wear each other down. Both are idealised, and both still turn up whenever someone argues about how armies win.
^ The book's subtitle, The Dawn of the Fourth Arm, puts aircraft beside infantry, cavalry and artillery.

## Melee multiplies, aimed fire squares

The linear law covers melee and unaimed fire (shooting into a mass), where losses come from contact. Each side thins at a rate set by how many enemies are in reach. Lanchester tied it to ancient combat, and the picture to hold is a [[Phalanx|phalanx]] pressing into an enemy line, where every man is touching someone.

The square law covers aimed fire at range. Each shooter has a target that never runs out, so a unit kills at a fixed rate however many enemies remain. Effectiveness, the enemy units each side kills per unit time, is the constant the model leans on. [[Maxim gun|Machine guns]] pushed it up: at [[Battle of Omdurman|Omdurman]] in 1898, thousands of men with spears and swords charged into Anglo-Egyptian fire. The square in the name is arithmetic, not the [[Infantry square|hollow square]] that stopped Napoleonic cavalry.
::: compare Linear law | Square law
Fighting strength :: effectiveness times numbers | effectiveness times numbers squared
Doubling a force :: doubles its strength | quadruples its strength
Losses scale with :: both forces multiplied | only the enemy's numbers
Assumes :: every fighter is in contact | every shooter has a target
:::

## The price of splitting a force

If the square law holds, concentration becomes a price, not a slogan. Split a force in two and each half fights with a quarter of the original strength, so the halves together have only half of it, a loss that exists on paper before the first shot. Clausewitz had already told commanders to find the enemy's [[Centre of gravity (military)|centre of gravity]], a term borrowed from physics. The square law turns that instinct into arithmetic and makes [[Concentration of force|concentration]] calculable.
::: guess
Question :: How many of its 100 units does a force lose destroying two separate 50-unit forces, one after the other?
Answer :: About 29, in the idealised model, leaving roughly 71 survivors.
Why :: Each fight leaves the square root of the difference of squares, so the attacker's survivors shrink far less than the enemy's headcount.
:::

## Where the model breaks

Analysts tested the square law against Second World War battle records, and its fit has been argued over ever since. The equations assume constant effectiveness, no reinforcements and smooth losses, and real units break all three. Morale and terrain get folded into the constants, which is where the trouble hides. [[Battle of Cannae|Cannae]] shows the problem: Hannibal was outnumbered, yet his double envelopment put his men around the Roman mass, and no single pair of constants captures a change of position like that.
^ A 100-unit force beating 90 is left with about 44 units, in the idealised model.

A more realistic version is stochastic, meaning random. Lanchester's equations are deterministic, so one set of numbers gives one outcome, while a [[Monte Carlo method|Monte Carlo]] run lets each engagement be a dice roll and reports the spread. Underneath, these are equations of [[Attrition warfare|attrition]], where the side that can absorb losses longest wins. The same product of two populations that drives the linear law also drives [[Lotka–Volterra equations|predator and prey models]], where losses feed a predator instead of ending a fight. The equations outlived the war, and they remain a standard first model of combat in operational research courses.
===
- [[Concentration of force]] :: The square law's sharpest lesson, and the decision it forces on every commander who has the numbers. :: concept
- [[Lanchester's square law]] :: Effectiveness times squared numbers, compared at the start, names the winner. :: mechanism
- [[Aimed fire]] :: Picking targets is what raises the exponent on numbers from one to two. :: technique
- [[Battle of Jutland]] :: Both fleets claimed victory in 1916, and the ship-loss arithmetic still divides historians. :: event
- [[Battle of Kursk]] :: A tank-heavy battle whose casualty figures are still argued over, decades on. :: event
- [[SIR model]] :: Infection spreads by the same product of two groups as Lanchester's linear law. :: mechanism
???
Did any real battle match the square law's predictions?
How do you measure a unit's effectiveness in the first place?
How did a 1916 book about aircraft end up in combat simulations?
&&&
[[Phalanx]] :: Pikes several metres long turned a crowd into a bristling wall.
[[Battle of Cannae]] :: Outnumbered, Hannibal's double envelopment wrecked a Roman army.
[[Maxim gun]] :: Several hundred rounds a minute from one gun and its crew.
[[Battle of Omdurman]] :: Thousands charged with spears and swords into Maxim fire.
[[Concentration of force]] :: Splitting a force costs it squares, and the bill is steep.
[[Centre of gravity (military)]] :: Clausewitz's physics word for what an army cannot afford to lose.
[[Attrition warfare]] :: Pure arithmetic: whoever bleeds more slowly usually wins.
[[Monte Carlo method]] :: Born tracking neutrons at Los Alamos, later reused to replay battles.
[[Lotka–Volterra equations]] :: Predators and prey interact through a product term, like Lanchester's soldiers.
[[Royal Flying Corps]] :: Sent to France in 1914 with about sixty aircraft.
[[Infantry square]] :: Hollow squares stopped cavalry, and share a name with the maths.
[[Aircraft in Warfare]] :: A 1916 aircraft book that also contains the combat arithmetic.
`,
  },
  {
    title: "Concentration of force",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Concentration of force :: concept
> By the square law, beating an enemy in pieces keeps far more of your army than meeting the whole at once.
+++
[[Battle of Leuctra]] :: event
[[Epaminondas]] :: person
[[Oblique order]] :: technique
[[Battle of Leuthen]] :: event
[[Frederick the Great]] :: person
[[Ulm campaign]] :: event
[[Pratzen Heights]] :: place
[[Defeat in detail]] :: technique
[[Economy of force]] :: concept
[[Frontage (military)]] :: concept
---
Grant the square law and the question changes from how much you have to how you spend it. Under aimed fire each unit you add is worth more than the last, so a commander with a numerical edge is tempted to mass everything at one point. Doctrine has a name for the sequencing that makes concentration pay, [[Defeat in detail]], and the square law explains why: the order in which you meet the enemy matters nearly as much as the total you bring.
^ The doubling in [[Lanchester's laws]] is the rough version; the small print is that a 10 percent edge in numbers is worth 21 percent in fighting power.

## Striking in pieces

Lanchester's model assumes every unit can fire on the whole enemy, which is exactly why a divided enemy is such a gift. When its halves cannot reach each other, a commander strong enough can turn on one half, keep the survivors, and only then face the other. The second fight starts from whatever the first left behind, and the arithmetic makes an enemy met in pieces far cheaper to beat than one met whole. The panel below does the sums.
::: steps
Engage :: 100 units meet the first 50 while the other 50 stay out of range
Survive :: √(100² − 50²) leaves about 87 units standing
Turn :: the survivors meet the second 50 and keep about 71
Compare :: 100 units meeting both halves at once leaves none standing
:::

Commanders found the trick long before anyone wrote the algebra. At [[Battle of Leuctra|Leuctra]] in 371 BC, [[Epaminondas]] kept his right thin and massed the Theban left fifty shields deep, driving it into the Spartan line while the rest of his army held back. The same shape, a strong flank beside a held-back line, is the [[Oblique order]] that [[Frederick the Great]] used at [[Battle of Leuthen|Leuthen]] in 1757, rolling up the Austrian left with a smaller army.

## The frontage cap

The square law counts a unit only if it can reach the enemy, and reach depends on [[Frontage (military)|frontage]], not place in the column. A column fifty deep does not strike fifty times as hard as a line of the same width: only the front ranks engage, and the rest supply shove and replacements. Terrain imposes the same cap from outside. At Thermopylae a narrow pass let only a slice of the Persian army fight at once, so the defenders got concentration for free while the attackers' numbers queued.

## When to spend the edge

The square law turns the decision from how much to commit into when. Waiting lets the enemy finish concentrating, and while you wait his halves can join. The [[Ulm campaign]] of 1805 shows the converging version: Napoleon's corps marched on separate roads until they closed around Mack's army, which capitulated in October. At [[Pratzen Heights]], at Austerlitz later that year, the same logic ran on one field: the Allies abandoned the ridge to chase bait on the French right, and a single corps took it and cut their army in two.
^ A 100-against-80 fight leaves 60 of the hundred standing, and none of the eighty.

[[Economy of force]] is the doctrinal price of that gamble: whatever is not committed to the decisive point must be held at the lowest level that will do. Schlieffen's plan of 1914 made the same bet at national scale, most of Germany's strength aimed at one wing and the east left thin, on the hope that France would fall before Russia mattered. The square law also settles a question the Maxim gun raised: doubling a line's rate of fire doubles its fighting power, but doubling its numbers quadruples it. So a commander who can add men gets twice the multiplier of one who can only add fire, which is why the real decision is where the men go.
===
- [[Battle of Leuctra]] :: Epaminondas's fifty-deep column shows the same concentration idea before gunpowder, and it broke Sparta's line. :: event
- [[Force ratio]] :: The force ratio planners compute before any attack, and why squares change it. :: concept
- [[Deep operations]] :: Depth as concentration: hitting an enemy's rear, not just its front. :: technique
- [[Schlieffen Plan]] :: A concentration gamble: most German strength on one wing, the east thin. :: technique
- [[Thermopylae]] :: A pass so narrow that Xerxes's numbers could not all reach the fight. :: event
- [[Pascal's law]] :: Concentration in fluids: a small push, scaled by the ratio of piston areas. :: mechanism
???
Did Epaminondas's fifty-deep column fight with all fifty ranks?
Can fewer men still win by striking enemy halves in turn?
Why did Napoleon's Ulm campaign work when his corps moved apart?
&&&
[[Battle of Leuctra]] :: A fifty-deep column that broke Sparta's hegemony in one afternoon.
[[Epaminondas]] :: Won Leuctra, then founded Messene to break Sparta's grip on Messenia.
[[Oblique order]] :: Epaminondas and Frederick, roughly 2,100 years apart, both used it.
[[Battle of Leuthen]] :: Frederick's oblique attack rolled up the Austrian left in one afternoon.
[[Frederick the Great]] :: Lost three major battles in one war and still kept Silesia.
[[Ulm campaign]] :: Separate French columns converged until an entire Austrian army surrendered.
[[Pratzen Heights]] :: Abandoned by the Allies chasing bait, then seized by one corps.
[[Defeat in detail]] :: Lanchester's arithmetic makes piece-by-piece victory far cheaper than meeting it whole.
[[Economy of force]] :: Starving secondary fronts so the decisive one can be overfed.
[[Frontage (military)]] :: Quietly caps the square law: only units in reach count.
`,
  },
  {
    title: "Whale falls",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Whale falls :: phenomenon
> A dead whale settles on the ocean floor and becomes a feast for sharks, hagfish and some creatures with no mouths at all.
+++
[[Hagfish]] :: creature
[[Osedax]] :: creature
[[Sperm whale]] :: creature
[[Marine snow]] :: phenomenon
[[Abyssal plain]] :: place
[[Hydrothermal vent]] :: place
[[Cold seep]] :: place
[[Chemosynthesis]] :: mechanism
[[Stepping-stone dispersal]] :: concept
[[Ambergris]] :: thing
[[Alvin (submersible)]] :: thing
[[Galápagos Rift]] :: place
---
A whale dies far out at sea, and its body begins a long fall through the dark. Eventually it settles on the deep seafloor, where the [[Abyssal plain]] stretches flat for hundreds of kilometres. Food is scarce down there. Most of it arrives as [[Marine snow]], a slow fall of dead plankton and debris from the sunlit water above. A single whale can weigh tens of tonnes, and it lands all at once.
^ [[Sperm whale|Sperm whales]] make [[Ambergris]] in their intestines, a waxy substance perfumers once prized as a fixative.

## The first visitors

The first visitors come out of the dark water around the carcass. Sharks arrive, and so do [[Hagfish]], eel-like scavengers that can slip into a carcass through its natural openings and feed from the inside. Few places on the deep seafloor offer this much food at once. Nobody can schedule a whale fall, so much of the research depends on luck and on ship time.
^ Hagfish have no jaws, yet they rasp through flesh with toothed plates in their mouths.

Researchers describe what follows in stages, because each wave of visitors changes the carcass for the next. The stages overlap, so the boundaries between them are blurry rather than sharp.
::: steps
Afloat :: Gas from decay keeps the carcass up for a time, then it sinks.
Scavengers :: Sharks and hagfish strip the soft tissue from the bones.
Opportunists :: Worms and crustaceans eat what the scavengers left behind.
Bone oils :: Microbes break down the bone's fats and release sulphide.
Chemical feeders :: Bacteria that run on sulphide feed the clams and mussels around the carcass.
Bare bone :: Bare bones keep hosting animals for years, sometimes decades.
:::

## Worms that eat bone

In 2002, researchers studying whale bones on the Monterey Bay seafloor found small worms that no one had recorded before. Each one had a feathery crown above the bone. A team led by the marine biologist Greg Rouse named the group [[Osedax]], a name that means roughly bone-eater, and described it in a 2004 paper in Science. The find showed that a skeleton can be a meal in its own right, long after the flesh is gone.

Its root-like structures spread through the bone and anchor the worm while it feeds. Several females can share one bone, each living in its own tube, so a single carcass can host a crowd of them.
::: facts
Mouth and gut :: none; bacteria in its roots feed it
Males :: tiny, living inside the female's tube
Common name :: bone-eating snot flower, from its species name
:::

## Food from chemistry

Before 1977, most biologists assumed that all life ultimately depended on sunlight. That year, scientists diving in the submersible [[Alvin|Alvin (submersible)]] found hot springs on the seafloor of the [[Galápagos Rift]], crowded with unfamiliar animals. These [[hydrothermal vents|Hydrothermal vent]] run on the same kind of chemistry as a whale fall, and they support animals that never see sunlight. Making food from chemicals instead of light is called [[Chemosynthesis]], and it is what lets a sunken whale support a community.

Some animals on whale bones also turn up at [[cold seeps|Cold seep]], where methane and sulphide leak through the seafloor. Researchers have proposed that dead whales act as stepping stones, letting species hop from one chemical oasis to the next across the empty deep. The idea, sometimes called the [[stepping-stone hypothesis|Stepping-stone dispersal]], is still being tested, and it is one reason whale falls matter to people who study how life spreads through the ocean.

Whale falls are hard to count, because most happen out of sight. Each one starts as a meal and later becomes a home, and the animals it feeds may spend their whole lives in the dark.
===
- [[Chemosynthesis]] :: It explains how bacteria power this whole community without any sunlight at all. :: mechanism
- [[Osedax]] :: Mouthless worms that root into whale bone and host the bacteria feeding them :: creature
- [[Stepping-stone dispersal]] :: Could dead whales have carried vent animals across the dark seafloor? :: concept
- [[Hydrothermal vent]] :: Seafloor hot springs that feed whole ecosystems with chemistry, not sunlight :: place
- [[Marine snow]] :: Endless rain of dead plankton that feeds most life on the deep seafloor :: phenomenon
- [[Ambergris]] :: Sometimes found in dead sperm whales: a waxy substance perfumers once prized :: thing
???
Do whale carcasses really feed a community for decades?
How do worms survive with no mouth or gut at all?
Could whale falls explain how deep-sea life spreads between oases?
&&&
[[Hagfish]] :: Ties its own body into knots to scrape off its slime.
[[Osedax]] :: Grows root-like tendrils into bone, and has no mouth at all.
[[Sperm whale]] :: Its gut makes the waxy substance that once helped perfumes last.
[[Marine snow]] :: Dead plankton drifting down as the deep sea's main food rain.
[[Abyssal plain]] :: Vast, nearly flat seafloor thousands of metres below the sunlight.
[[Hydrothermal vent]] :: Superheated seafloor springs that support life with no sunlight at all.
[[Cold seep]] :: Seafloor where methane and sulphide leak out, feeding clams and tubeworms.
[[Chemosynthesis]] :: Bacteria that run on the rotten-egg gas sulphide, not on light.
[[Stepping-stone dispersal]] :: A possible way species hop between oases on the empty seafloor.
[[Ambergris]] :: A whale-made waxy substance that people once found washed ashore.
[[Alvin (submersible)]] :: Recovered a lost hydrogen bomb in 1966, then helped find vents.
[[Galápagos Rift]] :: Where scientists first found hot seafloor springs crowded with unfamiliar animals.
`,
  },
  {
    title: "Osedax",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Osedax :: creature
> A bone-eating worm grows roots into a whale skeleton, keeps tiny males in her tube, and is a cousin of the vent tube worms.
+++
[[Monterey Canyon]] :: place
[[Deep-sea anglerfish]] :: creature
[[Green spoon worm]] :: creature
[[Sexual parasitism]] :: concept
[[Endosymbiotic theory]] :: concept
[[Mitochondrion]] :: thing
[[Osteoclast]] :: thing
[[Collagen]] :: thing
[[Siboglinidae]] :: creature
[[Pogonophora]] :: creature
---
Picture a whale bone lying on the dark floor, with a fringe of feathery crowns across it, like moss on a log. The crowns are only the top of each animal. Most of the worm sits out of sight inside the bone, where branching roots spread through the skeleton and hold it in place. Monterey Bay sits over [[Monterey Canyon]], a steep undersea canyon that carries sediment down into the deep.

^ On [[Whale falls]] the skeleton is what remains; for this worm it is still a larder, full of fat and protein.

## Living on the bone's protein

A female lives in a tube, and her roots, not a gut, are how she feeds. The roots are full of bacteria, and the bacteria are the real diners. Among what they break down is [[collagen|Collagen]], the protein that gives your tendons their strength, and bone holds plenty of it. Partners that live inside a host are not rare in biology. The most famous example is the [[mitochondrion|Mitochondrion]] in your own cells, whose origin is explained by [[endosymbiotic theory|Endosymbiotic theory]].

Scientists think the roots soften the bone with acid so the bacteria can reach the protein inside. Your own bone is dissolved all the time by [[osteoclasts|Osteoclast]], cells that make acid for the job, so the worm uses a method your body already relies on. Time matters too: a whale skeleton can probably keep a colony fed for years, perhaps longer in the cold, so one bone can host several generations.

## Males in the tube

The males are the strangest part of the story. A female can carry several at once, each one a fraction of her size. For a male, her tube is the whole world. Biologists have a name for an arrangement where a small male lives on or in a larger female: [[Sexual parasitism]].

::: compare Female | Male
Main job :: feeds through its roots and makes eggs | makes sperm
Gut :: no working gut as an adult | no mouth and no gut
Seen from outside :: a feathery crown above the bone | only a speck, inside the tube
:::

The same pattern turns up in the [[Green spoon worm]], a marine worm whose males also live inside females. It is a reminder that the arrangement is not unique to bone, even if bone is where this worm lives.

^ In some [[Deep-sea anglerfish|deep-sea anglerfish]] species, the male goes further, fusing onto a female until the pair share a circulatory system.

## Cousins of the vent worms

Osedax belongs to [[Siboglinidae]], the family that includes the giant tube worms of hydrothermal vents and cold seeps. Many of those worms also lack a working gut as adults and keep their bacteria in a dedicated organ, the trophosome, so the bone-eater's odd body plan is a family trait rather than a one-off. Vent and seep worms live where chemistry does the feeding; Osedax found a different meal in the same family tree. The family was not always filed this way. Its members once had a phylum of their own, the [[Pogonophora]], or beard worms, until biologists moved them among the annelids, the segmented worms that include earthworms.

On a whale bone that has been down long enough, a female may be feeding through her roots while a few males do little more than make sperm in her tube.

===
- [[Sexual parasitism]] :: the pattern behind the dwarf males here, and the other animals that follow it. :: concept
- [[Collagen]] :: Three twisted chains, a shape that holds up much of your body. :: thing
- [[Green spoon worm]] :: Settle on a female's snout as a larva and you become a male. :: creature
- [[Pogonophora]] :: A whole animal phylum vanished once its worms were shown to be annelids. :: creature
- [[Monterey Canyon]] :: Cut into the continent's edge beneath a bay where whale bones lie. :: place
- [[Endosymbiotic theory]] :: Your cells' power plants may once have been bacteria that moved in. :: concept
???
Do the males ever leave the female's tube?
How does a larva find a bone in the dark?
Could these worms live on any animal's bones?
&&&
[[Monterey Canyon]] :: Its steep walls funnel food and sediment down into the deep.
[[Deep-sea anglerfish]] :: Some males fuse onto females, becoming a permanent part of her.
[[Green spoon worm]] :: Where a larva lands decides whether it becomes male or female.
[[Sexual parasitism]] :: Males that shrink to live on or inside their mates.
[[Endosymbiotic theory]] :: An idea that parts of your cells were once free-living organisms.
[[Mitochondrion]] :: Carries its own DNA, a clue to an ancient bacterial guest.
[[Osteoclast]] :: The cells that dissolve your own bone with acid, every day.
[[Collagen]] :: The most abundant protein in mammals, and a bacterial snack.
[[Siboglinidae]] :: Bacteria-fed tube worms, from vents and seeps to whale bone.
[[Pogonophora]] :: A phylum of beard worms that scientists later dissolved.
`,
  },
  {
    title: "Bog bodies",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Bog bodies :: thing
> Thousands of years on, many bog bodies still have skin, hair and fingernails, and why they died is still argued over.
+++
[[Tollund Man]] :: person
[[Lindow Man]] :: person
[[Peat cutting]] :: technique
[[Sphagnum moss]] :: thing
[[Tannin]] :: concept
[[Radiocarbon dating]] :: technique
[[Mummification]] :: technique
[[Vimose]] :: place
[[Tacitus's Germania]] :: work
[[The Bog People]] :: work
[[Bog oak]] :: thing
[[Bog butter]] :: thing
---
Bog bodies are people whose remains survive in the peat of northern Europe, many from the Iron Age. The physical evidence is well established: skin, hair and nails, stomach contents, and wounds that can still be read. Peat is waterlogged, cold, short of oxygen and strongly acid, so bodies often look tanned and leathery, while bone can soften or dissolve. The claims begin when people ask why these individuals ended up there.
^ The same acid that dissolves bone can leave a fingernail intact.

## What the bog keeps

The chemistry starts with [[Sphagnum moss]], which holds rainwater and releases acid into it, making bog water sour. The usual account of the leathery skin credits [[Tannin]] and related compounds from the plants that built the peat. It is plausible and widely repeated, but it rests on chemistry and inference, not on anyone watching a body tan.

This is not [[mummification|Mummification]] in the Egyptian sense. Egyptian embalmers worked on purpose, drying and treating the body, while the bog works without intent, so what survives is a matter of chemistry and luck. The bog keeps other things too. [[Bog oak]] trees, felled thousands of years ago, are still dug out and carved, and [[Bog butter]] has come out of Irish bogs in wooden containers, some of it centuries old.

## Found by the spade

Many of these finds came up during [[routine peat digging|Peat cutting]], not archaeological searches, so the record depends on what a spade happened to hit. [[Tollund Man]] and [[Lindow Man]] are the two cases most accounts lean on, and they are useful because they differ.
::: compare Tollund Man | Lindow Man
Found :: 1950, Denmark, by peat cutters | 1984, England, by peat cutters
Death :: leather noose still round his neck | blow to the head, garrotted, throat cut
Details :: pointed leather cap | fox-fur armband and a fringe of styled hair
:::

Dating is the firmest evidence. [[Radiocarbon dating]] measures the carbon left in a body's tissue, which begins to decay at death, so it gives a range of years, not a date. It answers when. Wounds answer what was done to the body. Neither says why.
^ Tollund Man lay in the bog for more than two thousand years before anyone dug him out.

## Sacrifice, execution or accident?

Many versions of the sacrifice story lean on a text. [[Tacitus's Germania]] describes a goddess the writer calls Mother Earth, washed in a secret lake, after which the slaves who attended her are drowned in the same water. P. V. Glob's book, [[The Bog People]], popularised the offering reading and tied these bodies to that goddess. Weapons also went into Danish bogs, at [[Vimose]], which many archaeologists read as offerings.
::: theories
Ritual sacrifice :: killed as offerings to gods, placed in bogs as gifts :: partly
Judicial execution :: criminals killed and sunk in the bog as punishment :: disputed
Accidental death :: drowned or fell in by chance; wounds rule this out for many :: rejected
:::

What is well established is narrower than the stories. The bodies are real, many died violently, and the best-known are dated. The motive is claimed, not measured. Some read Lindow Man's three injuries as a Druidic ritual, but they could equally be one act of violence, and that reading leans on Roman accounts of Celtic sacrifice written by outsiders. The Druid link is more legend than evidence.

The honest summary is that the bodies record what was done to them, not why, and the bog records only how they were kept. Any claim of sacrifice should name its evidence: a wound, a text, a find-spot, or a guess.
===
- [[Tollund Man]] :: the face most people picture first, and his last meal is still known :: person
- [[Triple death]] :: Three killing methods on one man, read as a single rite :: concept
- [[Nerthus]] :: A goddess a Roman writer called Mother Earth, known from one passage :: mystery
- [[Pollen analysis]] :: Pollen trapped in the peat maps what grew nearby, century by century :: technique
- [[Adipocere]] :: Corpses that turn to waxy soap in wet ground, another route to preservation :: phenomenon
- [[Hallstatt salt mines]] :: Ancient miners preserved by salt, not acid, a puzzle of the same kind :: place
???
Why does bog acid dissolve bone but leave skin and hair?
Could Lindow Man's injuries be one ritual, or simply one violent death?
How do you tell a sacrifice from a murder millennia later?
&&&
[[Tollund Man]] :: Leather noose, serene face, and a last meal still inside him
[[Lindow Man]] :: Struck, strangled, throat cut, then argued over for decades
[[Peat cutting]] :: The job that keeps turning up bodies, with spades and machines
[[Sphagnum moss]] :: A moss that holds water like a sponge and sours it
[[Tannin]] :: The compounds that tan leather may also have tanned the dead
[[Radiocarbon dating]] :: Carbon-14 in tissue starts ticking at the moment of death
[[Mummification]] :: Egyptian embalmers did on purpose what the bog did by accident
[[Vimose]] :: A Danish bog where weapons were likely left as offerings
[[Tacitus's Germania]] :: A Roman book describing a goddess washed in a secret lake
[[The Bog People]] :: P. V. Glob's book, which made the sacrifice story popular
[[Bog oak]] :: Trees felled thousands of years ago, dug up and carved
[[Bog butter]] :: Wooden tubs of butter, pulled from Irish bogs, some centuries old
`,
  },
  {
    title: "Tollund Man",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Tollund Man :: person

> Everyone looks at his face; the seeds in his stomach are the harder puzzle.


+++
[[Goosefoot]] :: thing
[[False flax]] :: thing
[[Flax]] :: thing
[[Hungry gap]] :: concept
[[Facial reconstruction]] :: technique
[[Isotope analysis]] :: technique
[[Pollen analysis]] :: technique
[[Grauballe Man]] :: person
[[Ötzi]] :: person
[[Silkeborg Museum]] :: place
---
Tollund Man is the bog body most people can picture. His eyes are closed, the skin around his face has held its shape, and the stubble on his chin is still there, so he looks less like a relic than someone who has just nodded off. That calm is the part of him most often read as meaning something. A careful reading separates what the bog preserved from what people have since added to it.

^ The tanned, leathery skin you met in [[Bog bodies]] is what keeps a face recognisable this long.

## What the face can and cannot show

[[Silkeborg Museum]] keeps him now, and the face is what most visitors come to see. What survived is skin, stubble and the shape of a face. What did not survive is everything that made it a living face. Nobody can say what colour his eyes were. Tissue under bog-preserved skin usually shrinks and dries, so part of the calm is probably just how a face settles. Nothing in the peat records what he felt in his last minutes.

::: facts
Found :: 1950, by peat cutters in Bjældskovdal bog
Where :: near Tollund, Central Jutland, Denmark
Wearing :: pointed skin cap, belt, leather noose
Died :: about 2,400 years ago, Iron Age
:::

The bog gives physical evidence with a clear answer: what he wore, roughly when he died, and what was in his stomach. Almost everything else is interpretation, and the calm is an interpretation built on how a face looks in a photograph. Whether it reflects acceptance, or whether anything about his last moments can be read from the body at all, is the kind of claim that needs more than a picture.

## The last meal, read carefully

His stomach still held what he ate, which is why his last meal is known at all. The seeds point to barley, mixed with the seeds of weeds such as [[Goosefoot]] and [[False flax]], and the seed of [[Flax]] itself. Nothing shows the weeds were picked for flavour. Weed seeds usually came in with the grain, because grain of that period often went into the pot uncleaned, so the weeds may say more about threshing than about hunger.

^ Flax is one species that gives both linen and seed, so the same crop could have fed people and dressed them.

Whether the meal was a famine food is disputed. Farmers in Britain still call the lean stretch before the new season's crops the [[Hungry gap]], and it is tempting to project that idea more than two thousand years back. That is an inference, not a finding. One stomach records one meal, not a year of eating, and the same seeds could come from a good year's gruel as easily as a bad one's.

## Other faces, other evidence

A face is one kind of evidence, and the others say different things. [[Facial reconstruction]] rebuilds a living face from bone, with averages standing in for flesh, so its features are informed guesses. Tollund's face is real skin, which no reconstruction gets, but it shows a man after death, not in life.

Other tools answer questions the face cannot. [[Isotope analysis]] reads chemical traces in bone and hair, which can reflect diet over months or years, not one meal. [[Pollen analysis]] shows what grew around the bog, but not what was eaten. A fair reading of him would combine several of these, rather than rest on the face alone.

Two other preserved men set the limits. [[Grauballe Man]], found in another Jutland bog in 1952, died in a way his face does not show, because his throat was cut. [[Ötzi]], the glacier mummy from the Alps, has a last meal that is easier to read than Tollund's weeds, ibex meat and einkorn among them, and it still records one meal, not a diet.

The face most people picture is accurate about what the bog kept and quiet about what it lost. Everything beyond that is argument, and the firmest parts of his story are the ones measured, not the ones read off his expression.

===
- [[Grauballe Man]] :: the natural next face, and the one whose death the face does not show. :: person
- [[Seedbank]] :: Seeds can wait in soil for decades, muddying any single field's weeds. :: mechanism
- [[Seed identification]] :: How a scientist tells one tiny seed from its near-twin under a microscope. :: technique
- [[Elling Woman]] :: Found years earlier in the district, and her death is argued over too. :: person
- [[Nydam]] :: A Schleswig bog gave up an oak boat beside a deposit of weapons. :: place
- [[Whipworm]] :: Its eggs survive in ancient remains, so meals can reveal sickness too. :: creature
???
Who decided his face should stand for every bog body?
Can one stomach really tell us what a whole year held?
Would the people who knew him have recognised his face?
&&&
[[Goosefoot]] :: a weed that may once have been grown as a crop.
[[False flax]] :: a weed that looks so like flax it took its name.
[[Flax]] :: one plant that gives both linen cloth and seed for food.
[[Hungry gap]] :: a modern farming term, tempting to project onto ancient hunger.
[[Facial reconstruction]] :: a face rebuilt from bone, with averages standing in for flesh.
[[Isotope analysis]] :: chemical traces that can outlast any single meal.
[[Pollen analysis]] :: pollen grains in peat that map forests of millennia ago.
[[Grauballe Man]] :: the other famous Jutland face, and his throat was cut.
[[Ötzi]] :: a glacier mummy whose final meal survived, ibex meat included.
[[Silkeborg Museum]] :: where a bog body can be seen face to face.
`,
  },
  {
    title: "Bioluminescence",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Bioluminescence :: phenomenon
> Living things make their own light with cold chemistry, and one glowing protein now helps scientists watch cells at work.
+++
[[Luciferin]] :: thing
[[Mesopelagic zone]] :: place
[[Photophore]] :: thing
[[Counter-illumination]] :: mechanism
[[Loosejaw dragonfish]] :: creature
[[Vampire squid]] :: creature
[[Hawaiian bobtail squid]] :: creature
[[Vibrio fischeri]] :: creature
[[Honey fungus]] :: creature
[[Synchronous fireflies]] :: phenomenon
[[Aequorea victoria]] :: creature
[[Green fluorescent protein]] :: thing
[[Osamu Shimomura]] :: person
---
A firefly on a summer lawn makes light with no flame, no filament and no electricity. Inside its lantern, a chemical reaction releases energy as a flash. The glow is so cool that the firefly barely warms up. Scientists call this living light, or bioluminescence. It turns up in beetles, fish, squid, mushrooms and bacteria, often in places the sun barely reaches.

## How the light is made

The chemistry is simpler than it sounds. A molecule called [[Luciferin]] reacts with oxygen, and an enzyme called luciferase speeds it up. The reaction leaves its product buzzing with energy. As that product settles down, it lets go of a photon, a tiny packet of light. So little heat is made that scientists call it cold light.
::: figures
90% :: of an old light bulb's energy that becomes heat
40% :: of firefly reactions that end in a flash
:::

## Lights in the dark sea

Dive into the [[Mesopelagic zone]], a twilight layer from about 200 to 1,000 meters down. Sunlight fades to a dim blue here. Animals down there cannot count on the sun, so many carry their own lamps. Those lamps are called [[Photophore|photophores]]. Many fish use them for [[Counter-illumination|counter-illumination]]. They glow on their bellies to match the faint light from above. A predator below looks up and sees no dark outline.

The strangest light belongs to the [[Loosejaw dragonfish]], which makes red light. Few animals down there can see red, so the dragonfish can light up its meal in secret. The [[Vampire squid]] uses light as a decoy. Threatened, it squirts a cloud of glowing mucus that may confuse a predator while it slips away.
^ Light has evolved dozens of times, separately, in animals that are not close relatives.

## Who else glows

Some animals do not make their own light at all. The [[Hawaiian bobtail squid]] houses [[Vibrio fischeri]] bacteria in a light organ near its belly. The squid points that glow downward to match the moonlight above, which erases its shadow. Every morning it vents most of those bacteria, and they regrow over the next day.
^ A single bacterium stays dark; the glow switches on only when enough of them crowd together.

Fungi glow too. A rotting log in a dark forest can shine a faint green. One culprit is the [[Honey fungus]], whose threads spread through the wood. In parts of Southeast Asia, hundreds of fireflies in one mangrove tree can flash in step. It is called [[synchronous flashing|Synchronous fireflies]].

## From jellyfish to lab bench

One of biology's most useful glows comes from a small jellyfish, [[Aequorea victoria]]. Its rim lights up. It uses two proteins as a team. One flashes blue when calcium reaches it. The other catches that blue light and turns it green. The green one, [[Green fluorescent protein]], turned out to be useful far beyond the jellyfish.

The chemist who pinned this down was [[Osamu Shimomura]]. He had to collect a huge number of jellyfish just to get enough protein to study. The discovery then sat quietly for decades, until biologists learned to use it as a tool.
::: timeline
1962 :: Shimomura's team reports the blue and green jellyfish proteins
1994 :: Chalfie shows the green protein lights up genes in worms
2008 :: Shimomura, Chalfie and Tsien share the Nobel Prize in Chemistry
:::

Today a biologist can attach this glow to a gene. Then the cell lights up whenever that gene switches on. The same basic idea, a lamp inside a living thing, runs from a firefly's tail to a lab microscope.
===
- [[Luciferase]] :: The enzyme that makes the flash happen, and the reason labs use its light as a readout :: thing
- [[Coelenterazine]] :: One glowing molecule lights up jellyfish and shrimp from unrelated branches :: thing
- [[Aequorin]] :: The jellyfish protein that flashes when calcium rushes in :: thing
- [[Mosquito Bay]] :: A Puerto Rican bay turns electric blue wherever someone swims or paddles :: place
- [[Flashlight fish]] :: It switches its built-in headlamp off behind a black flap :: creature
- [[Cherenkov radiation]] :: Reactor pools glow blue in water too, but physics, not life, makes it :: phenomenon
???
Why are most ocean glows blue instead of red?
Do any animals flash light to scare off a predator?
Can someone make a plant glow like a firefly?
&&&
[[Luciferin]] :: Its name means light-bearer, and it glows with barely any heat
[[Mesopelagic zone]] :: A dim blue twilight where many animals carry their own lamps
[[Photophore]] :: Some fish have dozens of these lamps, arranged in species-specific patterns
[[Counter-illumination]] :: A glowing belly that erases the shadow a predator would see
[[Loosejaw dragonfish]] :: It hunts with red light that few deep-sea eyes can see
[[Vampire squid]] :: Its name says vampire, but it mostly eats drifting marine snow
[[Hawaiian bobtail squid]] :: A squid that rebuilds its glow every single day
[[Vibrio fischeri]] :: Its glow switches on only when enough of its kind gather
[[Honey fungus]] :: Its glowing threads can light up a rotting log from inside
[[Synchronous fireflies]] :: Hundreds of insects blinking together until the whole tree pulses
[[Aequorea victoria]] :: A jellyfish whose rim glows, using two proteins as a team
[[Green fluorescent protein]] :: Scientists use its green glow to watch genes switch on
[[Osamu Shimomura]] :: A chemist who chased jellyfish glow, then won a Nobel Prize
`,
  },
  {
    title: "Hawaiian bobtail squid",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Hawaiian bobtail squid :: creature
> A newborn squid's light organ is empty, so it has to go shopping for its glow.
+++
[[Cilia]] :: mechanism
[[Tracheal cytotoxin]] :: thing
[[Peptidoglycan]] :: thing
[[Mutualism]] :: concept
[[Zooxanthellae]] :: creature
[[Germ-free animal]] :: technique
[[Lunar phase]] :: phenomenon
[[Circadian rhythm]] :: concept
[[Chromatophore]] :: thing
[[Cuttlefish]] :: creature
---
A newborn Hawaiian bobtail squid has an empty light organ. The pouch sits near its belly, and until bacteria arrive it is just a dark little bag. The bacteria do not come from its parents. They live free in the sea, so the squid collects them from the water itself. Tiny [[Cilia|hairs]] on the organ's surface row seawater inward, and any Vibrio fischeri in that water can move in. About two days later, the bacteria release a piece of their [[Peptidoglycan|cell-wall mesh]], a molecule called [[Tracheal cytotoxin]]. That molecule tells the organ to shrink the ciliated structures it used to pull water in.
^ The jellyfish in [[Bioluminescence]] make their own glow; this squid borrows its light from guests it must recruit every generation.

## Matching the sky

The squid does not glow at one fixed brightness. Its light is tuned to how bright the sky is above, and the moon does most of the changing. A bright moon lights the water, so the glow turns up to match. When the sky is dark, the glow turns down. Across the [[Lunar phase|moon's phases]], the squid's light keeps pace with the sky, night after night.

Hardware does the rest. The light organ has a lens that focuses the glow downward, and a reflector that sends stray light the same way. Over the glow sits an iris, like the one in your eye, that opens and shuts. A wider opening lets out more light, and a narrow one lets out less. That hardware is what makes the shadow trick work.

## Every morning, a reset

At dawn, the squid vents roughly 95 percent of its bacteria into the water, and those drift off into the sea where a newborn could collect them. The few that stay behind are enough. They divide through the day until the organ is full again by night. Both the squid's tissue and its bacteria follow a [[Circadian rhythm|24-hour rhythm]], so the reset is built into the partnership.
::: facts
Home :: shallow sandy lagoons around Hawaii
Daytime :: buried under the sand
Night :: rises to hunt small shrimp
Name :: a stubby body, like a cut-off tail
:::

This is a [[Mutualism|mutual deal]]: the bacteria get a sheltered home, and the squid gets a glow it could never make on its own. Corals strike a similar bargain with tiny algae called [[Zooxanthellae]] that feed them. When stressed, corals expel their partners and turn white.

## A glow you can switch off

Researchers can raise these squid in seawater scrubbed clean of bacteria. Animals kept this way are called [[Germ-free animal|germ-free]]. Without partners, the light organ does not fully develop, so the squid cannot glow. Add the bacteria back and the organ changes shape, which shows who does the building. It makes a clean experiment: add or remove the partner and watch the organ respond.

Its own skin is busy too. It carries [[Chromatophore|pigment cells]] like those of its cousin the [[Cuttlefish]], famous for flashing patterns across its skin. None of that makes light, though. The glow is always the guests' work.
===
- [[Quorum sensing]] :: It explains how the bacteria know when they are crowded enough to switch the glow on :: mechanism
- [[Tracheal cytotoxin]] :: A bacterial fragment that tells the squid's light organ to shrink its cilia :: thing
- [[Mimic octopus]] :: This cephalopod copies lionfish and sea snakes with skin and body tricks :: creature
- [[Chambered nautilus]] :: A shelled cephalopod that rises and sinks by adjusting gas in its chambers :: creature
- [[Cholera]] :: The squid's glowing bacteria share a genus with the germ that causes cholera :: thing
- [[Dazzle camouflage]] :: Warship zigzag paint broke up outlines, much like the squid erases shadows :: technique
???
How does a squid know how bright the moon is tonight?
Could its bacteria glow without a squid around?
Why does it throw most of its partners away every morning?
&&&
[[Cilia]] :: Hairs that row seawater inside, bringing in the squid's glow
[[Tracheal cytotoxin]] :: A bacterial fragment that rewires a squid, named for windpipe damage
[[Peptidoglycan]] :: Bacterial armour mesh that your immune system also learns to spot
[[Mutualism]] :: A partnership so close the squid rebuilds it daily
[[Zooxanthellae]] :: Algae that feed corals, and whose exit leaves them bleached
[[Germ-free animal]] :: Raised with no microbes, to show what the microbes actually do
[[Lunar phase]] :: The Moon's monthly shape-shift, and a glow that follows its brightness
[[Circadian rhythm]] :: A body clock that keeps ticking even in total darkness
[[Chromatophore]] :: Pigment sacs that stretch open in a blink, like tiny curtains
[[Cuttlefish]] :: Masters of skin shows, and cousins of the bobtail squid
`,
  },
  {
    title: "Tulip mania",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Tulip mania :: event
> In 1637 Dutch traders were buying and selling tulip bulbs still buried in the soil, and nobody agreed what they were worth.
+++
[[Carolus Clusius]] :: person
[[Ogier Ghiselin de Busbecq]] :: person
[[Leiden Botanical Garden]] :: place
[[Semper Augustus]] :: thing
[[Tulip breaking]] :: phenomenon
[[Windhandel]] :: concept
[[South Sea bubble]] :: event
[[Extraordinary Popular Delusions and the Madness of Crowds]] :: work
[[Tulip Era]] :: era
[[Dutch auction]] :: technique
[[Dutch East India Company]] :: thing
[[Keukenhof]] :: place

---

Few flowers have caused as much commotion as the tulip. Wild tulips grow from Anatolia to Central Asia, and the Ottoman court prized them long before Europe noticed. In the 1630s the Dutch Republic turned the bulb into a speculative prize, with contracts changing hands in taverns while the bulbs were still underground. Tulip mania is also one of the most retold stories in economic history.

^ The word tulip probably comes from the Turkish for turban, which the flower's bloom was said to resemble.

## An imported flower

The flower's journey west ran through diplomacy. [[Ogier Ghiselin de Busbecq|Busbecq]], the Habsburg envoy at Constantinople, admired the flowers in Ottoman gardens, and his letters are still read as eyewitness accounts of the court. Bulbs then reached the [[Leiden Botanical Garden|botanic garden at Leiden]], where the botanist [[Carolus Clusius]] catalogued them with care.

Clusius shared bulbs with correspondents across Europe, and a popular story says thieves raided his garden for them. The tale is probably embellished, but tulips did spread quickly into Dutch hands, where rich merchants paid for rare varieties. The Ottomans, who had grown tulips for generations, staged their own craze, the [[Tulip Era]], some eighty years after the Dutch crash, with illuminated garden parties in Istanbul.

^ A tulip grown from seed can take several years to flower, so every new colour was a long wait.

## Broken colours

What made a tulip valuable was usually its petals. Some plants produced feathers and flames of colour on a white or yellow ground, an effect growers called [[Tulip breaking]]. The patterns came from a virus that no one could identify in the 1630s. Infected bulbs grew weaker, and aphids carried the infection from plant to plant. Because the pattern came from the infection rather than the seed, it could not be bred on purpose.

The rarest striped varieties commanded the highest prices. The most celebrated was [[Semper Augustus]], white flushed with red, and its bulbs were reported to sell for thousands of guilders at the peak. Historians still debate how typical such prices were. Buyers were paying for colours that no bulb could promise.

::: timeline
1550s :: Bulbs reach Vienna from Constantinople
1593 :: Clusius starts growing tulips at Leiden's new botanical garden
1636 :: Speculation in bulbs reaches its height in Dutch towns
February 1637 :: Buyers stop turning up, and prices collapse
1841 :: Charles Mackay's popular book turns the crash into a cautionary legend
1989 :: Economist Peter Garber argues the boom was less mad than legend
:::

## Wind trade and the crash

By the 1630s bulbs were traded in taverns, often months before anyone could lift them. Dealers signed contracts for bulbs due at the summer lifting, and the Dutch called this [[Windhandel]], or wind trade, because the goods did not yet exist. Many traders were not gardeners at all. They hoped to resell before the price turned, so a single contract could change hands several times.

When the market broke, contracts that had seemed valid became disputes, and the authorities were reluctant to enforce them. A settlement reportedly let buyers escape for 3.5 per cent of the contract price, and many contracts were never honoured. The Dutch were no strangers to paper wealth: Amsterdam's exchange already traded shares in the [[Dutch East India Company]]. Less than a century later, London's [[South Sea bubble]] repeated the pattern.

::: myth
Myth :: Whole Dutch families were ruined when the bulb market crashed.
Actually :: The trade was narrow, and there is little evidence that many families were ruined.
:::

## How the legend grew

For much of the nineteenth century the tulip story served as a warning. Its most influential telling is [[Extraordinary Popular Delusions and the Madness of Crowds]], a book that gathered earlier accounts as proof that crowds go mad. Later historians have been less sure. Anne Goldgar's 2007 study argues that honour and contract law mattered as much as greed, and that the market was far narrower than the legend suggests.

Tulips never stopped being a business. The [[Keukenhof]] garden at Lisse plants millions of bulbs each autumn for its spring display, and the country's flower markets still sell by a falling-price [[Dutch auction]]. The flower that started the story still fills a park every spring, which is a quieter ending than the legend.


===
- [[Tulip breaking]] :: the virus behind the stripes, and why no grower could command the result :: phenomenon
- [[Semper Augustus]] :: The white-and-red tulip that became the boom's most prized bulb :: thing
- [[Windhandel]] :: Dealers sold bulbs still underground and called it trading in wind :: concept
- [[South Sea bubble]] :: London's 1720 share frenzy, where Parliament investigated the ruin that followed :: event
- [[Dutch auction]] :: The falling-price sale Dutch flower markets still run on a ticking clock :: technique
- [[Green peach aphid]] :: The aphids that spread the tulip virus are often born already pregnant :: creature

???
Why would a virus make a tulip more valuable?
Did ordinary Dutch families really lose their homes?
Why did the Ottomans prize tulips long before Europe?

&&&
[[Carolus Clusius]] :: A botanist whose garden bulbs may have been stolen by thieves
[[Ogier Ghiselin de Busbecq]] :: An envoy whose eyewitness letters from Constantinople are still read today
[[Leiden Botanical Garden]] :: One of the world's oldest botanical gardens, founded to teach medicine
[[Semper Augustus]] :: A white tulip with red flames, the boom's most sought-after bulb
[[Tulip breaking]] :: A virus that painted petals in stripes and flames, unpredictably
[[Windhandel]] :: Contracts for bulbs still underground, sold before anyone saw a bloom
[[South Sea bubble]] :: London's 1720 share frenzy, and the ruin that Parliament investigated
[[Extraordinary Popular Delusions and the Madness of Crowds]] :: The 1841 book that turned a flower crash into a legend
[[Tulip Era]] :: Istanbul's own tulip craze, eighty years on, with lantern-lit garden parties
[[Dutch auction]] :: A falling-price sale that ticks down until someone bids
[[Dutch East India Company]] :: Its shares changed hands on Amsterdam's exchange during the boom
[[Keukenhof]] :: Lisse's spring garden, where millions of bulbs are planted each autumn
`,
  },
  {
    title: "Mantis shrimp vision",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Mantis shrimp vision :: mechanism
> Each eye on a mantis shrimp moves alone, and the animal can read a kind of light that few creatures can detect.
+++
[[Compound eye]] :: thing
[[Ommatidium]] :: thing
[[Peacock mantis shrimp]] :: creature
[[Polarised light]] :: phenomenon
[[Circular polarisation]] :: phenomenon
[[Birefringence]] :: mechanism
[[Quarter-wave plate]] :: thing
[[Opsin]] :: thing
[[Trichromacy]] :: concept
[[Ultraviolet vision]] :: concept
[[Sky compass]] :: mechanism
[[Colour recognition]] :: mystery
---
A mantis shrimp is not a shrimp. It belongs to the stomatopods, a separate order of crustaceans, and its eyes are its most striking feature. They sit on mobile stalks, each able to turn on its own, so one animal can watch two directions at once. Each eye is a [[Compound eye]] built from thousands of [[ommatidia|Ommatidium]], each one sampling a small patch of the scene. Much of the research comes from the [[Peacock mantis shrimp]], a brightly coloured species studied for decades.
^ The club-armed smasher also makes light: the cavitation bubble behind its strike flashes as it collapses.

## Units and receptors

The sensors inside each unit are where the story gets strange. Each ommatidium holds photoreceptor cells, and in mantis shrimp they come in many kinds, each built around its own [[Opsin|light-sensitive protein]]. An opsin is tuned to a band of wavelengths, so the kind of opsin in a cell decides what that cell can report. Across the middle of each eye runs a horizontal strip called the midband, where the most specialised receptors cluster.

The range also reaches past the violet end. Many of the receptor types respond to [[Ultraviolet vision|ultraviolet]], a band that bees and many birds also see, so parts of a scene invisible to us may be bright to the animal.

## Colour without comparison

Our own colour sense, [[Trichromacy]], works by comparison: the brain weighs signals from a handful of cone types against one another, and the balance is what we experience as hue. A mantis shrimp seems to do something else. A 2014 paper in Science argued that the animals recognise colours directly, with each receptor type acting like a label rather than a yardstick. Whether [[Colour recognition]] is the whole answer is still argued over.
::: myth
Myth :: mantis shrimp see more colours than any other animal
Actually :: they have many receptor types, but tests suggest they tell close shades apart poorly
:::

If that labelling account is right, the interesting question moves from how many colours the animal sees to what the labels are for, and nobody has a settled answer yet.

## Light that spins

Light can also vibrate within one fixed plane, a property called [[Polarised light]], and the sky carries plenty of it. The other kind is [[Circular polarisation|circular polarisation]], in which the electric field turns like a corkscrew as the wave travels. Few eyes can detect it, and the mantis shrimp is one of the best-documented exceptions.
::: compare Mantis shrimp | Human
Colour receptor types :: about 12 in the peacock | three cone types
Ultraviolet sensing :: yes | blocked by the lens
Circular polarisation :: detected | not detected
:::

Detecting that spin takes hardware. A receptor that responds only to straight-line polarisation would barely register a corkscrew wave, so the eye appears to carry a layer that acts as a [[Quarter-wave plate]], turning the spinning light into a straight-line form the receptors can use. Such layers work through [[Birefringence]], in which a material makes the two halves of a light wave travel at different speeds.
^ Many cinema 3D systems send each eye its own picture in opposite circular polarisations, the property this shrimp can read.

Other animals read the same sky. Bees and many other insects use the pattern of polarised skylight to work out where the sun is, which lets them steer even when the sun itself is hidden. That is the work of a [[Sky compass]], and the contrast is useful: insect sky compasses need only the straight-line kind, while this shrimp also reads the spinning kind.

Whether any of this becomes anything like a picture is another matter. The eyes clearly register polarisation, colour and ultraviolet, but how the brain fuses those signals into a view of the world remains largely unknown.

===
- [[Compound eye]] :: the next step down, since everything on this page is built on its design. :: thing
- [[Rhabdom]] :: the light-guiding rod where each receptor actually catches photons :: thing
- [[Retinal]] :: the small molecule that changes shape the instant light strikes it :: thing
- [[Cuttlefish]] :: one photoreceptor type, yet they camouflage against colourful backgrounds :: creature
- [[Waggle dance]] :: a dance that encodes a flower patch's direction relative to the sun :: technique
- [[Sonoluminescence]] :: the flash from a punching club is light made by a collapsing bubble :: phenomenon
???
Why do mantis shrimp have so many colour receptor types?
Do mantis shrimp use polarised signals to talk to each other?
How do insects tell where the sun is when it is hidden?
&&&
[[Compound eye]] :: a single picture stitched together from thousands of tiny lenses.
[[Ommatidium]] :: one lens and its light-sensing cells, copied across the whole eye.
[[Peacock mantis shrimp]] :: a colourful shrimp whose eyes read the spinning kind of light.
[[Polarised light]] :: a property of light that insects use to find their bearings.
[[Circular polarisation]] :: a spin in light that few eyes ever register.
[[Birefringence]] :: why a calcite crystal shows two images of one object.
[[Quarter-wave plate]] :: a sheet thinner than a millimetre that rewrites light's spin.
[[Opsin]] :: the protein whose tiny shape change starts every act of seeing.
[[Trichromacy]] :: how three colour channels can separate a huge range of hues.
[[Ultraviolet vision]] :: a sense many animals have, which our lenses filter out.
[[Sky compass]] :: how insects locate the sun from sky polarisation, even when hidden.
[[Colour recognition]] :: a debated idea that some animals identify colours without comparing them.
`,
  },
  {
    title: "Leidenfrost effect",
    source: "Claude Haiku 5.5 stand-in, prompt 2026-10-14-v2; converted to v3 by script",
    text: `# Leidenfrost effect :: phenomenon
> A drop on a red-hot pan floats on its own steam, and the reason it survives is stranger still.
+++
[[Spheroidal state]] :: concept
[[Film boiling]] :: phenomenon
[[Nucleate boiling]] :: phenomenon
[[Boiling curve]] :: concept
[[Critical heat flux]] :: mechanism
[[Quenching]] :: technique
[[Martensite]] :: thing
[[Liquid nitrogen]] :: thing
[[Leidenfrost ratchet]] :: mechanism
[[Loss-of-coolant accident]] :: event
[[Hovercraft]] :: thing
[[Dry ice]] :: thing

---

Drip water onto a pan far hotter than boiling and it refuses to lie still. It skids, rolls and pirouettes, and it survives far longer than common sense allows. Johann Gottlob Leidenfrost, a German physician, described the behaviour in 1756 after watching drops on a red-hot iron spoon, but the explanation took much longer to settle. The drop is barely touching the metal. It sits on a cushion of its own vapour, and nearly everything strange about the effect follows from that one thin layer.

^ Here the film is steam, not the water-like skin that [[Ice friction]] describes on ice, but it is a thin layer doing the same slippery work.

## Standing on its own steam

Ordinary boiling needs contact: liquid wets the hot metal, and bubbles nucleate on it. The Leidenfrost drop has none of that. Physicists call the regime [[film boiling|Film boiling]], because the vapour forms one continuous layer instead of the scattered bubbles of [[nucleate boiling|Nucleate boiling]], the kettle's everyday mode. Nineteenth-century experimenters called it the [[spheroidal state|Spheroidal state]] after the round drops it produced.

::: steps
Landing :: The drop touches metal well above water's boiling point.
Skin :: Its underside vaporises into a layer that separates drop from metal.
Lift :: Vapour pressure raises the drop on that layer.
Glide :: The drop slides and spins on the vapour leaking from beneath it.
Collapse :: Below the Leidenfrost point the film breaks and the drop boils violently.
:::

Vapour conducts heat far worse than either liquid water or metal, so heat from the pan has to squeeze across a gap of gas before it reaches the water. That gap is why a drop lingers far longer than it would on a cooler pan, evaporating slowly from its surface rather than boiling away in a rush. Any tilt or uneven gap lets more vapour escape from one side, so the drop drifts the other way. A [[hovercraft|Hovercraft]] uses the same principle, a cushion of gas that lifts something heavy, with pumped air in place of boiled water.

## The dip in the cooling curve

Engineers plot how fast a surface sheds heat against how far it sits above the liquid's boiling point, and the result is the [[boiling curve|Boiling curve]]. Heat flow climbs steeply, peaks at [[critical heat flux|Critical heat flux]], then collapses as the vapour film takes over. The curve bottoms out at the Leidenfrost point, where a surface cools least effectively of all. Hotter still, heat flow climbs again, because a very hot metal radiates straight across the vapour gap.

^ Water boils at 100 degrees Celsius at sea level, but a drop only floats once a smooth metal reaches about 200 degrees Celsius.

This dip matters to anyone who hardens steel. In [[quenching|Quenching]], red-hot steel plunged into water first sits inside a vapour blanket, and cooling in that stage is slow. Metallurgists stir the bath or add polymers to break the blanket up, because wherever the blanket lingers the metal cools late and hardens unevenly. Steel that cools fast enough ends up as [[martensite|Martensite]], a crystal that traps carbon and makes the metal hard.

## Where it shows up

You do not need a stove to see it. [[Liquid nitrogen]] boils at minus 196 degrees Celsius, yet drops of it skitter across a room-temperature metal plate on their own vapour, much as water does on a pan. [[Dry ice]] makes a rougher cousin of the trick on water, skidding about on the gas it sheds.

Researchers have also learned to steer the effect. In 2006 a team showed that a Leidenfrost drop on a surface cut with asymmetric sawtooth ridges travels in one direction with no push at all, a trick known as a [[Leidenfrost ratchet]].

The same threshold matters in nuclear safety. If a reactor loses its coolant, the fuel rods can overheat, and once they are above the Leidenfrost point, returning water has to fight through a vapour film before it can rewet them. Safety analyses of a [[loss-of-coolant accident|Loss-of-coolant accident]] track that surface temperature closely.


===
- [[Hovercraft]] :: The same cushion of gas, scaled up to a vehicle that crosses land and water. :: thing
- [[Leidenfrost point]] :: The temperature where floating starts, and what can shift it :: concept
- [[Quench front]] :: The moving line where water finally rewets a superheated fuel rod :: mechanism
- [[Superheating]] :: Microwaved water can sit above boiling, then erupt when jostled :: phenomenon
- [[Cavitation]] :: Bubbles that form and collapse in water fast enough to pit propellers :: phenomenon
- [[Meissner effect]] :: Levitation with nothing touching it, but by expelling magnetic fields instead :: mechanism

???
What decides the exact temperature at which a drop starts floating?
Could a patterned surface steer a drop in one chosen direction?
Why can a hotter pan cool water faster than a cooler one?

&&&
[[Spheroidal state]] :: A rival name for the same state, born from round drops.
[[Film boiling]] :: Boiling that stops bubbling and starts hiding behind a vapour skin.
[[Nucleate boiling]] :: Kettle bubbling, and why it beats a vapour skin at cooling.
[[Boiling curve]] :: A single graph that hides a dip where cooling gets worse.
[[Critical heat flux]] :: The peak of cooling, past which a surface can burn out.
[[Quenching]] :: Why steel's hardness depends on a few seconds of vapour.
[[Martensite]] :: Hard steel's signature phase, locked in by sudden cooling.
[[Liquid nitrogen]] :: A liquid so cold that a room-temperature plate keeps it dancing.
[[Leidenfrost ratchet]] :: A drop that crosses a sawtooth surface with no push.
[[Loss-of-coolant accident]] :: Where the same vapour film threatens a reactor's cooling.
[[Hovercraft]] :: A vehicle skimming land and water on nothing but pumped air.
[[Dry ice]] :: A solid that skids over water on its own escaping gas.
`,
  },
];
