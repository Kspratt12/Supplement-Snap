import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "../../../lib/site-footer"
import { NavLinks } from "../../../lib/nav-links"

type BlogImage = { src: string; alt: string }

type Article = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  publishedDate: string
  highlight?: { label: string; value: string; subtext: string }
  images?: Record<number, BlogImage>
  sections: Array<{ heading: string; content: string }>
}

const ARTICLES: Article[] = [
  {
    slug: "how-to-write-a-roofing-supplement",
    title: "How to Write a Roofing Supplement That Gets Approved",
    metaTitle: "How to Write a Roofing Supplement for Insurance | Step-by-Step Guide",
    metaDescription: "Learn how to write a roofing supplement that insurance adjusters approve. Step-by-step guide with documentation tips, Xactimate codes, and common mistakes to avoid.",
    publishedDate: "2026-03-10",
    sections: [
      {
        heading: "What is a roofing supplement?",
        content: "A roofing supplement is a request for additional payment beyond the original insurance estimate. When your crew tears off an existing roof and discovers concealed damage (rotted decking, failed flashing, missing ice and water shield, deteriorated pipe boots), that damage wasn't visible during the initial adjuster inspection. The supplement documents this hidden damage and requests the insurance carrier to cover the cost of repairing it.\n\nSupplements are one of the most overlooked revenue opportunities in roofing. The average supplement recovers $1,500–$3,200 per job, yet most contractors either skip them entirely or submit weak documentation that gets denied."
      },
      {
        heading: "Why most roofing supplements get denied",
        content: "The number one reason supplements get denied is insufficient documentation. An adjuster who wasn't on your roof needs to see clear evidence of concealed damage. If your supplement is just a line item in Xactimate with no photos, no description of where the damage was found, and no explanation of why it wasn't visible before tear-off, it's going to be denied.\n\nOther common reasons for denial include submitting too late (weeks after the job), using vague descriptions like 'additional work needed,' not referencing building codes that require the repair, and failing to explain why the damage was concealed."
      },
      {
        heading: "Step 1: Document damage during tear-off",
        content: "The most important step happens on the roof during tear-off. When your crew discovers hidden damage, they need to capture it immediately, before it gets covered up by new materials.\n\nFor each finding, document:\n\n• Clear photographs showing the damage in context (wide shot) and up close (detail shot)\n• The exact location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• The type of damage (rotted decking, corroded flashing, missing ice and water shield, deteriorated pipe boot)\n• A description of the condition (how many sheets of decking, how many linear feet of flashing, etc.)\n• Measurements when possible: square footage of affected area, number of sheets to replace\n\nThis is where most contractors fail. The crew finds damage, maybe takes a blurry photo, texts it to the office, and by the time someone writes up the supplement days later, half the details are lost or forgotten."
      },
      {
        heading: "Step 2: Write a professional supplement narrative",
        content: "The supplement narrative is the written explanation that accompanies your photos and Xactimate line items. This is what the adjuster reads to understand what was found and why it needs to be covered.\n\nA strong supplement narrative should include:\n\n• A statement that the damage was concealed and not visible during the initial inspection\n• A description of when and how the damage was discovered (during tear-off operations)\n• Specific details about the damage: type, location, extent, measurements\n• An explanation of why the repair is necessary (structural integrity, building code compliance, manufacturer warranty requirements)\n• Reference to applicable building codes when relevant (e.g., ice and water shield requirements in valleys and eaves)\n\nAvoid vague language. Instead of 'decking was damaged,' write 'Three sheets of 1/2-inch CDX plywood along the eave edge of the front slope were found to be severely deteriorated from prolonged moisture exposure. The wood was soft and crumbling upon removal of the existing shingles, indicating concealed water damage not visible during the initial inspection.'"
      },
      {
        heading: "Step 3: Map to Xactimate line codes",
        content: "Insurance adjusters work in Xactimate. If you want your supplement approved quickly, submit it in their language. Each type of damage maps to specific Xactimate line codes:\n\n• Decking replacement: RFG SHTHN (sheathing - plywood/OSB)\n• Felt/underlayment: RFG RFLT30 (30# roofing felt)\n• Step flashing: RFG FLSH (flashing - step/counter)\n• Pipe boots: RFG VENT (roof vent - pipe jack)\n• Drip edge: RFG DRIP (drip edge - aluminum)\n• Ice and water shield: RFG I&WS (ice & water membrane)\n• Additional layer removal: RFG TEAR (remove additional layer)\n\nInclude accurate quantities and measurements. A supplement that says '1 SQ of decking' when photos show three full sheets of plywood gets flagged. Be precise."
      },
      {
        heading: "Step 4: Submit with photos and PDF report",
        content: "Package everything into a clean, professional report. The best supplement submissions include:\n\n• A cover page with project name, property address, date, insurance company, and claim number\n• Each finding with its photos, description, and supplement narrative\n• A findings summary table\n• Supporting photos labeled with what they show\n• A certification statement that the damage was concealed and discovered during tear-off\n\nEmail the report directly to the adjuster the same day you find the damage. Speed matters. The sooner you submit, the fresher the documentation, and the faster you get paid."
      },
      {
        heading: "How Supplement Snap automates this process",
        content: "Supplement Snap was built to solve this exact workflow. Your crew captures damage photos during tear-off, tags the damage type and roof area, and adds a voice note describing what they found (works in any language; Spanish voice notes are auto-translated to English).\n\nThe system uses AI to generate a professional supplement narrative from the field data. You can export an Xactimate-ready CSV with the correct line codes and pricing, and email a complete PDF report to the adjuster, all from the field, the same day.\n\nOne tap from the roof to a professional supplement submission. No more lost photos, forgotten details, or supplements that sit in the office for weeks."
      },
    ],
  },
  {
    slug: "roofing-supplement-denied-what-to-do",
    title: "Roofing Supplement Denied? Here's What to Do Next",
    metaTitle: "Roofing Supplement Denied? What to Do Next | Contractor Guide",
    metaDescription: "Your roofing supplement was denied by the insurance company. Here's what to do next, from re-documenting damage to filing appeals and preventing future denials.",
    publishedDate: "2026-03-12",
    sections: [
      {
        heading: "Why your roofing supplement was denied",
        content: "Getting a supplement denied is frustrating, especially when you know the damage is real and the repair was necessary. But understanding why it was denied is the first step to getting it approved on appeal or preventing it from happening on the next job.\n\nThe most common denial reasons are:\n\n• Insufficient documentation: photos are blurry, too few, or don't show the damage clearly\n• Vague or missing narrative: no written explanation of what was found and why it should be covered\n• Late submission: the supplement was filed weeks or months after the work was done\n• Not clearly concealed: the adjuster argues the damage should have been visible during the initial inspection\n• Incorrect Xactimate codes: line items don't match what's standard for the repair\n• Missing building code reference: the repair is required by code but you didn't cite it"
      },
      {
        heading: "Step 1: Review the denial reason",
        content: "Read the denial letter carefully. Insurance companies are required to state why the supplement was denied. The reason tells you exactly what to fix in your appeal.\n\nIf the denial says 'insufficient documentation,' you need better photos and a more detailed narrative. If it says 'pre-existing damage,' you need to explain why the damage was concealed and couldn't have been identified before tear-off. If it says 'not in scope,' you may need to reference building codes that require the repair."
      },
      {
        heading: "Step 2: Gather additional evidence",
        content: "Go back to your documentation. Do you have:\n\n• Clear photos of the damage taken during tear-off?\n• Photos showing the damage was under the existing shingles/materials (proving concealment)?\n• Measurements and quantities?\n• A description of the location on the roof?\n\nIf your original documentation was weak, this is why tools like Supplement Snap exist. They force proper documentation at the point of discovery, so you never end up in this situation."
      },
      {
        heading: "Step 3: Write a stronger narrative",
        content: "Your appeal narrative should directly address the denial reason. If the adjuster said 'insufficient evidence of concealed damage,' your narrative should explain:\n\n• The damage was located beneath existing roofing materials and could not be identified during a standard visual inspection\n• The damage was discovered during tear-off operations on [specific date]\n• Attached photos show the condition of the area after removal of existing materials\n• The repair is necessary to restore the roof system to its pre-loss condition\n\nBe specific, be professional, and reference your photos by number."
      },
      {
        heading: "Step 4: Resubmit with a complete package",
        content: "Resubmit the supplement as a complete package, not just a reply to the denial. Include a fresh PDF report with all photos, narratives, Xactimate line items, and a cover letter referencing the original claim number and explaining why the supplement should be reconsidered.\n\nRequest a re-inspection if the denial was based on the adjuster not seeing the damage. You may also escalate to a supervisor or file a complaint with your state's Department of Insurance if you believe the denial was unjustified."
      },
      {
        heading: "How to prevent supplement denials in the future",
        content: "The best defense against supplement denials is proper documentation captured in real time during tear-off. This means:\n\n• Photograph every finding immediately with multiple angles, context and detail shots\n• Document the location, damage type, and extent before covering it with new materials\n• Write or record a description of what was found (voice notes work great for this)\n• Submit the supplement the same day. Don't wait.\n• Use Xactimate-standard line codes and accurate quantities\n• Reference building codes when the repair is code-required\n\nSuplement Snap automates all of this. Your crew captures damage from the roof, the system generates the documentation, and you email it to the adjuster before the crew leaves the job site."
      },
    ],
  },
  {
    slug: "xactimate-codes-for-roofing-supplements",
    title: "Xactimate Codes for Roofing Supplements: Complete Reference",
    metaTitle: "Xactimate Codes for Roofing Supplements | Complete Code List",
    metaDescription: "Complete list of Xactimate line codes for roofing supplements: decking, flashing, ice & water shield, pipe boots, drip edge, tear-off, and more.",
    publishedDate: "2026-03-08",
    sections: [
      {
        heading: "Why Xactimate codes matter for supplements",
        content: "Insurance adjusters use Xactimate to estimate repair costs. When you submit a supplement using the same line codes and format the adjuster works in, your supplement gets processed faster and has a higher approval rate.\n\nSubmitting a supplement as a plain-text description forces the adjuster to translate your findings into Xactimate themselves, which means they might use lower-cost codes, miss line items, or simply deny the supplement because it's too much work to process."
      },
      {
        heading: "Decking and sheathing codes",
        content: "When rotted or damaged decking is found during tear-off:\n\n• RFG SHTHN — Sheathing, plywood/OSB, 1/2\" CDX — used for replacing damaged decking. Measured in SF (square feet). National average: ~$2.18/SF\n• RFG RFLT30 — Roofing felt, 30# — underlayment that goes over new decking. Measured in SF. National average: ~$0.52/SF\n\nAlways measure the actual area of damaged decking. Count sheets if possible; a standard sheet is 4x8 (32 SF). Include photos showing the rotted wood with context of where it sits on the roof."
      },
      {
        heading: "Flashing codes",
        content: "For failed or corroded flashing:\n\n• RFG FLSH — Flashing, step/counter, aluminum — remove and replace. Measured in LF (linear feet). National average: ~$8.75/LF\n• RFG FLSHC — Flashing, counter/cap — remove and replace. Measured in LF. National average: ~$6.50/LF\n\nDocument the type of flashing (step, counter, valley), the material (aluminum, galvanized), and the location (chimney, wall, skylight). Photograph both the removed flashing and the area it was protecting."
      },
      {
        heading: "Ice and water shield codes",
        content: "For missing or deteriorated ice and water membrane:\n\n• RFG I&WS — Ice & water shield membrane, install. Measured in SF. National average: ~$1.85/SF\n\nThis is one of the most common supplement items because many older roofs were installed without ice and water shield in areas where current building codes now require it (valleys, eaves, around penetrations). Always reference the applicable building code in your supplement narrative."
      },
      {
        heading: "Vent and pipe boot codes",
        content: "For damaged pipe boots and roof vents:\n\n• RFG VENT — Roof vent, pipe jack/boot, remove and replace. Measured in EA (each). National average: ~$85.00/EA\n\nPipe boots deteriorate over time and are often cracked or separated when discovered during tear-off. Document each pipe boot individually with photos."
      },
      {
        heading: "Drip edge codes",
        content: "For missing or damaged drip edge:\n\n• RFG DRIP — Drip edge, aluminum, remove and replace. Measured in LF (linear feet). National average: ~$4.25/LF\n\nDrip edge is required by most building codes and is a common supplement item when the original installation didn't include it or it has corroded."
      },
      {
        heading: "Additional layer removal codes",
        content: "For roofs with multiple layers:\n\n• RFG TEAR — Remove additional layer of roofing. Measured in SQ (squares, 100 SF). National average: ~$45.00/SQ\n• RFG HAUL — Haul debris, additional roofing layer. Measured in SQ. National average: ~$22.50/SQ\n\nMultiple layers are only discovered during tear-off. Document the number of layers found and photograph the cross-section showing multiple layers of shingles."
      },
      {
        heading: "How Supplement Snap handles Xactimate codes",
        content: "Supplement Snap automatically maps each damage type to the correct Xactimate line codes with sub-items and unit pricing. When you export the Xactimate CSV, each capture generates the appropriate line items with quantities and national average pricing.\n\nFor example, a 'Decking' capture automatically generates both the sheathing replacement line (RFG SHTHN) and the felt underlayment line (RFG RFLT30). A 'Multiple Layers' capture generates both the tear-off line (RFG TEAR) and the haul debris line (RFG HAUL).\n\nThis saves your office staff from manually looking up codes and pricing, and ensures nothing gets missed in the export."
      },
    ],
  },
  {
    slug: "how-much-do-roofing-supplements-pay",
    title: "How Much Do Roofing Supplements Pay? Real Numbers for Contractors",
    metaTitle: "How Much Do Roofing Supplements Pay? | Real Revenue Numbers",
    metaDescription: "How much do roofing supplements actually pay? Real revenue data from contractors on average supplement values, what gets approved, and how to maximize recovery.",
    publishedDate: "2026-03-14",
    sections: [
      {
        heading: "The short answer: $1,500–$3,200 per job",
        content: "On a typical residential roof replacement with an insurance claim value of $10,000–$15,000, the average supplement recovery is $1,500–$3,200. This represents hidden damage found during tear-off that wasn't included in the original adjuster estimate.\n\nSome jobs yield more, some less. A simple re-roof on a ranch-style home might only produce $800–$1,200 in supplementable items. A complex roof with multiple penetrations, valleys, and older construction can produce $4,000–$6,000 in supplements."
      },
      {
        heading: "What items contribute to supplement value",
        content: "The most valuable supplement items by average recovery:\n\n• Decking replacement (3+ sheets): $200–$600. This is the most common supplement item.\n• Step and counter flashing (chimney or wall): $300–$800. Often corroded and hidden.\n• Ice and water shield (valleys + eaves): $200–$500. Code-required, often missing on older roofs.\n• Multiple layer removal: $400–$1,000. Only discovered during tear-off.\n• Pipe boot replacement (multiple): $85–$340. Cracked boots are extremely common.\n• Drip edge (full perimeter): $150–$400. Missing on many older homes.\n\nOn a single job, a crew might find 3–5 of these items, pushing the total supplement value into the $1,500–$3,200 range."
      },
      {
        heading: "How many jobs have supplementable damage?",
        content: "Experienced restoration contractors report that 70–90% of insurance tear-offs have at least one supplementable finding. The damage is almost always there. The question is whether your crew documents it.\n\nThe problem isn't finding the damage. The problem is that most crews don't have a system to capture it properly in the moment. By the time someone in the office tries to write up the supplement from memory and a few blurry photos, the opportunity is lost."
      },
      {
        heading: "The math: what supplements mean for your business",
        content: "Let's say your company does 10 insurance roof replacements per month:\n\n• Without supplements: 10 jobs × $12,000 average = $120,000/month\n• With supplements ($2,400 avg): 10 jobs × $14,400 average = $144,000/month\n• Additional annual revenue: $288,000\n\nThat's $288,000 in revenue that was already there, on jobs you were already doing. You're not finding new customers. You're just capturing the money that was hiding under the shingles.\n\nEven a solo crew doing 4 jobs per month recovers an additional $115,200/year with proper supplement documentation."
      },
      {
        heading: "Why most contractors leave this money on the table",
        content: "The gap between 'finding damage' and 'recovering supplement money' is documentation. Most contractors fall into one of these traps:\n\n• Crew finds damage but doesn't photograph it properly\n• Photos get lost in text messages between crew and office\n• Office doesn't have time to write up supplements for every job\n• Supplement gets submitted weeks later with weak documentation\n• Adjuster denies it due to insufficient evidence\n\nThe solution is capturing documentation at the point of discovery, on the roof, during tear-off, in real time. That's exactly what Supplement Snap was built for."
      },
      {
        heading: "How to start recovering supplements today",
        content: "You don't need to change your entire workflow. Start with your next tear-off:\n\n1. When your crew finds hidden damage, have them photograph it and tag what it is\n2. Add a quick voice note describing the damage\n3. Generate an AI supplement narrative from the field data\n4. Email a PDF report to the adjuster before you leave the job site\n\nSupplement Snap handles all four steps. The platform starts at $99/month with a 14-day free trial and pays for itself on the first job with a single approved supplement."
      },
    ],
  },
  {
    slug: "roofing-supplement-process-explained",
    title: "The Roofing Supplement Process Explained: From Tear-Off to Approval",
    metaTitle: "Roofing Supplement Process Explained | From Tear-Off to Approval",
    metaDescription: "Complete guide to the roofing supplement process, from discovering hidden damage during tear-off to getting insurance approval. Written for contractors.",
    publishedDate: "2026-03-06",
    sections: [
      {
        heading: "What happens when your crew finds hidden damage",
        content: "It happens on almost every tear-off. Your crew pulls back the shingles and discovers something the adjuster didn't, and couldn't, see during the initial inspection. Rotted decking along the eave. Corroded step flashing at the chimney. Missing ice and water shield in the valley. A pipe boot that crumbled when they pulled the old shingles off.\n\nThis concealed damage is legitimate additional work that the insurance policy should cover. The process for getting it covered is called a supplement, and it starts the moment your crew discovers the damage."
      },
      {
        heading: "Phase 1: Discovery and documentation",
        content: "The most critical phase happens on the roof. When damage is discovered during tear-off, it needs to be documented immediately, before new materials cover it up.\n\nEffective documentation includes:\n• Multiple photographs per finding (wide context shot + close-up detail)\n• Identification of damage type (decking, flashing, ice & water, pipe boot, drip edge)\n• Location on the roof (front slope, back slope, valley, chimney, eave, ridge)\n• Estimated quantity (number of sheets, linear feet, square footage)\n• Field notes describing the condition\n\nThe biggest mistake contractors make is waiting until they get back to the office to document findings. By then, photos are buried in camera rolls, details are fuzzy, and the urgency is gone."
      },
      {
        heading: "Phase 2: Writing the supplement",
        content: "The supplement is a formal request to the insurance carrier for additional payment. It includes:\n\n• A narrative explaining what was found, where, and why it wasn't visible before tear-off\n• Xactimate line items with the appropriate codes, quantities, and pricing\n• Supporting photographs\n• Reference to applicable building codes (when relevant)\n\nThe narrative is the heart of the supplement. It needs to clearly communicate that the damage was concealed, was discovered during tear-off operations, and requires additional work beyond the original scope to restore the roof system properly.\n\nMany contractors either skip the narrative entirely (just submitting Xactimate line items) or write something so vague that the adjuster can't justify approval. The narrative should be specific, professional, and reference your photographic evidence."
      },
      {
        heading: "Phase 3: Submission to the insurance carrier",
        content: "Submit the supplement to the insurance adjuster as quickly as possible, ideally the same day the damage is found. Speed matters for two reasons:\n\n1. Fresh documentation is more credible. A supplement submitted the same day as the tear-off carries more weight than one submitted three weeks later.\n2. The adjuster may want to re-inspect. If you've already installed new materials over the damage, a re-inspection is impossible.\n\nThe best submission format is a professional PDF report with an attached Xactimate-compatible spreadsheet. Email it directly to the adjuster with the claim number in the subject line."
      },
      {
        heading: "Phase 4: Adjuster review and negotiation",
        content: "After submission, the adjuster reviews your supplement. This can take 3–14 business days depending on the carrier. Possible outcomes:\n\n• Approved in full: the carrier agrees with your findings and adjusts the claim\n• Partially approved: some items approved, others denied or reduced\n• Re-inspection requested: the adjuster wants to see the damage in person\n• Denied: the carrier rejects the supplement (see our guide on what to do when this happens)\n\nIf partially approved, review which items were denied and why. You can resubmit with additional documentation or escalate to a supervisor. If a re-inspection is requested, coordinate with the adjuster and be prepared to show the documented evidence."
      },
      {
        heading: "How Supplement Snap streamlines the entire process",
        content: "Supplement Snap was designed around this exact workflow:\n\n• Phase 1 (Discovery): Your crew captures photos, tags damage type and roof area, adds voice notes, all from the roof during tear-off\n• Phase 2 (Writing): AI generates professional supplement narratives from the field data. Xactimate CSV export with correct line codes and pricing.\n• Phase 3 (Submission): One-click PDF report generation and email to the adjuster, same day, from the field\n• Phase 4 (Tracking): Claim pipeline tracks each project from In Progress through Submitted to Approved\n\nThe entire process that used to take days of office work now happens in minutes, right from the job site."
      },
    ],
  },
  {
    slug: "roof-tear-off-cost",
    title: "Roof Tear-Off Cost in 2026: What Contractors and Homeowners Should Know",
    metaTitle: "Roof Tear-Off Cost in 2026 | Pricing by Size, Material & Pitch",
    metaDescription: "What does a roof tear-off cost in 2026? Breakdown by roof size, material, pitch, and layers, plus hidden costs discovered during tear-off and how supplements recover them.",
    publishedDate: "2026-03-20",
    highlight: { label: "Average Tear-Off Cost", value: "$1,000–$1,800", subtext: "Per square (100 SF) including labor and disposal" },
    images: {
      1: { src: "/blog/roof-tear-off-cost/tear-off-in-progress.jpg", alt: "Roof mid-tear-off showing exposed decking and damaged shingles being removed" },
      3: { src: "/blog/roof-tear-off-cost/hidden-damage-found.jpg", alt: "Rotted roof decking discovered during tear-off requiring supplement documentation" },
    },
    sections: [
      {
        heading: "What is a roof tear-off and why does cost matter?",
        content: "A roof tear-off is the process of removing all existing roofing materials down to the deck before installing a new roof system. Unlike a roof-over (where new shingles are layered on top of old ones), a tear-off gives contractors and homeowners a clean slate and a clear view of the decking and underlayment underneath.\n\nRoof tear-off cost matters for two audiences. For homeowners, it is often the single largest line item on a roofing estimate and directly affects out-of-pocket expense or insurance claim value. For contractors, understanding real-world tear-off costs is essential for writing accurate bids, setting proper expectations, and identifying where supplement revenue hides.\n\nIn 2026, tear-off costs have risen compared to prior years due to increased labor rates, disposal fee hikes at many landfills, and material price volatility. Whether you are a homeowner evaluating quotes or a contractor building estimates, having current numbers prevents surprises and protects margins."
      },
      {
        heading: "Average roof tear-off cost by roof size",
        content: "Roof tear-off cost is most commonly measured per roofing square (one square equals 100 square feet). In 2026, national averages for a single-layer asphalt shingle tear-off look like this:\n\n• 1,000 SF roof (10 squares): $1,000–$1,800 total\n• 1,500 SF roof (15 squares): $1,500–$2,700 total\n• 2,000 SF roof (20 squares): $2,000–$3,600 total\n• 2,500 SF roof (25 squares): $2,500–$4,500 total\n• 3,000 SF roof (30 squares): $3,000–$5,400 total\n\nThese ranges reflect a per-square cost of roughly $100–$180 for a standard single-layer asphalt shingle tear-off, including labor, debris removal, and dump fees. Keep in mind that these numbers cover tear-off only and do not include the cost of the new roof installation.\n\nRegional variation is significant. Markets with higher labor costs (Northeast, West Coast, major metro areas) land at the upper end, while the Southeast and Midwest tend to fall at the lower end. Rural areas sometimes see lower labor rates but higher haul-off costs because the landfill or transfer station is farther away."
      },
      {
        heading: "Factors that affect roof tear-off cost",
        content: "No two tear-offs cost the same. Several variables push the price up or down significantly:\n\nNumber of layers: This is the biggest cost multiplier. A second layer of shingles can add $50–$100 per square to the tear-off cost because of the additional labor and disposal weight. A third layer (which some older homes still have) adds even more and often requires extra dump fees due to sheer volume. Many insurance estimates only account for a single layer because the adjuster cannot see beneath the surface during initial inspection.\n\nRoofing material: Asphalt shingles are the easiest and cheapest to remove. Wood shake tear-offs run $150–$250 per square because shake is heavier, harder to strip, and creates more debris. Tile roofs (clay or concrete) are the most expensive at $200–$400 per square due to extreme weight (a single square of concrete tile can weigh over 900 pounds) and the need for specialized equipment to lower material safely.\n\nRoof pitch: A walkable roof (6/12 pitch or less) keeps tear-off costs at the baseline. Once pitch exceeds 8/12, crews need additional safety equipment (harnesses, roof jacks, toe boards) and move more slowly, adding 15–30% to labor costs. Extremely steep roofs (12/12 and above) can nearly double labor time.\n\nRoof access and height: A single-story ranch with a driveway next to the roof line is the easiest scenario. Multi-story homes, properties with limited ground access, landscaping that needs protection, or structures where the dumpster cannot be placed close to the building all increase cost because debris must be carried farther or lowered by hand.\n\nRoof complexity: A simple gable roof tears off quickly. Add dormers, valleys, hips, skylights, chimneys, multiple penetrations, and satellite dishes, and the crew spends significantly more time working around obstacles. Each penetration also increases the likelihood of finding hidden damage beneath flashing."
      },
      {
        heading: "Hidden costs discovered during tear-off",
        content: "Here is where roof tear-off cost gets unpredictable, and this is where contractors leave the most money on the table. Once the existing roofing material comes off, the crew often discovers damage that was completely invisible during the initial inspection:\n\n• Rotted or deteriorated decking: Water intrusion over years softens plywood or OSB sheathing. Replacing damaged decking adds $2.00–$2.50 per square foot ($64–$80 per standard 4x8 sheet). It is not unusual to find 3–10 sheets of bad decking on a single job.\n\n• Failed or missing flashing: Step flashing at chimneys, counter flashing along walls, and valley flashing can be corroded, improperly installed, or completely absent. Replacing step flashing runs $8–$12 per linear foot, and most chimney reflashing jobs total $300–$800.\n\n• Missing ice and water shield: Many older roofs were installed before current building codes required ice and water membrane in valleys, at eaves, and around penetrations. Installing it during the reroof is code-required in most jurisdictions and adds $1.50–$2.00 per square foot.\n\n• Deteriorated pipe boots: Rubber pipe boots crack and separate after 10–15 years. Replacing each one costs $75–$100 including materials and labor.\n\n• Additional layer discovery: The adjuster estimated a single-layer tear-off, but the crew finds two or even three layers once they start pulling material. Each additional layer adds labor, time, and dump fees.\n\nThese hidden costs can add $1,500–$5,000 or more to the actual cost of the job. For insurance claims, this is the gap between what the adjuster originally approved and what the job actually requires."
      },
      {
        heading: "How insurance estimates handle tear-off cost",
        content: "On an insurance claim, the adjuster writes an estimate based on what they can see during a visual inspection, typically from a ladder or by walking the roof surface. The tear-off line item in the original estimate covers removing the visible roofing material. It does not cover what is hidden underneath.\n\nThis is by design. Insurance policies cover the cost to restore the property to its pre-loss condition, but the adjuster can only estimate what is visible. Concealed damage (rotted decking under shingles, corroded flashing behind step metal, a second layer of roofing hidden under the top layer) cannot be assessed until the roof is actually torn off.\n\nThe mechanism for recovering these hidden costs is the supplement. A supplement is a formal request to the insurance carrier to adjust the claim upward based on damage discovered during tear-off. It is a standard part of the insurance restoration process, and adjusters expect them on jobs where concealed damage is found.\n\nThe key to getting supplements approved is documentation. The carrier needs clear photographic evidence that the damage was hidden, that it was discovered during tear-off, and that the repair is necessary. Without documentation, the contractor absorbs the cost, and that directly erodes the profit margin on the job.\n\nFor homeowners, understanding the supplement process matters because it means their out-of-pocket cost should not increase when hidden damage is found. The insurance policy covers concealed damage; the contractor just needs to document it and submit the supplement."
      },
      {
        heading: "How to reduce tear-off cost without cutting corners",
        content: "For contractors looking to keep tear-off costs manageable while maintaining quality:\n\nOptimize dumpster placement: Getting the dumpster as close to the roof edge as possible saves enormous labor time. Crews throw debris directly into the container instead of carrying it across the yard. On multi-story homes, consider using a roofing conveyor or chute.\n\nUse proper tear-off tools: Shingle shovels, tear-off spades, and power tools like roofing tear-off machines on large commercial jobs speed up the process significantly. A well-equipped crew can tear off 25–35 squares per day on a standard residential roof.\n\nSchedule dump runs strategically: Some landfills charge by weight, others by load. Know your local dump fee structure and time your haul-offs accordingly. Overloading a single dumpster may cost less than two partially filled ones.\n\nTrain crews on damage identification: Every minute of tear-off is an opportunity to spot supplementable damage. Crews that know what to look for, and how to flag it, turn tear-off into a revenue-generating activity instead of pure cost.\n\nFor homeowners evaluating contractor quotes, be wary of bids that seem unusually low on tear-off. A lowball tear-off number often means the contractor is cutting corners on cleanup, skipping proper deck inspection, or planning to hit you with change orders once the roof is open."
      },
      {
        heading: "Recovering hidden tear-off costs with supplements",
        content: "The single biggest financial opportunity during a roof tear-off is capturing and recovering the cost of concealed damage through supplements. On an average insurance reroof, contractors who document hidden damage properly recover an additional $1,500–$3,200 per job.\n\nThe challenge has always been the documentation workflow. Your crew is on the roof, moving fast, focused on getting the tear-off done and new materials installed. Stopping to take detailed photos, write notes, and measure damaged areas slows down production. And if documentation happens after the fact, back at the office from memory, it is usually incomplete.\n\nThis is exactly the problem Supplement Snap was built to solve. During tear-off, your crew captures damage photos directly in the app, tags the damage type and roof location, and adds a quick voice note describing what they found. The system generates a professional supplement narrative using AI, maps each finding to the correct Xactimate line codes, and produces a PDF report you can email to the adjuster the same day.\n\nThe result: hidden tear-off costs that used to eat into your margin become documented, submitted, and recovered. Instead of absorbing $2,000 in rotted decking and missing flashing, you turn it into a supplement that gets approved and paid. For contractors doing 10 or more insurance jobs per month, proper tear-off documentation can mean the difference between a tight year and a highly profitable one."
      },
    ],
  },
  {
    slug: "best-roof-estimating-software",
    title: "Best Roof Estimating Software for Contractors in 2026",
    metaTitle: "Best Roof Estimating Software for Contractors in 2026 | Comparison Guide",
    metaDescription: "Compare the best roof estimating software for contractors in 2026. Satellite measurement, field documentation, CRM, and supplement tools. What to look for and how they work together.",
    publishedDate: "2026-03-21",
    highlight: { label: "Key Insight", value: "$1,500–$3,200", subtext: "Average supplement recovery per job (the gap most software misses)" },
    images: {
      1: { src: "/blog/best-roof-estimating-software/satellite-roof-measurement.png", alt: "Satellite roof measurement showing 3D roof model with panel dimensions and pitch data" },
      3: { src: "/blog/best-roof-estimating-software/supplement-snap-capture.png", alt: "Supplement Snap field capture screen showing roof damage being documented during tear-off" },
      5: { src: "/blog/best-roof-estimating-software/supplement-snap-pdf-report.png", alt: "Professional supplement report generated by Supplement Snap with photos and damage narratives" },
    },
    sections: [
      {
        heading: "What roof estimating software does and why it matters",
        content: "Roof estimating software helps contractors measure roofs, calculate material quantities, generate cost estimates, and produce professional proposals, faster and more accurately than manual methods. In 2026, the category has expanded well beyond simple calculators. Modern roof estimating tools pull satellite imagery, integrate with supplier pricing, sync with CRMs, and even generate insurance-ready documentation.\n\nFor roofing contractors, the right software stack directly impacts revenue. Accurate estimates mean fewer jobs underbid. Faster measurements mean more proposals generated per day. Professional-looking reports build homeowner confidence and increase close rates. And for insurance restoration contractors, the ability to produce Xactimate-compatible documentation can mean the difference between recovering full claim value and leaving thousands on the table.\n\nThe challenge is that no single tool does everything. The roof estimating software market is fragmented across several categories, and contractors often need two or three tools working together to cover the full workflow, from initial measurement through final supplement submission. Understanding what each category does and where the gaps are helps you build a stack that actually pays for itself."
      },
      {
        heading: "Category 1: Satellite measurement tools",
        content: "Satellite measurement tools let you measure a roof remotely using aerial imagery, no ladder climb required. You enter an address, the software pulls high-resolution satellite or drone imagery, and you get a detailed roof report with square footage, pitch, ridges, valleys, hips, rakes, eaves, and waste factor.\n\nPopular satellite measurement platforms in 2026 include:\n\n• EagleView: The industry standard for roof measurement reports. Provides detailed geometry including facet-level measurements, pitch by slope, and suggested waste percentages. Reports are widely accepted by insurance carriers and are often used by adjusters themselves. Pricing runs $15–$50 per report depending on volume and turnaround time.\n\n• GAF QuickMeasure: A strong competitor to EagleView with competitive pricing and fast turnaround. Integrated with GAF's contractor programs and offers material-specific waste calculations.\n\n• Roofr: Combines instant satellite measurements with a built-in proposal tool. Strong for residential contractors who want to generate a measurement and a customer-facing quote in one step. Offers a free tier with limited features and paid plans starting around $100/month.\n\n• SkyMeasure (by CoreLogic): Popular with insurance-focused contractors and carriers. Provides detailed reports used in the claims process.\n\nSatellite measurement tools are excellent for generating initial estimates and proposals before visiting the property. Their limitation is that they show you what the roof looks like from above. They cannot tell you what is hiding underneath the existing materials. The condition of the decking, flashing, underlayment, and other concealed components remains unknown until someone physically inspects or tears off the roof."
      },
      {
        heading: "Category 2: Estimating and proposal platforms",
        content: "Once you have measurements, estimating platforms help you turn those numbers into material lists, labor calculations, and customer-facing proposals. Some are standalone; others are built into larger CRM systems.\n\nKey platforms in this space:\n\n• Xactimate (by Verisk): The industry standard for insurance restoration estimating. If you do insurance work, you need Xactimate. Adjusters use it, carriers expect it, and supplements must be submitted in its format. Pricing is subscription-based, starting around $200/month for the desktop version. The learning curve is steep, but it is non-negotiable for restoration work.\n\n• RoofSnap: Combines aerial measurements with a built-in estimating tool. Allows you to draw roof diagrams, calculate materials, and generate proposals. Popular with residential retail contractors. Plans start around $100/month.\n\n• JobNimbus: A full CRM with built-in estimating capabilities. Tracks leads, generates estimates, manages projects, and handles invoicing. Strong for contractors who want one system for the entire sales pipeline. Plans start around $150/month.\n\n• AccuLynx: Another CRM-plus-estimating platform focused on roofing. Includes aerial measurements, material ordering integration, and project management. Geared toward mid-size and larger roofing companies.\n\nThese platforms are strong for generating retail estimates and managing the sales process. For insurance restoration, Xactimate is the essential tool, but even Xactimate only covers the estimating side. It does not capture field documentation, generate supplement narratives, or help your crew document what they find on the roof."
      },
      {
        heading: "Category 3: Field documentation and supplement tools",
        content: "This is the newest and most underserved category in roofing software. Field documentation tools focus on what happens after the sale, specifically capturing evidence of damage discovered during roof tear-off and turning that evidence into supplement requests.\n\nWhy this category exists: On insurance restoration jobs, the adjuster writes an initial estimate based on visible damage. When the crew tears off the existing roof and finds concealed damage (rotted decking, failed flashing, missing ice and water shield), that damage needs to be documented, written up, and submitted as a supplement to the insurance carrier. This process has historically been manual, inconsistent, and slow.\n\nTraditional workflow: Crew texts blurry photos to the office. Project manager tries to remember what the damage looked like. Someone writes up a narrative days or weeks later. An office admin manually builds the Xactimate line items. The supplement gets submitted late with weak documentation and often gets denied.\n\nModern field documentation tools replace this entire workflow by enabling the crew to capture and tag damage from the roof in real time. Photos are organized by damage type and roof location. Narratives are generated automatically. Xactimate line items are mapped and exported. Reports are produced on-site the same day.\n\nThis category is critical because it captures revenue that the other categories cannot. Satellite measurement tools do not see hidden damage. Estimating platforms do not capture field evidence. CRMs do not generate supplement documentation. The average supplement recovery of $1,500–$3,200 per job means that a field documentation tool can be the highest-ROI software in your entire stack."
      },
      {
        heading: "Key features to look for in roof estimating software",
        content: "When evaluating any roof estimating software, these features separate tools that save time from tools that actually make you money:\n\n• Accuracy of measurements: For satellite tools, how current is the imagery? Are pitch readings accurate? Does the waste factor match reality? An inaccurate measurement leads to an inaccurate estimate, which leads to either overbidding (losing the job) or underbidding (losing money).\n\n• Integration with Xactimate: If you do any insurance work, your software needs to speak Xactimate's language. Look for the ability to export Xactimate-compatible line items, codes, and pricing. This applies to both initial estimates and supplements.\n\n• Speed of output: How quickly can you go from address to proposal? Or from damage discovery to supplement submission? Time is money in roofing. A tool that saves 30 minutes per estimate across 200 estimates per year gives you back 100 hours.\n\n• Mobile-first design: Roofing happens on roofs, not at desks. Any tool that requires a desktop computer for core functions creates a bottleneck. The best tools let your crew capture data in the field and let project managers review and submit from anywhere.\n\n• Team collaboration: Can your crew in the field and your office staff work from the same data? Real-time sync between field and office eliminates the game of telephone that kills supplement documentation.\n\n• Multilingual support: In many markets, roofing crews speak Spanish as their primary language. Software that supports Spanish voice notes, interface, or input removes friction for the people actually on the roof.\n\n• Professional output: Whether it is a homeowner proposal or an adjuster report, the document that leaves your company represents your brand. Clean, professional PDFs with labeled photos and organized findings build credibility and improve approval rates."
      },
      {
        heading: "Building your roofing software stack",
        content: "Most successful roofing contractors in 2026 use a combination of tools rather than relying on a single platform. A practical stack for an insurance restoration contractor looks like this:\n\n• Satellite measurement (EagleView, Roofr, or GAF QuickMeasure) for remote measurements and initial estimates\n• Xactimate for insurance-format estimating and adjuster communication\n• A CRM (JobNimbus, AccuLynx, or similar) for lead tracking, project management, and invoicing\n• A field documentation and supplement tool for capturing hidden damage and generating supplement reports\n\nRetail contractors who do not work insurance claims can often get by with a satellite measurement tool and a CRM with built-in estimating. But any contractor who touches insurance work, even occasionally, needs the supplement documentation piece.\n\nThe question to ask about each tool in your stack is simple: does it pay for itself? A $50 measurement report that helps you close a $15,000 job is an obvious yes. A $200/month CRM that keeps 20 leads from falling through the cracks is an obvious yes. And a supplement tool that recovers $2,000+ per job on work you are already doing is perhaps the highest-ROI investment of all."
      },
      {
        heading: "Why supplement documentation is the missing piece",
        content: "Of all the categories in roofing software, supplement documentation is the one most contractors are either missing entirely or handling manually. Satellite measurement tools have been mainstream for years. Xactimate has been the industry standard for decades. CRMs have penetrated the market deeply. But the step between tear-off and supplement submission (the actual field documentation) remains the biggest gap in most contractors' technology stack.\n\nThis gap costs money on every single insurance job. When documentation is weak, supplements get denied. When supplements are skipped because the process is too cumbersome, revenue stays on the table. When office staff spend hours writing narratives and building Xactimate line items from blurry text-message photos, overhead increases.\n\nSupplement Snap was built specifically to close this gap. It sits between the field and the adjuster's inbox. Your crew captures damage during tear-off (photos, tags, voice notes) and the platform generates professional supplement documentation with AI-written narratives, Xactimate-ready CSV exports, and branded PDF reports. The entire process happens on-site, same-day, from a mobile device.\n\nFor contractors evaluating their software stack in 2026, adding a dedicated supplement documentation tool is often the single highest-impact change they can make. Not because the other tools are not important (they are), but because supplement revenue is real money on jobs you are already performing, and the only thing standing between you and that revenue is proper documentation."
      },
    ],
  },
  {
    slug: "hail-damage-roof-inspection",
    title: "Hail Damage Roof Inspection: What Gets Missed and How to Document It",
    metaTitle: "Hail Damage Roof Inspection | What Gets Missed & How to Document It",
    metaDescription: "How to inspect a roof for hail damage, what adjusters commonly miss, hidden damage found during tear-off, and how to document everything for successful supplements.",
    publishedDate: "2026-03-22",
    highlight: { label: "Storm Season Revenue", value: "$30,000–$64,000", subtext: "Additional monthly revenue from supplements on 20 hail damage re-roofs" },
    images: {
      1: { src: "/blog/hail-damage-roof-inspection/hail-damaged-shingles.jpg", alt: "Close-up of hail-damaged roof shingles showing circular impact marks and granule loss" },
      3: { src: "/blog/hail-damage-roof-inspection/hidden-hail-damage.jpg", alt: "Cracked pipe boot found during hail damage roof tear-off inspection" },
    },
    sections: [
      {
        heading: "Understanding hail damage on a roof",
        content: "Hail damage to a roof is not always obvious. While large hailstones (1.5 inches and above) can crack shingles, dent metal, and shatter tile in ways that are visible from the ground, the majority of hail damage is subtle. It shows up as bruised or fractured shingle granules, small dents in soft metals, hairline cracks in vent housings, and compromised seals around penetrations.\n\nThe damage matters because it shortens the remaining life of the roof system. A shingle that has lost its granule layer in a hail impact zone will deteriorate faster from UV exposure. A dented gutter may not flow properly. A cracked pipe boot will eventually leak. A dimpled ridge cap may allow moisture underneath.\n\nFor roofing contractors working in storm-prone markets, hail damage roof inspection is one of the most important skills to develop, not just for identifying damage that justifies a claim, but for documenting damage thoroughly enough that the insurance carrier approves the full scope of repair. The initial adjuster inspection catches some of the damage, but it frequently misses components that are harder to see or harder to access. Those missed items become supplement opportunities during and after tear-off."
      },
      {
        heading: "Types of hail damage by roofing component",
        content: "Hail does not just damage shingles. A thorough hail damage roof inspection evaluates every component of the roof system:\n\nAsphalt shingles: Hail impacts displace granules and fracture the fiberglass mat underneath. Fresh hail hits feel soft or spongy when pressed with a finger because the mat is bruised beneath the surface. The exposed area oxidizes faster and leads to premature failure. Damage patterns are typically random across the roof surface but concentrated on slopes facing the storm direction.\n\nRidge caps: Ridge cap shingles sit at the highest point of the roof and take the most direct hits. They are thinner than field shingles in many installations and crack more easily. Damaged ridge caps allow moisture to enter along the ridge line, one of the worst places for a leak.\n\nMetal flashing: Step flashing, counter flashing, valley metal, and chimney caps are all susceptible to denting. While a dent in metal flashing may seem cosmetic, it can compromise the overlap and seal between flashing pieces, creating a path for water intrusion. Galvanized and aluminum flashing dent more visibly than copper.\n\nRoof vents and exhaust caps: Metal roof vents, turbine vents, ridge vents with metal housings, and exhaust caps are common hail targets. Dents in these components can impair function (turbine vents that no longer spin freely) or create openings for moisture.\n\nPipe boots: The rubber collar around plumbing vent pipes is vulnerable to hail impact, especially on older roofs where the rubber has already begun to dry and crack. A hail strike on an aging pipe boot can split it open immediately.\n\nGutters and downspouts: Aluminum gutters dent readily in hail. While gutter damage alone may not warrant a roof claim, documenting it supports the overall evidence of hail impact on the property and strengthens the claim for roof damage.\n\nSkylights: Plastic dome skylights can crack or craze from hail impact. Glass skylights may chip. Even if the skylight still functions, the damage can lead to leaks over time and should be included in the claim.\n\nSiding and paint: While not part of the roof, hail damage to siding, window trim, and painted surfaces on the windward side of the building corroborates the hail event and supports the roof claim."
      },
      {
        heading: "What adjusters commonly miss during initial inspection",
        content: "Insurance adjusters are under pressure to inspect properties quickly. In active storm seasons, a single adjuster may inspect 5–10 properties per day. This time pressure, combined with access limitations, means certain types of hail damage are routinely missed during the initial inspection:\n\n• Steep or hard-to-access slopes: Adjusters may only walk accessible slopes and extrapolate damage to the rest of the roof. Damage patterns from hail vary significantly by slope direction relative to the storm, meaning the slopes the adjuster skipped may have more, or different, damage than the ones inspected.\n\n• Soft metal components: Small dents in flashing, vent caps, and exhaust housings are easy to overlook, especially when the adjuster is focused on counting shingle hits. These components are often not individually listed in the initial estimate.\n\n• Pipe boots and rubber seals: Adjusters may not inspect every pipe boot closely enough to see hairline cracks or impact marks in the rubber collar. On a roof with 6–8 plumbing vents, this can mean hundreds of dollars in missed line items.\n\n• Starter strip and drip edge: Damage at the eave line (where starter shingles and drip edge metal sit) is often missed because these components are partially hidden by the gutter. Hail that dents gutters almost certainly also impacts the drip edge and starter course directly above.\n\n• Ridge cap granule loss: Adjusters may count shingle hits on the field of the roof but not closely examine the ridge caps, which are often the most heavily damaged component due to their exposed position.\n\n• Collateral damage from the hail event: Wind-driven rain during a hailstorm can force water into areas that were already compromised. The resulting moisture damage to underlayment or decking may not be visible until tear-off.\n\nEach of these missed items is a legitimate supplement once the roof is being replaced and the damage can be properly documented."
      },
      {
        heading: "Hidden hail damage found during tear-off",
        content: "The most significant hail damage discoveries happen during tear-off, when the existing roofing materials are removed and the underlying structure is exposed for the first time since the last installation. This is where supplement value concentrates:\n\nBruised or cracked underlayment: Hail impacts can bruise or puncture felt paper and synthetic underlayment beneath the shingles. This damage is completely invisible from the surface but compromises the secondary water barrier. Replacing damaged underlayment is necessary and supplementable.\n\nDecking damage from impact: On older roofs with thinner decking, large hail can fracture or delaminate OSB and plywood sheathing. The impact force transfers through the shingle and underlayment, creating soft spots in the deck that are only discoverable when the crew walks the bare decking during tear-off.\n\nConcealed flashing failures: Hail impact on step flashing can crack the sealant between flashing pieces and the wall surface. Counter flashing may be dislodged from its mortar joint by a combination of hail impact and thermal cycling. These failures are hidden behind existing roofing material and only become visible during tear-off.\n\nMultiple layers concealing older damage: Some roofs have a second layer of shingles installed over the original. The hail damage claim is for the top layer, but once tear-off begins and both layers are removed, the crew may discover that the original layer also had unaddressed damage, or that the decking beneath both layers has deteriorated.\n\nIce and water shield that was never installed: When the existing roof was installed (possibly 15 or 20 years ago), ice and water shield may not have been required or was simply skipped. Current building codes in most jurisdictions require it in valleys, at eaves, and around penetrations. This code-required upgrade is a standard supplement item on hail damage re-roofs.\n\nEvery one of these findings represents additional cost that the original adjuster estimate did not, and could not, include. Documenting them properly is the key to recovering that cost through the supplement process."
      },
      {
        heading: "How to document hail damage for supplements",
        content: "Documentation quality is the single biggest factor in whether a hail damage supplement gets approved or denied. Adjusters need to see clear evidence that the damage exists, that it was concealed, and that the repair is necessary. Here is how to document hail damage findings effectively:\n\nBefore tear-off, document the visible damage:\n\n• Photograph hail hits on shingles with chalk circles marking each impact (the industry standard technique). Include both wide shots showing the pattern across the slope and close-ups of individual hits.\n• Photograph all collateral damage (gutters, vents, flashing, skylights, siding) to establish the severity and direction of the hail event.\n• Note the slope direction (north, south, east, west) for each set of photos. Hail damage patterns correlate with storm direction, and adjusters check for this consistency.\n• Document the size of hail impacts by placing a coin, ruler, or hail gauge next to damage for scale.\n\nDuring tear-off, document the concealed damage:\n\n• Photograph each finding immediately when discovered, before new materials cover it.\n• Take context shots showing where the damage sits on the roof (wide angle) and detail shots showing the damage itself (close-up).\n• Tag each finding by type (decking, flashing, underlayment, pipe boot, ice and water shield) so the supplement can be organized by category.\n• Record measurements: how many sheets of decking, how many linear feet of flashing, how many square feet of underlayment.\n• Add voice notes or written descriptions explaining what was found and why it was not visible before tear-off.\n\nAfter documentation, build the supplement package:\n\n• Write a professional narrative for each finding explaining the damage, its location, how it was discovered, and why repair is necessary.\n• Map each finding to the correct Xactimate line codes with accurate quantities.\n• Compile everything into a clean PDF report with labeled photos, narratives, and a findings summary.\n• Submit to the adjuster the same day, while the documentation is fresh and the evidence is current."
      },
      {
        heading: "Preparing for storm season: systems that scale",
        content: "Hail season is concentrated but intense. When a major storm hits a metro area, restoration contractors may go from 5 jobs in the pipeline to 50 almost overnight. The contractors who recover the most supplement revenue during storm season are not the ones with the biggest crews. They are the ones with systems that scale.\n\nA scalable supplement documentation system has these characteristics:\n\n• Field crews can capture documentation independently without waiting for a project manager to be on-site. The crew lead opens the app, photographs the damage, tags it, and adds notes. No bottleneck.\n\n• Documentation is organized automatically by project, damage type, and roof area. When 30 jobs are running simultaneously, you cannot afford to sort through camera rolls looking for which photos belong to which property.\n\n• Supplement narratives are generated consistently. Writing unique narratives for 30 supplements per week is not sustainable manually. AI-generated narratives from field data ensure every supplement has professional documentation regardless of volume.\n\n• Xactimate exports are automatic. Manually building line items for each supplement is the office bottleneck that kills turnaround time during storm season. Automated mapping from damage type to Xactimate codes eliminates this step.\n\n• Reports can be emailed to adjusters directly from the platform. When you are managing 50 active claims, the ability to generate and send a report in one click instead of assembling PDFs manually saves hours per day.\n\nContractors who handled storm season in 2025 without a system like this know the pain: lost photos, delayed supplements, denied claims, and thousands of dollars in supplement revenue that evaporated because the documentation was not there."
      },
      {
        heading: "Turning hail damage documentation into recovered revenue",
        content: "Every hail damage re-roof has hidden findings. Rotted decking under a failed pipe boot. Flashing that cracked when the hailstone hit it. Underlayment that was punctured by the impact force. Ice and water shield that was never installed in the first place. The damage is there on almost every job. The question is whether it gets documented and submitted.\n\nThe average hail damage supplement recovers $1,500–$3,200 per job. On a busy storm season with 20 insurance re-roofs in a single month, that represents $30,000–$64,000 in additional revenue. Over a full season, proper supplement documentation can add six figures to a restoration contractor's top line.\n\nSupplement Snap was purpose-built for this workflow. Your crew captures hail damage findings during tear-off: photos tagged by damage type and roof location, voice notes in English or Spanish describing what they found. The platform's AI generates professional supplement narratives from the field data. Xactimate-ready CSV exports map each finding to the correct line codes with quantities and pricing. A branded PDF report is generated and emailed to the adjuster the same day.\n\nThe result is a supplement process that scales with storm volume. Whether you are running 5 hail damage jobs or 50, every finding gets documented, every supplement gets submitted, and every dollar of hidden damage gets recovered. That is the difference between a storm season that stretches your operation thin and one that drives your most profitable quarter of the year."
      },
    ],
  },
  {
    slug: "roofing-software-comparison",
    title: "Roofing Software Comparison: CRM vs. Estimating vs. Supplement Tools",
    metaTitle: "Roofing Software Comparison: CRM vs. Estimating vs. Supplement Tools",
    metaDescription: "Compare the three categories of roofing software: CRM, estimating, and supplement tools. Learn what each does, when you need each one, and where the gaps are costing you money.",
    publishedDate: "2026-03-23",
    highlight: { label: "Revenue Gap", value: "$20,000–$30,000/mo", subtext: "Left on the table by contractors with no supplement tool (10 jobs/month)" },
    images: {
      3: { src: "/blog/roofing-software-comparison/supplement-snap-dashboard.png", alt: "Supplement Snap dashboard showing roofing projects, capture counts, claim pipeline, and activity stats" },
    },
    sections: [
      {
        heading: "The three categories of roofing software",
        content: "If you run a roofing company in 2026, you have more software options than ever. But most of it falls into three distinct categories, each solving a different part of your business:\n\n• CRM (Customer Relationship Management): manages your leads, appointments, follow-ups, and sales pipeline\n• Estimating software: helps you measure roofs, calculate materials, and produce quotes\n• Supplement tools: document hidden damage found during tear-off and generate insurance supplement reports\n\nEach category solves a real problem. But most roofing contractors invest heavily in one or two of these categories while completely ignoring the third, and that blind spot is costing them thousands of dollars per job.\n\nUnderstanding what each type of software actually does, where they overlap, and where the gaps are is the first step to building a tech stack that doesn't leave money on the table."
      },
      {
        heading: "CRM software: managing leads and customers",
        content: "Roofing CRMs are the most widely adopted category of software in the industry. Popular options include JobNimbus, AccuLynx, Leap, RoofLink, and HailTrace. These platforms focus on the sales and project management side of your business.\n\nWhat a roofing CRM typically does:\n\n• Tracks leads from first contact through closed sale\n• Manages appointments and follow-ups with automated reminders\n• Stores customer information, property details, and insurance claim data\n• Provides a pipeline view showing where each job stands\n• Handles contracts, change orders, and digital signatures\n• Coordinates production scheduling and crew assignments\n• Sends automated text and email updates to homeowners\n• Generates reports on close rates, revenue, and sales rep performance\n\nA good CRM is essential once you're doing more than a handful of jobs per month. Without one, leads fall through the cracks, follow-ups get missed, and you lose track of where each project stands. Most established roofing companies already have a CRM, and for good reason. It directly impacts how many leads you convert into signed contracts.\n\nHowever, a CRM does not help you recover more money on the jobs you've already sold. It manages the customer relationship, not the technical documentation needed to maximize claim value."
      },
      {
        heading: "Estimating software: measuring and quoting",
        content: "Estimating tools help you produce accurate measurements and material calculations before the job starts. The most common tools in this space include EagleView, GAF QuickMeasure, Hover, RoofSnap, and iRoofing.\n\nWhat estimating software typically does:\n\n• Generates roof measurements from satellite imagery or drone photos\n• Calculates squares, waste factor, ridge length, valley length, hip length, and eave length\n• Produces material lists for ordering\n• Creates professional estimates and proposals for homeowners\n• Integrates with supplier pricing for accurate material costs\n• Some tools include labor cost calculators based on roof complexity\n\nEstimating software saves significant time compared to hand-measuring every roof, and the accuracy of satellite measurement tools has improved dramatically. For insurance work, tools like EagleView provide reports that adjusters recognize and accept.\n\nThe limitation of estimating software is that it captures the roof as it appears from the outside, before tear-off. It tells you the dimensions, pitch, and features of the roof. It does not capture what's hiding underneath the shingles. Rotted decking, corroded flashing, missing ice and water shield, deteriorated pipe boots. None of this shows up in a satellite measurement or a pre-job inspection."
      },
      {
        heading: "Supplement tools: capturing hidden revenue",
        content: "Supplement tools are the newest and least adopted category of roofing software. They focus on a specific problem: documenting concealed damage found during tear-off and converting that documentation into insurance supplement requests.\n\nWhat a supplement tool typically does:\n\n• Enables field crews to capture and tag damage photos during tear-off\n• Records voice notes and field observations in real time\n• Generates professional supplement narratives explaining what was found\n• Maps damage to Xactimate line codes with correct quantities and pricing\n• Exports Xactimate-compatible CSV files for adjuster submission\n• Produces PDF reports with photos, narratives, and findings summaries\n• Tracks supplement status from submission through approval\n\nThe core value proposition is simple: on a typical insurance tear-off, your crew discovers $1,500–$3,200 in hidden damage that wasn't included in the original adjuster estimate. A supplement tool ensures that damage gets documented properly and submitted to the carrier for additional payment.\n\nWithout a supplement tool, that documentation process relies on crew members texting blurry photos to the office, someone writing up the supplement days later from incomplete information, and hoping the adjuster approves it despite the weak evidence."
      },
      {
        heading: "The gap most contractors don't see",
        content: "Here's the pattern across the roofing industry: almost every established contractor has a CRM. Most have some form of estimating tool. But very few have a dedicated supplement tool.\n\nThis creates a predictable revenue leak. Consider a typical insurance job:\n\n• The CRM tracks the lead from door knock to signed contract, working perfectly\n• The estimating tool produces accurate measurements and a material order, working perfectly\n• The crew tears off the roof and finds rotted decking, failed flashing, and missing ice and water shield\n• Nobody has a system to document the hidden damage properly\n• The supplement either doesn't happen, or it gets submitted with a blurry photo and a one-line description\n• The adjuster denies it or the office never bothers submitting it\n• $2,000+ in legitimate, recoverable revenue disappears\n\nThis happens job after job, month after month. A contractor doing 10 insurance roofs per month might be leaving $20,000–$30,000 on the table every month, not because the damage isn't there, but because they don't have a system to capture it.\n\nThe irony is that contractors will spend $300–$500/month on a CRM to close more deals but won't invest in a tool that recovers $2,000+ per job on deals they've already closed. The ROI on supplement documentation is dramatically higher than almost any other software investment a roofing company can make."
      },
      {
        heading: "Overlap and integration between the three categories",
        content: "There's some overlap between these categories, but less than you might expect:\n\n• Some CRMs include basic estimating features, but they rarely match the accuracy of dedicated measurement tools\n• Some estimating platforms include CRM-like features for managing jobs, but they lack the depth of a dedicated CRM\n• A few CRMs have started adding 'supplement tracking' features, but these are typically just status fields. They don't help with the actual documentation, narrative generation, or Xactimate export\n\nThe reality is that each category solves a fundamentally different problem at a different stage of the job:\n\n• CRM: pre-sale through project completion (customer-facing)\n• Estimating: pre-job measurement and quoting (planning-focused)\n• Supplement: during and after tear-off (revenue recovery)\n\nThe most productive roofing operations use all three categories in combination. The CRM manages the customer relationship and project pipeline. The estimating tool produces accurate measurements and material orders. The supplement tool captures hidden damage during tear-off and recovers additional revenue.\n\nWhen evaluating any roofing software, ask yourself: does this tool help me close more deals, plan jobs more accurately, or recover more revenue from jobs I'm already doing? If you're strong on the first two but have nothing for the third, you've identified your biggest opportunity."
      },
      {
        heading: "Why supplement documentation should be your next investment",
        content: "If you already have a CRM and an estimating tool, the highest-ROI addition to your tech stack is a supplement documentation platform. The math is straightforward:\n\n• Average supplement recovery: $1,500–$3,200 per job\n• Percentage of insurance tear-offs with supplementable damage: 70–90%\n• Cost of a supplement tool: $99–$299/month\n• Breakeven: one approved supplement pays for months of the software\n\nThe key is choosing a tool that actually solves the documentation problem, not just a status tracker. You need something your crew can use on the roof during tear-off to capture photos, tag damage types, record voice notes, and generate professional reports before they leave the job site.\n\nSupplement Snap was built specifically for this workflow. Your crew captures damage findings from the roof with tagged photos and voice notes. The AI generates professional supplement narratives. You export Xactimate-ready CSV files and email a PDF report to the adjuster the same day. It fills the gap that your CRM and estimating tool were never designed to address, and it pays for itself on the very first job.\n\nStop investing only in software that helps you win jobs. Start investing in software that helps you get paid fully for the jobs you've already won."
      },
    ],
  },
  {
    slug: "xactimate-roof-estimate-supplements",
    title: "How to Build an Xactimate Roof Estimate for Insurance Supplements",
    metaTitle: "How to Build an Xactimate Roof Estimate for Supplements | Contractor Guide",
    metaDescription: "Learn how to build an Xactimate roof estimate for insurance supplements. Covers key line codes like RFG SHTHN, RFG FLSH, RFG I&WS, pricing benchmarks, and common mistakes that get supplements denied.",
    publishedDate: "2026-03-24",
    highlight: { label: "Sample Supplement Total", value: "$1,438", subtext: "Typical supplement value using standard Xactimate codes + O&P" },
    images: {
      0: { src: "/blog/xactimate-roof-estimate-supplements/xactimate.gif", alt: "Xactimate roofing estimate software interface showing line codes and pricing for insurance claims" },
      3: { src: "/blog/xactimate-roof-estimate-supplements/supplement-snap-export.png", alt: "Supplement Snap project report showing $1,300 estimated supplement value with Xactimate line codes and CSV export option" },
    },
    sections: [
      {
        heading: "What is Xactimate and why does it matter for roofing supplements?",
        content: "Xactimate is the insurance industry's standard software for estimating property damage repair costs. Developed by Verisk, it is used by the vast majority of insurance carriers, independent adjusters, and third-party administrators to write estimates for roofing claims. When an adjuster inspects storm damage on a roof, they enter their findings into Xactimate using standardized line codes, unit prices, and quantities to produce the claim estimate.\n\nFor roofing contractors, Xactimate matters because it is the language adjusters speak. When you submit a supplement (a request for additional payment for hidden damage found during tear-off), the adjuster needs to process that request within Xactimate. If your supplement is written in Xactimate's format with the correct line codes and pricing, the adjuster can review and approve it quickly. If your supplement is a vague description with a few photos and no reference to Xactimate codes, the adjuster has to do extra work to translate your findings, which often results in lower approvals, longer processing times, or outright denials.\n\nYou don't need to own an Xactimate license to submit supplements in Xactimate format. What you need is knowledge of the relevant line codes, current unit pricing, and how to structure your findings so the adjuster can process them efficiently."
      },
      {
        heading: "How adjusters use Xactimate to write roof estimates",
        content: "Understanding how adjusters use Xactimate helps you write better supplements. When an adjuster inspects a roof for storm damage, they follow a systematic process:\n\n1. They measure the roof or use a measurement report (EagleView, Hover, etc.)\n2. They inspect the roof surface for hail impacts, wind damage, or other covered perils\n3. They enter their findings into Xactimate as line items, each with a specific code, quantity, and unit price\n4. Xactimate calculates overhead and profit (O&P) on top of the line items, typically 10% overhead and 10% profit\n5. The software generates a detailed estimate that becomes the basis for the claim payment\n\nThe adjuster's Xactimate estimate only includes what they could see during their inspection. They walked the roof, noted visible damage, and wrote line items for the repairs they observed. They did not tear off the shingles. They did not inspect the decking underneath. They did not check the condition of the flashing behind the step metal or the integrity of the ice and water shield in the valleys.\n\nThis is exactly why supplements exist. The adjuster's estimate is based on a surface inspection. Your supplement adds the concealed damage that only becomes visible during tear-off. The more closely your supplement mirrors the adjuster's Xactimate format, the easier it is for them to approve the additional items."
      },
      {
        heading: "Essential Xactimate line codes for roofing supplements",
        content: "Every supplement item maps to a specific Xactimate line code. Here are the most common codes you'll use, along with current national average pricing. Note that Xactimate prices vary by region and are updated quarterly, so always check current pricing for your area.\n\n• RFG SHTHN — Sheathing, plywood/OSB, remove and replace. The code for replacing rotted or damaged roof decking. Unit: SF (square feet). National average: approximately $2.18/SF. A standard 4x8 sheet is 32 SF, so one sheet runs roughly $70. This is the single most common supplement line item.\n\n• RFG FLSH — Flashing, step/counter, aluminum, remove and replace. Used for corroded or damaged step flashing at chimneys, walls, and dormers. Unit: LF (linear feet). National average: approximately $8.75/LF.\n\n• RFG I&WS — Ice and water shield membrane, install. Used when ice and water shield is missing in code-required areas or has deteriorated. Unit: SF. National average: approximately $1.85/SF. This item often requires a building code reference in your narrative.\n\n• RFG VENT — Roof vent, pipe jack/boot, remove and replace. Used for cracked or deteriorated pipe boots. Unit: EA (each). National average: approximately $85/EA.\n\n• RFG DRIP — Drip edge, aluminum, remove and replace. Used when drip edge is missing or damaged. Unit: LF. National average: approximately $4.25/LF.\n\n• RFG TEAR — Remove additional layer of roofing. Used when a second or third layer is discovered during tear-off. Unit: SQ (100 SF). National average: approximately $45/SQ."
      },
      {
        heading: "Building a supplement estimate in Xactimate format",
        content: "You don't need to own Xactimate to submit a professional supplement. What you need is a structured document that mirrors the Xactimate format so the adjuster can process it quickly.\n\nFor each finding, include these elements:\n\n• Line code: the Xactimate code (e.g., RFG SHTHN)\n• Description: the standard Xactimate description (e.g., 'Sheathing - plywood/OSB - R&R')\n• Quantity: the measured amount in the correct unit (e.g., 96 SF)\n• Unit: SF, LF, EA, or SQ as appropriate\n• Unit price: current Xactimate pricing for your region\n• Line total: quantity multiplied by unit price\n\nHere's what a sample supplement estimate looks like:\n\nRFG SHTHN — Sheathing, plywood/OSB, R&R — 96 SF × $2.18 = $209.28\nRFG FLSH — Step flashing, aluminum, R&R — 24 LF × $8.75 = $210.00\nRFG I&WS — Ice & water shield, install — 180 SF × $1.85 = $333.00\nRFG VENT — Pipe boot, R&R — 3 EA × $85.00 = $255.00\nRFG DRIP — Drip edge, aluminum, R&R — 45 LF × $4.25 = $191.25\nSubtotal: $1,198.53\nO&P (20%): $239.71\nTotal Supplement: $1,438.24\n\nThis level of specificity makes it easy for the adjuster to review and approve. Compare this to a supplement that just says 'additional decking and flashing needed - $1,500.' Which version gets approved faster?"
      },
      {
        heading: "Pricing benchmarks and regional variations",
        content: "Xactimate pricing is not fixed nationally. Verisk updates pricing quarterly based on regional labor rates and material costs. Prices are set by zip code, so a contractor in Dallas will see different unit prices than one in Minneapolis.\n\nApproximate national average ranges for the most common supplement items (as of early 2026):\n\n• RFG SHTHN (decking): $2.00–$2.50/SF depending on region\n• RFG FLSH (step flashing): $7.50–$10.00/LF\n• RFG I&WS (ice & water shield): $1.60–$2.20/SF\n• RFG VENT (pipe boot): $75–$100/EA\n• RFG DRIP (drip edge): $3.75–$5.00/LF\n• RFG TEAR (additional layer removal): $38–$55/SQ\n\nWhen submitting a supplement, use the pricing for your specific region. If you price above the Xactimate rate for your zip code, the adjuster will adjust it down. If you price below, you're leaving money on the table.\n\nAlso keep in mind that overhead and profit (O&P) is a separate discussion. Most insurance claims include 10% overhead and 10% profit on top of the line item totals. If the original claim includes O&P, your supplement should also include it."
      },
      {
        heading: "Mistakes that get Xactimate supplements denied",
        content: "Even with the right line codes and pricing, supplements get denied for avoidable mistakes:\n\n• Wrong quantities: Claiming 5 sheets of decking when your photos only show 2 damaged areas. Adjusters cross-reference your quantities against the photos. Always measure carefully and photograph every area you're claiming.\n\n• Missing documentation: Submitting line items without supporting photos or a narrative. The adjuster needs to justify the additional payment to their supervisor. Give them the evidence they need.\n\n• Using incorrect codes: Selecting the wrong Xactimate code changes the unit price and signals you don't know what you're doing. Know your codes.\n\n• Not explaining concealment: Your narrative must clearly state that the damage was concealed beneath existing roofing materials and was discovered during tear-off operations. Without this, the adjuster may argue it should have been caught during the initial inspection.\n\n• Late submission: Submitting a supplement three weeks after tear-off raises questions. Why did it take so long? Has the damage been covered by new materials? Submit the same day whenever possible.\n\n• Inflated pricing: Submitting prices above the current Xactimate rate for your region signals you're padding the estimate and makes the adjuster scrutinize every line item."
      },
      {
        heading: "How Supplement Snap generates Xactimate-ready exports",
        content: "Building an Xactimate-formatted supplement manually for every job takes time: looking up line codes, checking pricing, formatting the estimate, writing the narrative, organizing photos. It's the kind of work that either falls on your office staff or doesn't get done at all.\n\nSupplement Snap automates this process. Your crew captures damage findings during tear-off: photos tagged by damage type, roof area selected, and a voice note describing what they found. Voice notes work in any language, so Spanish-speaking crews describe findings naturally and the system auto-translates to English.\n\nFrom that field data, Supplement Snap automatically maps each finding to the correct Xactimate line codes with sub-items. A 'Decking' finding generates RFG SHTHN with the measured square footage. A 'Flashing' finding generates RFG FLSH with the linear footage. Each line item includes current unit pricing.\n\nYou can export the complete supplement as an Xactimate-compatible CSV that the adjuster can import directly into their system. You also get a professional PDF report with photos, AI-generated narratives, a findings summary, and the complete line item breakdown, ready to email to the adjuster the same day.\n\nThe result is a supplement that speaks the adjuster's language, includes the evidence they need, and arrives the same day the damage was found. That combination (correct format, strong documentation, fast submission) is what gets supplements approved."
      },
    ],
  },
  {
    slug: "roof-replacement-estimate-vs-final-cost",
    title: "Roof Replacement Estimate vs. Final Cost: Why Supplements Close the Gap",
    metaTitle: "Roof Replacement Estimate vs. Final Cost: Why Supplements Close the Gap",
    metaDescription: "Why the initial roof replacement estimate is always lower than the final cost, what gets missed in adjuster inspections, and how supplements bridge the gap between estimate and actual cost.",
    publishedDate: "2026-03-25",
    highlight: { label: "Annual Revenue Left Behind", value: "$192,000–$288,000", subtext: "For a contractor doing 8-12 insurance roofs/month without supplements" },
    images: {
      5: { src: "/blog/roof-replacement-estimate-vs-final-cost/supplement-snap-project-value.png", alt: "Supplement Snap app showing project with $1,300 estimated supplement value and damage capture workflow" },
    },
    sections: [
      {
        heading: "Why the initial estimate is always lower than the final cost",
        content: "If you've been in the roofing business for any length of time, you already know this: the insurance adjuster's initial estimate almost never covers the full cost of replacing the roof. The estimate comes in at $9,500, but by the time your crew finishes the job, the actual cost is $12,000 or more.\n\nThis gap between the initial estimate and the final cost isn't a mistake, and it isn't the adjuster being dishonest. It's a structural reality of how insurance roof inspections work. The adjuster inspects the roof from the surface. They walk it, note visible damage, and write an estimate based on what they can see. They don't tear off the shingles. They don't inspect the decking underneath. They don't check whether the flashing behind the chimney has corroded or whether the ice and water shield in the valleys has deteriorated.\n\nThe initial estimate covers the visible scope. The actual job includes everything hidden underneath. That's where the gap comes from, and it's why supplements exist: to close it."
      },
      {
        heading: "What gets missed in adjuster inspections",
        content: "Insurance adjusters are not trying to shortchange you. They're writing an estimate based on a surface-level inspection, and there's a long list of items that cannot be assessed without removing the existing roofing materials.\n\nThe most commonly missed items include:\n\n• Rotted decking: Plywood or OSB that has deteriorated from years of moisture penetration. The shingles on top may look fine, but the wood underneath is soft, spongy, or crumbling. On average, contractors find 2–4 sheets of damaged decking per job, adding $140–$280 to the actual cost.\n\n• Failed step and counter flashing: Metal flashing at chimneys, walls, and dormers corrodes over time behind the shingles, invisible from the surface. Replacing flashing at a single chimney can add $200–$500.\n\n• Missing or deteriorated ice and water shield: Many older roofs were installed before current building codes required ice and water shield in valleys, at eaves, and around penetrations. This can add $200–$500 depending on coverage area.\n\n• Cracked pipe boots: Rubber gaskets around plumbing vents crack and split with age. At $85 per boot with 2–5 boots per roof, this adds $170–$425.\n\n• Additional layers of roofing: The original estimate may have been written for a single-layer tear-off. Additional layer removal on a 25-square roof adds $950–$1,375.\n\n• Missing drip edge: Older homes often lack drip edge entirely. Full perimeter replacement runs $150–$400."
      },
      {
        heading: "The real numbers: estimate vs. actual cost",
        content: "Let's put real numbers to this. Consider a typical 25-square residential roof replacement on a home built in the early 2000s with storm damage.\n\nThe adjuster's initial estimate:\n\n• Tear-off (1 layer): $1,125\n• New architectural shingles: $4,500\n• Felt underlayment: $625\n• Ridge cap: $375\n• Pipe boot replacement (1 visible): $85\n• Haul debris: $562\n• O&P (20%): $1,454\n• Total initial estimate: $8,726\n\nWhat the crew finds during tear-off:\n\n• 3 sheets of rotted decking along the eave: $209\n• Corroded step flashing at the chimney (24 LF): $210\n• Missing ice and water shield in both valleys (180 SF): $333\n• 2 additional cracked pipe boots: $170\n• Missing drip edge along the rakes (45 LF): $191\n• O&P on additional items (20%): $223\n• Total hidden damage: $1,336\n\nThe actual cost is now $10,062, a gap of $1,336. On more complex roofs with multiple penetrations, steep pitches, or older construction, this gap can easily reach $2,500–$4,000.\n\nMultiply that across every insurance job you do. If you're running 8–12 insurance roofs per month and the average gap is $2,000, that's $192,000–$288,000 per year in work you're doing but not getting paid for, unless you submit supplements."
      },
      {
        heading: "How supplements bridge the gap",
        content: "A supplement is the formal mechanism for closing the gap between the initial estimate and the actual cost. It's a documented request to the insurance carrier saying: your adjuster estimated the visible damage accurately, but our crew found additional concealed damage during tear-off that needs to be covered.\n\nA well-documented supplement includes:\n\n• Photographs of each concealed damage finding, taken during tear-off before new materials cover it up\n• A professional narrative explaining what was found, where it was located, why it was concealed, and why the repair is necessary\n• Xactimate line items with the correct codes, quantities, and current pricing\n• Building code references where applicable\n\nWhen submitted properly, supplements have a high approval rate. Adjusters expect them because they know their surface inspection doesn't catch everything. The key word is 'properly.' A supplement with clear photos, a detailed narrative, and accurate Xactimate formatting gets approved. A supplement with a blurry photo and 'found some bad decking' gets denied.\n\nThe difference between contractors who consistently recover supplement revenue and those who don't comes down to documentation quality and submission speed."
      },
      {
        heading: "Real scenarios: estimate vs. final with supplements",
        content: "Three scenarios based on common job types:\n\nScenario 1: Simple ranch home, 20 squares\n• Initial estimate: $7,200\n• Hidden damage: 2 sheets rotted decking, 2 cracked pipe boots, missing drip edge on front eave\n• Supplement value: $680 + O&P = $816\n• Final cost with supplement: $8,016\n• Revenue recovered: 11% above initial estimate\n\nScenario 2: Two-story colonial, 30 squares, chimney and dormers\n• Initial estimate: $12,800\n• Hidden damage: 4 sheets rotted decking, corroded step flashing at chimney and 2 dormers, missing ice and water shield in valleys, 3 cracked pipe boots\n• Supplement value: $2,180 + O&P = $2,616\n• Final cost with supplement: $15,416\n• Revenue recovered: 20% above initial estimate\n\nScenario 3: Complex multi-level, 35 squares, multiple layers\n• Initial estimate: $14,500\n• Hidden damage: 6 sheets rotted decking, second layer of shingles, deteriorated ice and water shield, corroded flashing at 2 walls, 4 cracked pipe boots, missing drip edge full perimeter\n• Supplement value: $4,340 + O&P = $5,208\n• Final cost with supplement: $19,708\n• Revenue recovered: 36% above initial estimate\n\nIn every scenario, the supplement represents real work the contractor has to do regardless. The only question is whether they get paid for it."
      },
      {
        heading: "How to systematically capture the difference on every job",
        content: "Recovering supplement revenue can't happen only when someone in the office remembers. It needs to be a systematic part of your production workflow.\n\nHere's what a systematic supplement process looks like:\n\n• Train every crew to recognize and document hidden damage during tear-off: rotted decking, corroded flashing, deteriorated pipe boots\n• Establish a documentation protocol: when damage is found, stop and photograph it before covering it with new materials. Wide-angle context shot and close-up detail shot.\n• Use a tool that makes documentation fast and easy. If it takes 20 minutes per finding, your crew won't do it. If it takes 30 seconds to snap a photo and tag the damage type, they'll do it every time.\n• Generate the supplement report the same day. Don't let findings sit in someone's camera roll for a week.\n• Track supplement status for every job: submitted, pending, approved, denied. Follow up weekly.\n\nThe contractors who build this into their standard workflow recover supplements on 70–90% of their insurance jobs. Those who treat it as an afterthought recover on maybe 10–20%."
      },
      {
        heading: "Close the gap with Supplement Snap",
        content: "Supplement Snap was built to make this systematic approach effortless. During tear-off, the crew opens the app and captures each finding: a photo tagged with the damage type and roof area, plus an optional voice note. Voice notes work in any language. Spanish-speaking crews describe findings in Spanish and the system auto-translates to English.\n\nFrom that field data, Supplement Snap generates everything you need:\n\n• A professional supplement narrative for each finding, written in the language adjusters expect\n• Xactimate line items with correct codes, quantities, and current regional pricing\n• An Xactimate-compatible CSV export the adjuster can import directly\n• A branded PDF report with photos, narratives, findings summary, and line items, ready to email\n\nThe entire process from capturing damage on the roof to emailing a complete supplement report takes minutes, not days. Your crew does what they're already doing (finding damage during tear-off) and Supplement Snap turns those findings into revenue.\n\nThe gap between the initial estimate and the final cost will always exist. The question is whether you have a system to capture it. With Supplement Snap, every hidden finding becomes a documented, submitted, trackable supplement, and you get paid for the work you're actually doing."
      },
    ],
  },
]

/* ── Rich content renderer ── */
function RichContent({ text }: { text: string }) {
  const paragraphs = text.split("\n\n")

  return (
    <div className="mt-3 space-y-4">
      {paragraphs.map((p, pi) => {
        const trimmed = p.trim()

        // Numbered list block (lines starting with 1. 2. 3. etc.)
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()))
          return (
            <div key={pi} className="space-y-4 my-6">
              {items.map((item, ii) => {
                const match = item.match(/^(\d+)\.\s(.*)$/)
                if (!match) return null
                const [, num, rest] = match
                const colonIdx = rest.indexOf(":")
                const hasColon = colonIdx > 0 && colonIdx < 60
                return (
                  <div key={ii} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                      {num}
                    </div>
                    <p className="text-base leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{rest.slice(0, colonIdx)}</span>{rest.slice(colonIdx)}</>
                      ) : rest}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        }

        // Bullet list block (lines starting with •)
        if (trimmed.startsWith("•")) {
          const items = trimmed.split("\n").filter((l) => l.trim().startsWith("•"))
          return (
            <div key={pi} className="space-y-3 my-4">
              {items.map((item, ii) => {
                const content = item.replace(/^•\s*/, "").trim()
                const colonIdx = content.indexOf(":")
                const hasColon = colonIdx > 0 && colonIdx < 80
                // Detect if this is a stat/money item
                const isStat = /^\$[\d,]+/.test(content) || /^\d+[–-]\d+%/.test(content)
                return (
                  <div key={ii} className={`flex items-start gap-3 ${isStat ? "rounded-lg border border-zinc-100 bg-zinc-50 p-3" : ""}`}>
                    <svg className="mt-1 h-4 w-4 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-base leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{content.slice(0, colonIdx)}</span>{content.slice(colonIdx)}</>
                      ) : content}
                    </p>
                  </div>
                )
              })}
            </div>
          )
        }

        // Stat callout (single line with $ or % that looks like a key metric)
        if (/^(Average|Total|Additional|Subtotal|O&P|Breakeven)/.test(trimmed) && /\$/.test(trimmed)) {
          return (
            <div key={pi} className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 my-4">
              <p className="text-base font-semibold text-indigo-900">{trimmed}</p>
            </div>
          )
        }

        // Xactimate code line (starts with RFG)
        if (/^RFG\s/.test(trimmed) || (trimmed.includes("RFG ") && trimmed.includes("—"))) {
          const lines = trimmed.split("\n")
          return (
            <div key={pi} className="space-y-2 my-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              {lines.map((line, li) => (
                <p key={li} className="text-sm font-mono text-zinc-700">{line}</p>
              ))}
            </div>
          )
        }

        // Scenario blocks
        if (/^Scenario \d/.test(trimmed)) {
          const lines = trimmed.split("\n")
          const title = lines[0]
          const rest = lines.slice(1)
          return (
            <div key={pi} className="rounded-xl border border-zinc-200 bg-white p-5 my-4 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">{title}</h4>
              <div className="mt-2 space-y-1">
                {rest.map((line, li) => {
                  const l = line.replace(/^•\s*/, "").trim()
                  const colonIdx = l.indexOf(":")
                  const hasColon = colonIdx > 0 && colonIdx < 60
                  return (
                    <p key={li} className="text-sm leading-relaxed text-zinc-600">
                      {hasColon ? (
                        <><span className="font-semibold text-zinc-900">{l.slice(0, colonIdx)}</span>{l.slice(colonIdx)}</>
                      ) : l}
                    </p>
                  )
                })}
              </div>
            </div>
          )
        }

        // Regular paragraph
        return (
          <p key={pi} className="text-base leading-relaxed text-zinc-600">{trimmed}</p>
        )
      })}
    </div>
  )
}

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: article.publishedDate,
      url: `https://supplementsnap.io/blog/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
    },
  }
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return null

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    author: {
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
    },
    publisher: {
      "@type": "Organization",
      name: "Supplement Snap",
      url: "https://supplementsnap.io",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://supplementsnap.io/blog/${article.slug}`,
    },
  }

  return (
    <div className="bg-white text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <nav className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</div>
            <span className="text-lg font-bold tracking-tight">Supplement Snap</span>
          </Link>
          <NavLinks />
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/blog" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">&larr; All Articles</Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-sm text-zinc-400">Published {new Date(article.publishedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        {article.highlight && (
          <div className="mb-12 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
            <div className="px-6 py-6 sm:px-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{article.highlight.label}</p>
              <p className="mt-2 text-4xl font-extrabold text-zinc-900 sm:text-5xl">{article.highlight.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{article.highlight.subtext}</p>
            </div>
          </div>
        )}

        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">{section.heading}</h2>
              <RichContent text={section.content} />
              {article.images?.[i] && (
                <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
                  <img
                    src={article.images[i].src}
                    alt={article.images[i].alt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <h3 className="text-lg font-bold text-zinc-900">Ready to streamline your supplement process?</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Supplement Snap helps your crew capture hidden damage during tear-off and generate adjuster-ready reports in minutes.
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo" className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
              Book a Free Walkthrough
            </Link>
            <Link href="/pricing" className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              See Pricing
            </Link>
          </div>
        </div>

        {/* Related articles */}
        <div className="mt-16 border-t border-zinc-100 pt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">More Articles</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.slug !== slug).slice(0, 4).map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm">
                <h4 className="text-sm font-semibold text-zinc-900">{a.title}</h4>
                <p className="mt-1 text-xs text-indigo-600">Read more &rarr;</p>
              </Link>
            ))}
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  )
}
