import { PrismaClient, type Prisma } from "@prisma/client";
import { CaseContentSchema, type CaseContent } from "../src/lib/schemas";

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

const prisma = new PrismaClient();

const profitabilityCase: CaseContent = {
  title: "Downtown Fitness Co. - Profit Decline",
  source: "Hand-written seed case",
  industry: "Fitness / Consumer Services",
  caseType: "profitability",
  difficulty: "medium",
  prompt:
    "Our client, Downtown Fitness Co., operates a chain of gyms in a mid-sized U.S. city. Profits have declined roughly 30% over the last two years despite stable overall membership numbers. The CEO has asked us to figure out why, and what to do about it.",
  clarifying_qa_bank: [
    {
      question_pattern: "what does the client do / what's the business",
      answer:
        "Downtown Fitness Co. operates 8 gym locations in the city, offering memberships, personal training sessions, and a small retail line (apparel and supplements).",
    },
    {
      question_pattern: "what's the timeframe for the decline",
      answer:
        "The decline happened over the last 2 fiscal years. The CEO wants a diagnosis and a plan to act on within this fiscal year.",
    },
    {
      question_pattern: "what's the client's goal / what does success look like",
      answer: "Return profit back to its level from 2 years ago, ideally within 12 months.",
    },
    {
      question_pattern: "what does the competitive landscape look like",
      answer:
        "Two new budget/low-cost gym chains have entered the city within the last 2 years. The overall gym-going population in the city has stayed roughly flat.",
    },
    {
      question_pattern: "has pricing changed",
      answer: "Standard membership pricing has stayed flat for the last 3 years.",
    },
    {
      question_pattern: "have costs changed / any major cost changes",
      answer:
        "Rent and equipment leasing costs have both increased over the period, and staff turnover has also increased.",
    },
  ],
  framework_guidance:
    "A strong structure separates revenue drivers (membership volume, pricing/mix, ancillary revenue like personal training and retail) from cost drivers (fixed costs like rent and equipment leasing, variable costs like staff wages and utilities), and explicitly weighs external factors (new low-cost competitors entering) against internal factors (cost creep, membership mix shift). The candidate should hypothesize that total revenue is roughly flat-to-slightly-down while costs have risen meaningfully, and plan to dig into both the cost structure (rent escalation, staffing) and a possible revenue mix shift (e.g., growth in discounted membership tiers) rather than assuming the new competitors are the sole cause.",
  exhibits: [
    {
      id: "rev-breakdown",
      trigger_condition:
        "Candidate asks for a breakdown of revenue by stream (e.g. memberships vs personal training vs retail) over the period.",
      exhibit_type: "table",
      exhibit_content:
        "| Revenue Stream | 2 Years Ago | Current Year |\n|---|---|---|\n| Memberships | $4.2M | $4.1M |\n| Personal Training | $1.3M | $1.2M |\n| Retail | $0.5M | $0.5M |\n| **Total** | **$6.0M** | **$5.8M** |",
      order: 1,
    },
    {
      id: "cost-breakdown",
      trigger_condition: "Candidate asks for a breakdown of costs by category over the period.",
      exhibit_type: "table",
      exhibit_content:
        "| Cost Category | 2 Years Ago | Current Year |\n|---|---|---|\n| Rent & Facilities | $1.8M | $2.0M |\n| Staff Wages | $1.6M | $1.75M |\n| Equipment Leasing | $0.6M | $0.65M |\n| Utilities & Other | $0.5M | $0.35M |\n| **Total** | **$4.5M** | **$4.75M** |",
      order: 2,
    },
    {
      id: "membership-mix",
      trigger_condition:
        "Candidate asks about membership counts, churn, or the composition/mix of membership tiers.",
      exhibit_type: "text",
      exhibit_content:
        "Total active memberships have stayed roughly flat at approximately 12,000 members across both years. However, the mix has shifted: in the current year, 35% of members are on a discounted 'off-peak' membership tier (up from 15% two years ago), priced about 30% lower than the standard membership.",
      order: 3,
    },
  ],
  math_steps: [
    {
      id: "profit-y1",
      description: "Compute total profit from 2 years ago (revenue minus costs)",
      expected_value: "$1.5M",
      unit: "USD",
    },
    {
      id: "profit-y3",
      description: "Compute total profit for the current year (revenue minus costs)",
      expected_value: "$1.05M",
      unit: "USD",
    },
    {
      id: "profit-decline-pct",
      description: "Compute the percentage decline in profit",
      expected_value: "30%",
      depends_on: ["profit-y1", "profit-y3"],
    },
    {
      id: "revenue-change-pct",
      description: "Compute the percentage change in total revenue",
      expected_value: "-3.3%",
    },
    {
      id: "cost-change-pct",
      description: "Compute the percentage change in total costs",
      expected_value: "+5.6%",
    },
    {
      id: "driver-attribution",
      description:
        "Compare the dollar impact of cost growth vs revenue decline to identify the larger driver",
      expected_value:
        "Cost growth (+$250K) is a larger dollar driver of the profit decline than revenue decline (-$200K)",
      depends_on: ["revenue-change-pct", "cost-change-pct"],
    },
  ],
  model_answer:
    "Downtown Fitness Co.'s profit decline is driven primarily by rising fixed and semi-fixed costs (rent +$200K, staff wages +$150K, equipment leasing +$50K year-over-year) outpacing a modest revenue decline caused by mix-shift toward discounted off-peak memberships (now 35% of the base, up from 15%), despite total membership volume holding flat. Recommend: (1) renegotiate leases or consolidate the highest-rent locations, (2) cap or tighten eligibility for the discounted off-peak tier to stem further mix erosion, and consider a modest standard-tier price increase given demand has held up despite new low-cost entrants, (3) address the root cause of rising staff costs - likely turnover - through retention incentives rather than reactive overtime or temp staffing. Target: restore profit to roughly $1.5M within 12 months, weighted mostly toward cost actions since cost growth was the larger driver of the decline.",
  grading_rubric: {
    structure: {
      strong:
        "Separates revenue and cost sides clearly; considers both volume/mix and pricing on the revenue side, and fixed vs variable on the cost side; treats the new competitors as a hypothesis to test rather than an assumed root cause.",
      weak: "Jumps to a single hypothesis (e.g. 'it must be the new competitors') without a MECE breakdown of revenue and cost drivers, or never investigates the cost side at all.",
    },
    math: {
      strong:
        "Correctly computes profit for both years, arrives at the ~30% decline figure, and correctly identifies that cost growth was the larger dollar driver versus revenue decline.",
      weak: "Arithmetic errors summing revenue/cost line items, or confuses percentage change with dollar change when comparing the two drivers.",
    },
    synthesis: {
      strong:
        "Recommendation ties directly back to the specific drivers uncovered (rent, staffing, membership mix) rather than generic advice, prioritizes by impact, and acknowledges the pricing tradeoff given new low-cost competitors.",
      weak: "Recommendation is generic ('cut costs', 'raise prices') without referencing the specific data uncovered, or ignores the competitive context entirely when proposing a price increase.",
    },
  },
};

const marketSizingCase: CaseContent = {
  title: "Chicago Independent Coffee Shops - Market Sizing",
  source: "Hand-written seed case",
  industry: "Food & Beverage",
  caseType: "market_sizing",
  difficulty: "easy",
  prompt:
    "Our client is a specialty coffee roaster evaluating how large an opportunity independent coffee shops in Chicago represent for their wholesale beans business. Before building a sales strategy, they've asked us: how many cups of coffee do independent coffee shops in Chicago sell per year?",
  clarifying_qa_bank: [
    {
      question_pattern: "what counts as independent",
      answer:
        "Exclude national chains like Starbucks and Dunkin' - we only care about small, locally-owned coffee shops (roughly 1-5 locations each).",
    },
    {
      question_pattern: "geographic scope / metro area or city",
      answer: "The city of Chicago proper, not the broader metro area.",
    },
    {
      question_pattern: "time frame",
      answer: "An annual estimate based on current conditions is fine.",
    },
    {
      question_pattern: "does this include grocery store or retail bagged coffee",
      answer:
        "No - only coffee sold and consumed through independent coffee shop storefronts (including to-go orders), not bagged beans sold at retail or grocery store coffee.",
    },
  ],
  framework_guidance:
    "A strong approach builds the estimate either top-down (city population -> % who are regular independent-coffee-shop customers -> visit frequency -> cups per visit) or bottom-up (number of independent shops -> throughput per shop per day -> days per year), and ideally cross-checks one approach against the other for a sanity check. The candidate should state each assumption explicitly as they build the driver tree rather than silently picking numbers, and present the final answer as a defensible range rather than false precision.",
  exhibits: [
    {
      id: "chicago-population",
      trigger_condition: "Candidate asks for Chicago's population.",
      exhibit_type: "text",
      exhibit_content: "Chicago's city population is approximately 2.7 million people.",
      order: 1,
    },
    {
      id: "shop-count",
      trigger_condition:
        "Candidate asks how many independent coffee shops exist in Chicago, as a bottom-up data point.",
      exhibit_type: "text",
      exhibit_content:
        "There are approximately 450 independent coffee shop locations operating within Chicago city limits.",
      order: 2,
    },
    {
      id: "shop-throughput",
      trigger_condition:
        "Candidate asks about typical daily transactions/cups sold per shop, e.g. to build or validate a bottom-up estimate.",
      exhibit_type: "text",
      exhibit_content:
        "A typical independent coffee shop in a dense urban area sells roughly 200-300 cups of coffee per day; 250 cups/day is a reasonable mid-point assumption for an average shop.",
      order: 3,
    },
  ],
  math_steps: [
    {
      id: "pct-regular-customers",
      description: "Assume the % of Chicago's population who are regular independent-shop customers",
      expected_value: "~15% (≈400,000 people) is a reasonable candidate assumption",
    },
    {
      id: "visits-per-week",
      description: "Assume visits per week per regular customer",
      expected_value: "~2 visits/week is a reasonable assumption",
    },
    {
      id: "cups-per-visit",
      description: "Assume cups purchased per visit",
      expected_value: "~1.2 cups/visit is a reasonable assumption",
    },
    {
      id: "top-down-total",
      description: "Compute annual cups via the top-down method",
      expected_value: "≈400,000 × 2 × 1.2 × 52 ≈ 50 million cups/year",
      depends_on: ["pct-regular-customers", "visits-per-week", "cups-per-visit"],
    },
    {
      id: "cups-per-shop-year",
      description: "Compute annual cups sold per shop (bottom-up)",
      expected_value: "250 cups/day × 365 ≈ 91,000 cups/year per shop",
    },
    {
      id: "bottom-up-total",
      description: "Compute total annual cups via the bottom-up method",
      expected_value: "450 shops × ≈91,000 ≈ 41 million cups/year",
      depends_on: ["cups-per-shop-year"],
    },
    {
      id: "cross-check",
      description: "Compare the top-down and bottom-up estimates as a sanity check",
      expected_value:
        "Both land in the same order of magnitude (~40-50 million cups/year), suggesting the estimate is reasonable",
      depends_on: ["top-down-total", "bottom-up-total"],
    },
  ],
  model_answer:
    "A top-down approach (Chicago population ~2.7M, ~15% regular independent-coffee-shop customers ≈ 400K people, visiting ~2x/week at ~1.2 cups/visit) yields roughly 50 million cups/year. A bottom-up cross-check (450 independent shops × ~250 cups/day × 365 days) yields roughly 41 million cups/year. Both approaches land in the same order of magnitude, so a reasonable estimate is approximately 40-50 million cups of coffee per year sold through independent Chicago coffee shops. For the client's wholesale bean strategy, at roughly 60-65 cups per pound of roasted coffee, that implies independent shops are going through somewhere on the order of 650,000-800,000 lbs of beans annually citywide - a sizeable addressable wholesale opportunity, assuming the client can compete on quality, price, and shop-owner relationships.",
  grading_rubric: {
    structure: {
      strong:
        "Lays out a clear top-down or bottom-up framework before estimating, states each assumption explicitly as a distinct driver, and proposes cross-checking one method against the other.",
      weak: "Jumps straight to a guessed final number with no stated structure, or relies on a single undefended assumption rather than a decomposed driver tree.",
    },
    math: {
      strong:
        "Correctly multiplies through the chosen driver tree, lands in the right order of magnitude (tens of millions of cups/year), and - if attempted - correctly reconciles the top-down and bottom-up figures.",
      weak: "Arithmetic errors compound through the multiplication chain, or the final answer is off by an order of magnitude without the candidate noticing or sanity-checking.",
    },
    synthesis: {
      strong:
        "Translates the cups/year estimate into something relevant to the client's actual question (bean volume, wholesale opportunity size) and presents it as a defensible range.",
      weak: "Stops at a bare cups/year figure without connecting it back to the client's wholesale beans question, or states a single hyper-precise number as if it were exact.",
    },
  },
};

async function main() {
  for (const content of [profitabilityCase, marketSizingCase]) {
    const validated = CaseContentSchema.parse(content);
    await prisma.case.create({
      data: {
        title: validated.title,
        source: validated.source,
        industry: validated.industry,
        caseType: validated.caseType,
        difficulty: validated.difficulty,
        prompt: validated.prompt,
        clarifyingQaBank: toJson(validated.clarifying_qa_bank),
        frameworkGuidance: validated.framework_guidance,
        exhibits: toJson(validated.exhibits),
        mathSteps: toJson(validated.math_steps),
        modelAnswer: validated.model_answer,
        gradingRubric: toJson(validated.grading_rubric),
        status: "live",
      },
    });
    console.log(`Seeded: ${validated.title}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
