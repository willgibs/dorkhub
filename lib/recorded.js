/* ================= recorded pages: real writer output, replayed for free =================
   Raw pages a real writer produced for the exact prompts in lib/prompts.js, following real
   rabbit holes link by link. The mock writer (lib/mock.js) streams one whenever a reader asks
   for its title, at a writer's pace, so local development, the browser test and preview
   deployments read like the real thing at no cost. The parser tests run against every one.

   `source` says who wrote each page. "Claude Haiku 5.5 stand-in" pages were written before
   Dorkhub's AI Gateway had credits: Claude Haiku 5.5, the trial's model, given the production
   prompt verbatim through a Claude Code subagent (which thinks before answering, unlike the
   trial). Replace them with live pages once those exist. Add or replace pages with
   scripts/recorded.mjs; `title` is the title as requested, before the page was written. */

/** @type {{ title: string, source: string, text: string }[]} */
export const RECORDED = [
  {
    title: "The Great Emu War",
    source: "Claude Haiku 5.5 stand-in",
    text: `# The Great Emu War
> In 1932 Australian soldiers with machine guns went to war with emus, and the birds outlasted the campaign.
~ You started with the Great Emu War, a wonderful first stop because one absurd, real episode opens doors into machine guns, pest control, national symbols and the night sky.
@ drift 0
: Date = November to December 1932
: Place = Campion, Western Australian wheatbelt
: Flock = estimated 20,000 birds (uncertain)
: Weapons = two Lewis guns and thousands of rounds
: Outcome = army withdrew; birds were not eradicated
%%%
1920s :: Returned soldiers receive wheatbelt farm blocks under state settlement schemes
1929 :: Wheat prices fall as the Depression deepens across Australia
1932 :: Emus move into the wheatbelt in numbers, damaging crops and fences
1932 :: November: soldiers with two Lewis guns begin operations near Campion
1932 :: December: operations end; the army withdraws, and the birds keep roaming
+++
[[Lewis gun]] :: A First World War machine gun, deployed against flightless birds. :: thing
[[Western Australian wheatbelt]] :: Wheat country where returned soldiers' farms met a migrating flock in 1932. :: place
[[Soldier settlement scheme]] :: A post-war land scheme that handed farms to returned soldiers, many failing. :: mechanism
[[Emu]] :: Flightless and fast, it appears on Australia's coat of arms. :: creature
[[Gizzard stone]] :: Emus swallow stones that grind food inside a muscular stomach. :: mechanism
[[Rabbit-Proof Fence]] :: A roughly 1,800 km fence built to keep rabbits off farmland. :: thing
[[European rabbit in Australia]] :: Two dozen rabbits released in 1859 spread across much of the continent. :: phenomenon
[[Cane toad]] :: Imported in 1935 to eat beetles, it now poisons its predators. :: creature
[[Thylacine]] :: Tasmania paid bounties on this marsupial for over two decades. :: creature
[[1080 poison]] :: A toxin Western Australian plants make naturally, now laid as pest bait. :: technique
[[Lanchester's laws]] :: A 1916 model claiming doubling your soldiers quadruples their fighting strength. :: concept
[[Emu in the Sky]] :: Many Aboriginal traditions read an emu in the Milky Way's dark dust lanes. :: concept
[[Coalsack Nebula]] :: A dust cloud so dense it looks like a hole in the sky. :: phenomenon
[[Coat of arms of Australia]] :: The national emblem with an emu and kangaroo holding up the shield. :: thing
---
In late 1932 the Australian army took machine guns onto farmland in Western Australia to fight a flock of [[emus|Emu]]. It was a real deployment: a small detachment, two guns and a major were sent into the [[Western Australian wheatbelt]], where birds were damaging crops and fences. Newspapers treated it partly as comedy, and the phrase "Great Emu War" stuck. The birds were not eradicated, and the soldiers went home.
^ Wait, really? The Lewis gun was a Western Front weapon, more than a decade old when it was sent after birds.

## A flock on the move

The emu is a flightless bird that can run at about 50 kilometres an hour, and it stands beside a kangaroo on the [[Coat of arms of Australia|national coat of arms]]. Emus are nomads that travel long distances, following rain and the new growth it brings. In 1932 a flock estimated at around 20,000 birds drifted toward the wheatbelt, where crops and water were on offer. That figure is an estimate, not a count.

Emus also swallow pebbles, which sit in a muscular [[Gizzard stone|gizzard]] and grind tough seeds and grass. Birds have no teeth, so that grinding does the work teeth would do.
^ Emus pick their grinding pebbles deliberately, so every flock travels with its own millstones.

## Machine guns against birds

Farmers appealed to the government. Many were returned soldiers who had taken up land under the [[Soldier settlement scheme]], and many of those farms were struggling when wheat prices fell during the Depression. The government agreed to send a small force under Major Meredith, equipped with two [[Lewis gun|Lewis guns]] and thousands of rounds.

The Lewis gun was a light, air-cooled machine gun fed from a round pan magazine, built for trench warfare. The soldiers opened fire near Campion in early November. Their first problem was the birds' behaviour: flocks scattered under fire, regrouped out of range and kept moving, so a gun that needed a steady target found few.

On paper the odds looked good. [[Frederick Lanchester's 1916 model|Lanchester's laws]] holds that, for aimed fire, fighting strength rises with the square of the number of units, so twice the soldiers means four times the strength. The model assumes both sides shoot back, which the emus never did.

## Ammunition and arithmetic

Kill counts vary between accounts, but they run into the hundreds or low thousands, against thousands of rounds fired. Birds that escaped simply moved on. The operation was judged a failure, and the soldiers withdrew in December, about a month after they arrived. The story survives mainly in newspaper reports and military records, which disagree on the details.

## Pests, poison and the sky

The Emu War belongs to a long Australian habit of trying to control animals by force or chemistry. Western Australia built a roughly 1,800-kilometre [[Rabbit-Proof Fence|rabbit-proof fence]] to keep rabbits out of its farmland, decades after [[two dozen rabbits|European rabbit in Australia]] had begun spreading across the continent. In 1935 the [[Cane toad|cane toad]] was imported to Queensland to eat cane beetles, and it became a pest in its own right.

Chemistry has its own story. Some Western Australian plants make a toxin that is the active ingredient in [[1080 poison|1080 bait]] for foxes and wild dogs, and native animals there have evolved some tolerance to it. Tasmania took a simpler route, paying for dead [[Thylacine|thylacines]] for more than two decades.
^ The emu campaign lasted about a month; Tasmania's thylacine bounties ran for more than twenty years.

The emu also appears in the night sky. Many Aboriginal Australian traditions read an emu in the dark dust lanes of the Milky Way, the [[Emu in the Sky]]. In many of these readings the bird's head is the [[Coalsack Nebula]], a dust cloud so dense it looks like a hole in the sky. The figure is made of darkness rather than stars, which is what makes it unusual.

===
- [[Emu egg]] :: Dark green, thick-shelled, and incubated for about eight weeks by the male. :: deeper :: thing
- [[Dingo Fence]] :: A roughly 5,600 km barrier built to keep dingoes off sheep country. :: sideways :: thing
- [[Merino]] :: A Spanish sheep breed that became the backbone of Australia's wool industry. :: sideways :: creature
- [[Voynich manuscript]] :: A 15th-century book in an undeciphered script, illustrated with unidentified plants. :: wild :: mystery
- [[Tardigrade]] :: A microscopic animal that has survived the vacuum of space. :: wild :: creature
>>>
[[Soldier settlement scheme]] :: It placed many of this story's farmers on the land, and shows why many struggled.
???
Did the emus actually win, or did the army simply give up?
How many emus did the soldiers actually kill?
Are emus still considered pests on Western Australian farms?
`,
  },
  {
    title: "Why is ice slippery?",
    source: "Claude Haiku 5.5 stand-in",
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
    title: "Tulip mania",
    source: "Claude Haiku 5.5 stand-in",
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
    title: "Mantis shrimp vision",
    source: "Claude Haiku 5.5 stand-in",
    text: `# Mantis shrimp vision
> Eyes on independent stalks, up to 16 receptor types, and a sense of light's spin that few animals share.
~ You chose a wonderful first stop, because this animal's eyes break several assumptions most people hold about seeing, and every door below leads somewhere odd.
@ drift 0
: Photoreceptor types = 10 to 16, humans have 3
: Colour matching = poor at fine shades
: Circular polarization = detected, rare in animals
: Eyes = on stalks, moving independently
%%%
1989 :: Retina found to hold at least ten photoreceptor types
2008 :: Circular polarization vision reported in a stomatopod crustacean
2014 :: Behavioural tests show poor fine colour discrimination despite many receptors
+++
[[Circular polarization]] :: Light that spirals clockwise or anticlockwise, and few eyes can tell the difference. :: phenomenon
[[Trichromacy]] :: Human colour rests on three cone types; shrimp carry ten or more. :: concept
[[Thomas Young]] :: A polymath who proposed three colour receptors before anyone could measure one. :: person
[[Opsin]] :: A few amino acid swaps can shift colour sensitivity by tens of nanometres. :: mechanism
[[Ommatidium]] :: Each facet is a complete tiny eye: lens, cone and photoreceptors. :: mechanism
[[Midband]] :: A stripe across each eye's middle, where the colour receptors cluster. :: thing
[[Quarter-wave retarder]] :: Layered optics that turn spinning light into a flat, readable pattern. :: mechanism
[[Sonoluminescence]] :: Collapsing bubbles can flash light, and a smasher's club makes them. :: phenomenon
[[Pistol shrimp]] :: Its snapping claw fires a bubble that flashes light on collapse. :: creature
[[Bouligand structure]] :: Twisted-plywood layers in a club that engineers study for tougher composites. :: mechanism
[[Nectar guide]] :: Flowers paint ultraviolet bullseyes that point insects toward nectar. :: phenomenon
[[Tapetum lucidum]] :: A mirror layer behind the retina gives dim light a second pass. :: mechanism
[[Cambrian explosion]] :: Some argue the first sharp eyes lit the fuse of the animal boom. :: event
---
Each mantis shrimp eye sits on its own mobile stalk, so the two eyes can point in different directions at once. Each is a compound eye built from thousands of [[ommatidium|Ommatidium]] units, each one a lens, a crystalline cone and a bundle of light-catching cells. Some of its receptors reach into the ultraviolet, and others into light properties that human eyes ignore.

## More receptors, odd colour sense

Colour vision starts with how many receptor types an animal carries. Humans have three cone types, enough for [[trichromacy|Trichromacy]], an idea that goes back to [[Thomas Young]], a polymath who in 1802 argued that three kinds of receptor could make every colour, and who also worked on the Rosetta Stone's hieroglyphs. Mantis shrimp carry at least ten receptor types, and up to sixteen depending on species and how they are counted.

^ Thomas Young's three-receptor idea came more than a century before anyone measured cone types directly.

The colour-sensitive rows cluster in the [[midband|Midband]], a stripe across the middle of each eye, and every receptor type carries its own [[opsin|Opsin]], the light-catching protein whose amino acid sequence sets its peak sensitivity. A few amino acid swaps can shift that peak by tens of nanometres. Ultraviolet sensitivity matters here: it is the band where bees read [[nectar guides|Nectar guide]] on flowers.

Counting receptors is not the same as seeing colour. Behavioural tests in 2014 found that mantis shrimp can tell apart colours that differ widely but struggle with close shades, so the receptor count overstates their colour discrimination. One reading is that the receptors serve a different job, not a finer version of human colour matching.

## Reading the spin of light

The most unusual part of their vision is not colour but [[circular polarization|Circular polarization]]. Linearly polarized light oscillates in one plane, while circularly polarized light spirals like a corkscrew, clockwise or anticlockwise. In 2008 researchers showed that stomatopods, the mantis shrimp order, can tell the two spins apart, a sense few animals are known to share. Layered [[quarter-wave retarders|Quarter-wave retarder]] in the photoreceptors delay one of two light components by a quarter cycle, turning spin into a flat pattern the cell can read.

^ Many OLED phone screens use the same quarter-wave optics as circular polarizers to cut glare.

Polarization is not confined to crustaceans. Desert ants steer by the sky's polarization pattern, but circular detection is much rarer, and researchers still argue about how much of the signal the brain actually uses.

## Light from the club

Light is not only something the animal senses. A smasher, the club-armed kind, strikes at about 23 metres per second, creating cavitation bubbles: vapour pockets that form where water pressure drops. Their collapse can flash light, a cousin of [[sonoluminescence|Sonoluminescence]], the glow of collapsing bubbles. [[Pistol shrimp]] make similar flashing bubbles with a snapping claw, and physicists have studied those closely.

The club is an engineering curiosity too. Its striking region is a [[Bouligand structure|Bouligand structure]]: helical, mineral-rich chitin layers that deflect cracks instead of letting them run. Materials researchers study that layout for tougher composites.

## An eye that may have changed the sea

Some researchers think sharp vision helped trigger the [[Cambrian explosion|Cambrian explosion]], the burst of animal body plans about 540 million years ago. Andrew Parker's "light switch" hypothesis argues that once predators could see, prey had to evolve armour, camouflage and speed, and the arms race accelerated. The idea is contested, and the timing of early eyes is still argued over.

A [[tapetum lucidum|Tapetum lucidum]] in many nocturnal animals is a mirror layer behind the retina that gives dim light a second pass, which is why cat eyes glow. Mantis shrimp put their optical effort into colour and polarization, a different set of trade-offs.
===
- [[Rhabdom]] :: The stacked microvilli inside each photoreceptor, where light is actually caught. :: deeper :: mechanism
- [[Sky compass]] :: Desert ants read the sky's polarization pattern to steer home. :: sideways :: mechanism
- [[Cuttlefish]] :: Thought to have one photoreceptor type, yet it matches background colours. :: sideways :: creature
- [[Tardigrade]] :: Dries into a glassy, sugar-packed tun that survives vacuum and radiation. :: wild :: creature
- [[Interstellar polarization]] :: Starlight polarized by aligned dust grains maps magnetic fields in our galaxy. :: wild :: phenomenon
>>>
[[Circular polarization]] :: The strangest sense here, and the one most readers have never heard of.
???
Do mantis shrimp really see more colours than we do?
What do they use circular polarization vision for?
How does a single strike make bubbles flash?
`,
  },
];
