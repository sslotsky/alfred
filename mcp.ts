import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  Ollama,
  type GenerateResponse,
  type AbortableAsyncIterator,
  type Tool,
} from "ollama";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ollama.

// Ollama API configuration
const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3";

const ollama = new Ollama({
  host: OLLAMA_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

async function callOllama(prompt: string) {
  return ollama.generate({
    model: OLLAMA_MODEL,
    prompt,
    stream: true,
  });
}

// Type definitions for tool arguments
export type AnalyzeStartupCostsArgs = {
  business_type: string;
  location: string;
  scale: "micro" | "small" | "medium";
  additional_details?: string;
};

export type CalculateBreakEvenArgs = {
  monthly_fixed_costs: number;
  variable_cost_per_unit: number;
  price_per_unit: number;
  estimated_monthly_units: number;
  startup_costs: number;
};

type GenerateBusinessPlanArgs = {
  business_name: string;
  business_type: string;
  business_description: string;
  target_market: string;
  financial_summary: {
    startup_costs?: number;
    loan_amount_needed?: number;
    monthly_revenue_projection?: number;
    break_even_timeline?: string;
  };
  owner_background?: string;
  additional_info?: string;
};

type CompetitiveAnalysisArgs = {
  business_type: string;
  location: string;
  unique_value_proposition?: string;
};

type FundingStrategyArgs = {
  funding_needed: number;
  business_stage: "idea" | "startup" | "early_growth";
  credit_situation?: string;
  collateral_available?: string;
};

// Tool handler functions
export function analyzeStartupCosts(
  args: AnalyzeStartupCostsArgs
) {
  const prompt = `You are an expert business consultant specializing in startup cost analysis. Analyze the startup costs for the following business:

Business Type: ${args.business_type}
Location: ${args.location}
Scale: ${args.scale}
${
  args.additional_details
    ? `Additional Details: ${args.additional_details}`
    : ""
}

Provide a detailed breakdown of:
1. One-time startup costs (equipment, licenses, initial inventory, etc.)
2. Working capital needed for first 3-6 months
3. Professional services (legal, accounting, etc.)
4. Marketing and branding costs
5. Technology and software
6. Contingency fund (10-20% of total)

Give specific dollar ranges for each category based on the business type and scale. Be realistic and comprehensive.`;

  return prompt;
}

export function calculateBreakEven(
  args: CalculateBreakEvenArgs
) {
  const {
    monthly_fixed_costs,
    variable_cost_per_unit,
    price_per_unit,
    estimated_monthly_units,
    startup_costs,
  } = args;

  // Calculate contribution margin per unit
  const contribution_margin =
    price_per_unit - variable_cost_per_unit;

  // Break-even units per month
  const break_even_units = Math.ceil(
    monthly_fixed_costs / contribution_margin
  );

  // Monthly profit/loss at estimated volume
  const monthly_profit =
    estimated_monthly_units * contribution_margin -
    monthly_fixed_costs;

  // Months to recover startup costs
  const months_to_recover =
    monthly_profit > 0
      ? Math.ceil(startup_costs / monthly_profit)
      : null;

  const prompt = `Analyze these financial calculations for a business and provide strategic insights:

Financial Metrics:
- Monthly Fixed Costs: $${monthly_fixed_costs.toLocaleString()}
- Variable Cost per Unit: $${variable_cost_per_unit}
- Price per Unit: $${price_per_unit}
- Estimated Monthly Sales: ${estimated_monthly_units} units
- Startup Investment: $${startup_costs.toLocaleString()}

Calculated Results:
- Contribution Margin per Unit: $${contribution_margin.toFixed(
    2
  )}
- Break-even Point: ${break_even_units} units per month
- Projected Monthly Profit/Loss: $${monthly_profit.toLocaleString()}
${
  months_to_recover
    ? `- Time to Recover Startup Costs: ${months_to_recover} months`
    : "- Warning: Current projections show negative monthly profit"
}

Provide:
1. Analysis of whether these numbers are realistic and sustainable
2. Recommendations for improving profitability
3. Risk assessment and mitigation strategies
4. Pricing strategy considerations

The next section should be displayed to the user above the analysis:

BREAK-EVEN ANALYSIS RESULTS:

📊 Key Metrics:
- Break-even Point: ${break_even_units} units/month
- Monthly Profit (at ${estimated_monthly_units} units): $${monthly_profit.toLocaleString()}
- Contribution Margin: $${contribution_margin.toFixed(
    2
  )} per unit
${
  months_to_recover
    ? `- Startup Cost Recovery: ${months_to_recover} months`
    : ""
}

---
`;

  return prompt;
}

export function generateBusinessPlan(
  args: GenerateBusinessPlanArgs
) {
  const {
    business_name,
    business_type,
    business_description,
    target_market,
    financial_summary,
    owner_background,
    additional_info,
  } = args;

  const prompt = `You are an expert business plan writer who has helped hundreds of entrepreneurs secure small business loans. Create a comprehensive, professional business plan that would impress bank loan officers and SBA lenders.

BUSINESS INFORMATION:
Business Name: ${business_name}
Industry: ${business_type}
Description: ${business_description}
Target Market: ${target_market}
${
  owner_background
    ? `Owner Background: ${owner_background}`
    : ""
}
${
  additional_info
    ? `Additional Info: ${additional_info}`
    : ""
}

FINANCIAL SUMMARY:
- Startup Costs: $${
    financial_summary.startup_costs?.toLocaleString() ||
    "TBD"
  }
- Loan Amount Needed: $${
    financial_summary.loan_amount_needed?.toLocaleString() ||
    "TBD"
  }
- Projected Monthly Revenue: $${
    financial_summary.monthly_revenue_projection?.toLocaleString() ||
    "TBD"
  }
- Break-even Timeline: ${
    financial_summary.break_even_timeline || "TBD"
  }

Create a complete business plan with these sections:

1. EXECUTIVE SUMMARY (1-2 pages)
   - Business concept and unique value proposition
   - Mission statement
   - Keys to success
   - Financial highlights and funding request

2. COMPANY DESCRIPTION
   - Business structure and ownership
   - Location and facilities
   - Products/services offered
   - Competitive advantages

3. MARKET ANALYSIS
   - Industry overview and trends
   - Target market demographics and size
   - Customer needs and buying behavior
   - Market growth potential

4. COMPETITIVE ANALYSIS
   - Direct and indirect competitors
   - Competitive positioning
   - Barriers to entry
   - Strategic advantages

5. MARKETING & SALES STRATEGY
   - Marketing channels and tactics
   - Pricing strategy
   - Sales process
   - Customer acquisition plan

6. OPERATIONS PLAN
   - Day-to-day operations
   - Suppliers and partners
   - Quality control
   - Key personnel and staffing

7. FINANCIAL PROJECTIONS (3-year)
   - Startup costs breakdown
   - Revenue projections
   - Expense forecasts
   - Break-even analysis
   - Cash flow projections
   - Loan repayment plan

8. APPENDIX
   - Owner resume/credentials
   - Supporting documents needed

Make this professional, realistic, and compelling. Use specific numbers where provided. Show clear path to profitability and loan repayment.`;

  return prompt;
}

async function competitiveAnalysis(
  args: CompetitiveAnalysisArgs
) {
  const {
    business_type,
    location,
    unique_value_proposition,
  } = args;

  const prompt = `You are a business strategy consultant. Conduct a competitive analysis for:

Business Type: ${business_type}
Location: ${location}
${
  unique_value_proposition
    ? `Unique Value Proposition: ${unique_value_proposition}`
    : ""
}

Provide:
1. Overview of the competitive landscape in this market
2. Identification of 3-5 key competitors (direct and indirect)
3. Competitive strengths and weaknesses analysis
4. Market gaps and opportunities
5. Strategic recommendations for differentiation
6. Potential threats and how to address them
7. Sustainable competitive advantages to develop

Be specific and actionable.`;

  return await callOllama(prompt);
}

async function fundingStrategy(args: FundingStrategyArgs) {
  const {
    funding_needed,
    business_stage,
    credit_situation,
    collateral_available,
  } = args;

  const prompt = `You are a small business financing expert. Provide comprehensive funding guidance for:

Funding Needed: $${funding_needed.toLocaleString()}
Business Stage: ${business_stage}
${
  credit_situation
    ? `Credit Situation: ${credit_situation}`
    : ""
}
${
  collateral_available
    ? `Collateral Available: ${collateral_available}`
    : ""
}

Provide detailed advice on:
1. Best funding options for this situation (SBA loans, traditional bank loans, online lenders, grants, equity, etc.)
2. Pros and cons of each option
3. Requirements and qualifications for each funding source
4. How to prepare a strong loan application
5. What lenders look for in business loan applicants
6. Tips for improving chances of approval
7. Timeline expectations for securing funding
8. Alternative strategies if traditional funding is difficult

Be practical, honest, and provide actionable next steps.`;

  return await callOllama(prompt);
}

const server = new Server(
  {
    name: "business-planning-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

export const analyzeStartupCostTool: Tool = {
  type: "function",
  function: {
    name: "analyze_startup_costs",
    description: "Analyzes startup costs for a business.",
    type: "function",
    parameters: {
      type: "object",
      properties: {
        businessType: {
          type: "string",
          description:
            "Type of business (e.g., retail, tech, service).",
        },
        location: {
          type: "string",
          description: "Location of the business.",
        },
        targetMarket: {
          type: "string",
          description:
            "Description of the target customer base.",
        },
      },
      required: ["businessType", "location"],
    },
  },
};

export const calculateBreakEvenTool: Tool = {
  type: "function",
  function: {
    name: "calculate_break_even",
    description:
      "Calculates the break-even point for a business.",
    type: "function",
    parameters: {
      type: "object",
      properties: {
        fixedCosts: {
          type: "number",
          description: "Monthly fixed costs in dollars.",
        },
        variableCostPerUnit: {
          type: "number",
          description: "Variable cost per unit in dollars.",
        },
        sellingPricePerUnit: {
          type: "number",
          description: "Selling price per unit in dollars.",
        },
      },
      required: [
        "fixedCosts",
        "variableCostPerUnit",
        "sellingPricePerUnit",
      ],
    },
  },
};

export const tools: Tool[] = [
  analyzeStartupCostTool,
  calculateBreakEvenTool,
  {
    type: "function",
    function: {
      name: "generate_business_plan",
      description:
        "Generates a comprehensive business plan.",
      type: "function",
      parameters: {
        type: "object",
        properties: {
          businessName: {
            type: "string",
            description: "Name of the business.",
          },
          industry: {
            type: "string",
            description:
              "Industry or market the business operates in.",
          },
          totalInitialInvestment: {
            type: "number",
            description:
              "Total initial investment required.",
          },
          breakEvenTimeline: {
            type: "string",
            description:
              "Estimated time to reach break-even point.",
          },
          ownerBackground: {
            type: "string",
            description:
              "Background and experience of the business owner.",
          },
        },
        required: [
          "businessName",
          "industry",
          "financialSummary",
          "totalInitialInvestment",
          "breakEvenTimeline",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "competitive_analysis",
      description:
        "Analyzes the competitive landscape and identifies opportunities for a new business.",
      type: "function",
      parameters: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description:
              "Industry or market the business operates in.",
          },
          targetMarket: {
            type: "string",
            description:
              "Description of the target customer base.",
          },
          uniqueValueProposition: {
            type: "string",
            description:
              "What makes the business unique in the market.",
          },
        },
        required: ["industry", "targetMarket"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "funding_strategy",
      description:
        "Develops a funding strategy for the business, including sources and timelines.",
      type: "function",
      parameters: {
        type: "object",
        properties: {
          businessStage: {
            type: "string",
            enum: [
              "idea",
              "prototype",
              "launch",
              "growth",
              "scaling",
            ],
            description: "Current stage of the business.",
          },
          fundingNeeds: {
            type: "number",
            description:
              "Total amount of funding required.",
          },
          fundingSources: {
            type: "array",
            items: {
              type: "string",
              description:
                "List of potential funding sources (e.g., investors, loans, grants).",
            },
          },
          timeline: {
            type: "string",
            description:
              "Estimated timeline for securing funding.",
          },
        },
        required: [
          "businessStage",
          "fundingNeeds",
          "fundingSources",
        ],
      },
    },
  },
];

// Tool definitions
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
    return {
      tools,
    };
  }
);

// Tool execution handler
// server.setRequestHandler(
//   CallToolRequestSchema,
//   async (request) => {
//     const { name, arguments: args } = request.params;

//     try {
//       let result: AbortableAsyncIterator<GenerateResponse>;

//       switch (name) {
//         case "analyze_startup_costs":
//           result = analyzeStartupCosts(
//             args as AnalyzeStartupCostsArgs
//           );
//           break;
//         case "generate_business_plan":
//           result = await generateBusinessPlan(
//             args as GenerateBusinessPlanArgs
//           );
//           break;

//         case "competitive_analysis":
//           result = await competitiveAnalysis(
//             args as CompetitiveAnalysisArgs
//           );
//           break;

//         case "funding_strategy":
//           result = await fundingStrategy(
//             args as FundingStrategyArgs
//           );
//           break;

//         default:
//           throw new Error(`Unknown tool: ${name}`);
//       }

//       return {
//         content: [
//           {
//             type: "text",
//             text: result,
//           },
//         ],
//       };
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error
//           ? error.message
//           : String(error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${errorMessage}`,
//           },
//         ],
//         isError: true,
//       };
//     }
//   }
// );

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `Business Planning MCP Server running on stdio`
  );
  console.error(`Using Ollama at: ${OLLAMA_API_URL}`);
  console.error(`Model: ${OLLAMA_MODEL}`);
}
