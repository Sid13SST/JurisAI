export interface Clause {
  id: string;
  name: string;
  category: string;
  text: string;
  status: 'Approved' | 'Warning' | 'Critical';
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskDescription: string;
}

export interface RiskFlag {
  id: string;
  category: 'Financial' | 'Legal' | 'Operational' | 'Reputational';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendation: string;
}

export interface Contract {
  id: string;
  name: string;
  type: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Flagged';
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastUpdated: string;
  uploader: string;
  fileSize: string;
  version: string;
  executiveSummary: string;
  clauses: Clause[];
  riskFlags: RiskFlag[];
}

export const mockContracts: Contract[] = [
  {
    id: "saas-agreement-001",
    name: "Apex ERP Cloud Services Agreement",
    type: "SaaS Agreement",
    status: "Flagged",
    riskScore: 88,
    riskLevel: "Critical",
    lastUpdated: "2026-06-12",
    uploader: "Sarah Jenkins (Legal Ops)",
    fileSize: "1.4 MB",
    version: "v3.2",
    executiveSummary: "This Agreement governs the licensing and delivery of Cloud-based Enterprise Resource Planning (ERP) services. The analysis reveals several high-risk elements, primarily an uncapped liability provision for service failures, a dangerously short 7-day termination notice for convenience by the provider, and ambiguous SLAs regarding critical database outages.",
    clauses: [
      {
        id: "saas-1",
        name: "Service Level Agreement (SLA)",
        category: "Performance Metrics",
        text: "The Provider guarantees a monthly uptime service level of 99.0% for the Cloud ERP services. Downtime is calculated solely based on reported issues via the customer portal. Provider shall have a cure period of 45 business days to resolve outages prior to service credits being issued.",
        status: "Warning",
        confidence: 91,
        riskLevel: "Medium",
        riskDescription: "Uptime guarantee is set at 99.0% (standard is 99.9% or higher). Additionally, the definition relies on client-reported outages rather than telemetry, and a 45-day cure period is excessively long, effectively negating monthly service level expectations."
      },
      {
        id: "saas-2",
        name: "Data Ownership & Security",
        category: "Data Assets",
        text: "All customer data uploaded to the Cloud ERP remains the property of the Customer. However, Customer hereby grants the Provider a perpetual, royalty-free, fully transferable, worldwide license to utilize, aggregate, train machine learning models on, and commercialize all aggregated and anonymized usage data.",
        status: "Approved",
        confidence: 95,
        riskLevel: "Low",
        riskDescription: "Standard data ownership is preserved. The training license on anonymized data is typical for AI SaaS platforms, though operations should verify compliance with corporate confidentiality standards."
      },
      {
        id: "saas-3",
        name: "Payment Terms",
        category: "Financials",
        text: "Fees are invoiced monthly in advance and are non-refundable. Payment is due within 10 calendar days of invoice date. Late payments are subject to a compounding interest charge of 1.5% per month, and the Provider reserves the right to immediately suspend access without prior notice in the event of any payment delay exceeding 5 business days.",
        status: "Warning",
        confidence: 89,
        riskLevel: "High",
        riskDescription: "Payment window of 10 days is narrow (30 days is industry standard). Suspension of service without prior written warning and a 5-day grace period poses severe operational risks for core business infrastructure."
      },
      {
        id: "saas-4",
        name: "Limitation of Liability",
        category: "Liability",
        text: "EXCEPT FOR IP INDEMNIFICATION, NEITHER PARTY SHALL BE LIABLE FOR INDIRECT OR CONSEQUENTIAL DAMAGES. HOWEVER, PROVIDER'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER IN CONTRACT, TORT, OR OTHERWISE, IS UNLIMITED AND UNCAPED FOR SERVICE INTERRUPTIONS CAUSING DATA LOSS OR BUSINESS DISRUPTION.",
        status: "Critical",
        confidence: 98,
        riskLevel: "Critical",
        riskDescription: "The liability cap is completely waived for service interruptions causing data loss or business disruption. This creates an uncapped financial exposure for the provider (or customer, depending on perspective), violating risk management boundaries."
      },
      {
        id: "saas-5",
        name: "Termination for Convenience",
        category: "Lifecycle",
        text: "Either party may terminate this Agreement for convenience at any time. The Provider may terminate this Agreement by providing 7 business days' written notice to the Customer, after which all access to the ERP Cloud system will cease and all database archives will be permanently deleted.",
        status: "Critical",
        confidence: 96,
        riskLevel: "High",
        riskDescription: "A 7-day termination notice for convenience by the provider is an extremely short window for critical software, providing insufficient time to export, migrate, or secure historical data before absolute erasure."
      }
    ],
    riskFlags: [
      {
        id: "saas-f1",
        category: "Financial",
        severity: "Critical",
        description: "Uncapped liability for service failures exposing the organization to unlimited financial damage claims.",
        recommendation: "Negotiate a standard liability cap tied to 12 months of paid contract fees (e.g., 1x or 2x annual recurring revenue)."
      },
      {
        id: "saas-f2",
        category: "Operational",
        severity: "High",
        description: "Provider can terminate the agreement in 7 days and delete all system backups.",
        recommendation: "Extend the provider's termination for convenience notice to at least 90 days and require a 30-day post-termination data transition support window."
      },
      {
        id: "saas-f3",
        category: "Legal",
        severity: "Medium",
        description: "Cure period of 45 days for service outages is commercially unreasonable.",
        recommendation: "Reduce the SLA cure period to a maximum of 5 business days or require immediate service credits for outages exceeding 4 hours."
      }
    ]
  },
  {
    id: "nda-agreement-002",
    name: "Project Nova Mutual NDA",
    type: "Non-Disclosure Agreement",
    status: "Under Review",
    riskScore: 65,
    riskLevel: "High",
    lastUpdated: "2026-06-10",
    uploader: "Marcus Vance (VP Partnerships)",
    fileSize: "840 KB",
    version: "v1.0",
    executiveSummary: "A mutual NDA drafted to share proprietary merger and technical evaluation data. The agreement features overly broad permitted disclosure definitions that permit sharing with third-party advisors without written consent, and an abbreviated confidentiality duration of only 12 months.",
    clauses: [
      {
        id: "nda-1",
        name: "Confidentiality Obligations",
        category: "Protection",
        text: "Each party shall maintain the other party's Confidential Information in strict confidence, applying at least the same degree of care it uses for its own confidential details, but in no event less than a reasonable standard of care.",
        status: "Approved",
        confidence: 97,
        riskLevel: "Low",
        riskDescription: "Standard mutual confidentiality standard of care. Adequately protects proprietary data inputs."
      },
      {
        id: "nda-2",
        name: "Permitted Disclosures",
        category: "Protection",
        text: "The Receiving Party may disclose Confidential Information to its employees, directors, affiliates, and any external contractors, financial advisors, legal counsel, or potential investor candidates, provided such parties need to know the information to evaluate Project Nova.",
        status: "Warning",
        confidence: 92,
        riskLevel: "Medium",
        riskDescription: "The definition of permitted recipients is too broad. Allowing disclosures to 'potential investor candidates' and general 'contractors' without requiring them to sign identical back-to-back NDAs creates a risk of leakage."
      },
      {
        id: "nda-3",
        name: "Confidentiality Duration",
        category: "Lifecycle",
        text: "The obligations of non-disclosure and restricted use under this Agreement shall survive for a period of one (1) year from the date of disclosure, after which all restrictions on use and disclosure shall completely expire.",
        status: "Critical",
        confidence: 94,
        riskLevel: "High",
        riskDescription: "A confidentiality duration of 1 year is too short for proprietary intellectual property, trade secrets, or merger negotiations. Industry standard is 3 to 5 years, with trade secrets protected indefinitely."
      },
      {
        id: "nda-4",
        name: "Return or Destruction of Materials",
        category: "Lifecycle",
        text: "Within 30 days of a written request, the Receiving Party shall return or destroy all physical documents containing Confidential Information. However, the Receiving Party's IT backup systems may retain automated backups in accordance with standard archiving practices.",
        status: "Approved",
        confidence: 93,
        riskLevel: "Low",
        riskDescription: "Standard return/destruction provision. The IT backup exception is common and legally acceptable provided the backup data remains encrypted and subject to NDA protections."
      }
    ],
    riskFlags: [
      {
        id: "nda-f1",
        category: "Legal",
        severity: "High",
        description: "Confidentiality period expires in 12 months, which exposes proprietary technology and trade secrets to premature disclosure.",
        recommendation: "Increase the confidentiality term to 5 years, and require trade secrets to remain confidential indefinitely or until they enter the public domain."
      },
      {
        id: "nda-f2",
        category: "Reputational",
        severity: "Medium",
        description: "Broad disclosure permitted to potential investors and generic contractors without prior written consent.",
        recommendation: "Amend the clause to restrict disclosures only to affiliates and direct legal/financial advisors, and ensure all recipients are bound by written confidentiality terms at least as restrictive as this NDA."
      }
    ]
  },
  {
    id: "employment-agreement-003",
    name: "Executive Employment Agreement - Chief Science Officer",
    type: "Employment Agreement",
    status: "Flagged",
    riskScore: 78,
    riskLevel: "High",
    lastUpdated: "2026-06-08",
    uploader: "HR Operations Team",
    fileSize: "2.1 MB",
    version: "v4.1",
    executiveSummary: "Employment contract for the incoming Chief Science Officer. Major flags include a broad IP assignment clause that covers all intellectual property created during employment (even if created outside working hours or unrelated to company products) and a highly restrictive 24-month non-compete.",
    clauses: [
      {
        id: "emp-1",
        name: "Intellectual Property Ownership",
        category: "IP Rights",
        text: "Employee agrees that all inventions, discoveries, improvements, copyrightable materials, and designs created, conceived, or reduced to practice by Employee during the term of employment, whether or not during normal business hours and whether or not utilizing Company resources, shall be the sole and exclusive property of the Company.",
        status: "Critical",
        confidence: 96,
        riskLevel: "Critical",
        riskDescription: "The IP assignment clause is overly broad. It attempts to claim ownership over inventions created entirely outside business hours, without company equipment, and unrelated to the company's line of business, which may violate regional labor codes or overreach."
      },
      {
        id: "emp-2",
        name: "Non-Compete Covenants",
        category: "Restrictions",
        text: "Employee shall not, directly or indirectly, engage in, consult for, or hold any financial interest in any business, corporation, or entity that competes with the current or planned products and services of the Company for a period of twenty-four (24) months following the termination of employment within any jurisdiction in North America.",
        status: "Critical",
        confidence: 93,
        riskLevel: "High",
        riskDescription: "A 24-month non-compete is highly restrictive and likely unenforceable in many jurisdictions. The geographic scope (North America) and inclusion of 'planned products' are overly broad and create substantial legal friction."
      },
      {
        id: "emp-3",
        name: "Compensation & Benefits",
        category: "Financials",
        text: "Executive base salary is set at $280,000 per annum, paid in accordance with regular payroll procedures. Executive is eligible for a target performance bonus of up to 40%, determined at the absolute discretion of the Board of Directors.",
        status: "Approved",
        confidence: 98,
        riskLevel: "Low",
        riskDescription: "Standard executive compensation parameters. Discretionary bonus clause is standard corporate practice."
      },
      {
        id: "emp-4",
        name: "Termination Provisions",
        category: "Lifecycle",
        text: "The Company may terminate this Agreement immediately for 'Cause'. Termination by the Company 'Without Cause' requires 15 business days' written notice or payment of base salary in lieu thereof, after which all health insurance coverage and equity vesting shall immediately cease.",
        status: "Warning",
        confidence: 90,
        riskLevel: "Medium",
        riskDescription: "The notice period of 15 days for a C-suite executive termination without cause is minimal. The absolute cessation of equity vesting and health benefits upon notice is harsh and may trigger wrongful termination disputes."
      }
    ],
    riskFlags: [
      {
        id: "emp-f1",
        category: "Legal",
        severity: "Critical",
        description: "Overly broad IP assignment captures employee inventions created outside work hours and unrelated to company products.",
        recommendation: "Limit IP assignment to inventions developed using company resources, during company hours, or directly related to the company's business or research."
      },
      {
        id: "emp-f2",
        category: "Legal",
        severity: "High",
        description: "24-month non-compete across North America is overly restrictive and may be legally void.",
        recommendation: "Reduce non-compete duration to 6 or 12 months, limit geographic scope to specific key competitor territories, and restrict to actual competing products."
      },
      {
        id: "emp-f3",
        category: "Financial",
        severity: "Medium",
        description: "Short notice period of 15 days for termination without cause with immediate equity vesting freeze.",
        recommendation: "Increase the severance period to 3-6 months for C-level executives and negotiate double-trigger acceleration or extended vesting windows."
      }
    ]
  },
  {
    id: "vendor-agreement-004",
    name: "Master Logistics Vendor Agreement",
    type: "Vendor Agreement",
    status: "Flagged",
    riskScore: 92,
    riskLevel: "Critical",
    lastUpdated: "2026-06-11",
    uploader: "David Cho (Procurement)",
    fileSize: "1.2 MB",
    version: "v2.0",
    executiveSummary: "A logistics and transportation services contract. This agreement contains a highly critical, one-sided indemnity clause holding the client company responsible for all cargo losses, even those caused by the vendor's sole negligence. It also includes ambiguous deliverables and penalty triggers.",
    clauses: [
      {
        id: "ven-1",
        name: "Payment Terms & Auditing",
        category: "Financials",
        text: "Customer shall pay all undisputed invoices within 45 days. Vendor reserves the right to charge an administration fee of $250 for any invoice dispute raised by the Customer that is subsequently determined to be valid in part.",
        status: "Warning",
        confidence: 90,
        riskLevel: "Medium",
        riskDescription: "Charging the customer a fee to raise valid billing disputes is a highly punitive clause that discourages invoice auditing and creates bad operational incentives."
      },
      {
        id: "ven-2",
        name: "Indemnification Obligations",
        category: "Liability",
        text: "Customer shall defend, indemnify, and hold harmless Vendor and its drivers from all claims, damages, liabilities, and legal expenses arising out of the transport of cargo under this Agreement, including claims related to load damage, delay, or vehicular accidents, regardless of whether caused by Vendor's negligence.",
        status: "Critical",
        confidence: 97,
        riskLevel: "Critical",
        riskDescription: "This is a completely one-sided indemnity clause. It requires the customer to indemnify the vendor for accidents and cargo damage that may result from the vendor's own negligence, which violates standard commercial liability allocation."
      },
      {
        id: "ven-3",
        name: "Liability Limits",
        category: "Liability",
        text: "Vendor's total liability for cargo damage, lost shipments, or shipping delays shall be strictly limited to a maximum of $100 per container shipment, regardless of the actual commercial value of the contents.",
        status: "Critical",
        confidence: 95,
        riskLevel: "Critical",
        riskDescription: "A $100 cap per container is functionally equivalent to zero liability for cargo damage, creating immense financial exposure for high-value shipments."
      },
      {
        id: "ven-4",
        name: "Deliverables & Scheduling",
        category: "Performance Metrics",
        text: "Vendor will use reasonable commercial efforts to meet target delivery schedules. Delivery dates are estimates only, and Vendor does not guarantee transit times. No penalties or liquidated damages for delays shall apply under any circumstances.",
        status: "Warning",
        confidence: 91,
        riskLevel: "Medium",
        riskDescription: "The definition of deliverables is vague, and there is a total exclusion of delay penalties. This leaves the customer with no legal recourse in the event of chronic logistics failures."
      }
    ],
    riskFlags: [
      {
        id: "ven-f1",
        category: "Legal",
        severity: "Critical",
        description: "Customer must indemnify vendor for vendor's own negligence, representing extreme legal risk.",
        recommendation: "Strike out 'regardless of whether caused by Vendor's negligence' and make the indemnity mutual, excluding vendor's negligence or willful misconduct."
      },
      {
        id: "ven-f2",
        category: "Financial",
        severity: "Critical",
        description: "Vendor's liability limit is capped at a nominal $100 per shipment, exposing high-value shipments to massive loss.",
        recommendation: "Negotiate a cargo liability cap that matches the actual declared value of shipped goods, or set it to a multiplier of the shipping fees (e.g. 5x) with a minimum floor of $50,000."
      },
      {
        id: "ven-f3",
        category: "Operational",
        severity: "Medium",
        description: "No SLA penalties for late deliveries, combined with non-guaranteed transit times.",
        recommendation: "Add standard service level credits or late delivery penalty schedules (e.g. 2% discount per day of delay) for critical shipments."
      }
    ]
  },
  {
    id: "dpa-agreement-005",
    name: "Global Customer Data Processing Addendum",
    type: "Data Processing Agreement",
    status: "Approved",
    riskScore: 45,
    riskLevel: "Medium",
    lastUpdated: "2026-06-05",
    uploader: "Elena Rostova (Data Privacy Officer)",
    fileSize: "1.8 MB",
    version: "v2.1",
    executiveSummary: "A DPA covering GDPR and CCPA data flows. The document is generally well-structured but fails to specify standard contractual clauses (SCCs) for cross-border data transfers, and has weak, ambiguous notification timelines for security breaches.",
    clauses: [
      {
        id: "dpa-1",
        name: "Data Retention & Disposal",
        category: "Data Assets",
        text: "Upon termination of the underlying services, Processor shall, at the option of Controller, return or destroy all personal data within ninety (90) calendar days, unless local regulatory archiving statutes prohibit such destruction.",
        status: "Approved",
        confidence: 94,
        riskLevel: "Low",
        riskDescription: "Standard data retention and cleanup timeline. Adequately covers post-contract safety requirements."
      },
      {
        id: "dpa-2",
        name: "GDPR & CCPA Compliance",
        category: "Compliance",
        text: "Processor shall process all personal data in accordance with GDPR Article 28 requirements and California Consumer Privacy Act standards. Processor shall notify Controller of any regulatory inquiries regarding data processing activities.",
        status: "Approved",
        confidence: 96,
        riskLevel: "Low",
        riskDescription: "Complies with regulatory standards. Robust commitment to process data in accordance with statutory rules."
      },
      {
        id: "dpa-3",
        name: "Cross-Border Data Transfers",
        category: "Compliance",
        text: "Processor may transfer personal data outside the EEA or UK to its sub-processors in secondary jurisdictions. No Standard Contractual Clauses (SCCs) are appended, but Processor guarantees that sub-processors maintain adequate security levels.",
        status: "Critical",
        confidence: 95,
        riskLevel: "High",
        riskDescription: "Failure to append EU Standard Contractual Clauses (SCCs) or UK Addendums for cross-border data transfers constitutes a major GDPR compliance violation, as verbal or generic 'adequacy guarantees' are legally insufficient."
      },
      {
        id: "dpa-4",
        name: "Security Breach Notification",
        category: "Security",
        text: "In the event of a confirmed security breach affecting personal data, Processor shall notify Controller within a reasonable time after becoming aware of the incident, and shall cooperate in investigations.",
        status: "Warning",
        confidence: 93,
        riskLevel: "High",
        riskDescription: "The notification window 'within a reasonable time' is ambiguous. GDPR requires processors to notify controllers 'without undue delay' (often interpreted as within 24 to 72 hours). Ambiguous timelines delay reporting compliance."
      }
    ],
    riskFlags: [
      {
        id: "dpa-f1",
        category: "Legal",
        severity: "High",
        description: "Missing EU Standard Contractual Clauses (SCCs) for international transfers, violating cross-border data export regulations.",
        recommendation: "Append and execute the standard Module 2 (Controller-to-Processor) or Module 3 (Processor-to-Processor) SCCs as an exhibit to the DPA."
      },
      {
        id: "dpa-f2",
        category: "Operational",
        severity: "High",
        description: "Ambiguous 'reasonable time' breach notification window, risking regulatory non-compliance.",
        recommendation: "Change the breach notification window to a strict 'without undue delay, and in any event no later than 48 hours after confirmation of the incident'."
      }
    ]
  },
  {
    id: "partnership-agreement-006",
    name: "Strategic Joint Venture Partnership Agreement",
    type: "Partnership Agreement",
    status: "Under Review",
    riskScore: 58,
    riskLevel: "Medium",
    lastUpdated: "2026-06-01",
    uploader: "Thomas Vance (Corporate Development)",
    fileSize: "3.2 MB",
    version: "v5.0",
    executiveSummary: "Agreement establishing a strategic partnership for co-developing medical AI software. The document contains weak governance parameters, vague dispute resolution mechanisms that lack mediation steps, and complex revenue sharing exit triggers that could cause post-termination disputes.",
    clauses: [
      {
        id: "part-1",
        name: "Revenue Sharing",
        category: "Financials",
        text: "Net revenues generated from co-developed products shall be split 60% to Partner A and 40% to Partner B. Net revenues are defined as gross receipts less all marketing, software hosting, server maintenance, sales commissions, and administrative overhead fees calculated by Partner A's internal accountants.",
        status: "Warning",
        confidence: 88,
        riskLevel: "High",
        riskDescription: "The definition of 'Net revenues' is highly subjective, allowing Partner A's internal accountants to deduct arbitrary administrative overhead fees. This lacks independent auditing safeguards."
      },
      {
        id: "part-2",
        name: "Governance & Board Decisions",
        category: "Management",
        text: "The Joint Venture shall be governed by a Management Committee consisting of three representatives from Partner A and two representatives from Partner B. All operating decisions shall be decided by a simple majority vote of the Committee.",
        status: "Warning",
        confidence: 92,
        riskLevel: "Medium",
        riskDescription: "Governance is structurally biased towards Partner A (3 to 2 representation), giving them absolute control over all operating decisions. Partner B has no veto power on material expenditures or changes in joint venture direction."
      },
      {
        id: "part-3",
        name: "Exit Clauses & Dissolution",
        category: "Lifecycle",
        text: "Upon dissolution of the partnership, Partner A shall retain full ownership of all co-developed core software components, and Partner B shall receive a non-exclusive, non-transferable, royalty-bearing license (at market rates) to utilize the software for its internal purposes only.",
        status: "Critical",
        confidence: 94,
        riskLevel: "High",
        riskDescription: "An exit clause where Partner A retains absolute ownership of the IP, leaving Partner B with only a restricted, royalty-bearing internal-use license, is highly unfavorable to Partner B who contributed 50% of co-development effort."
      },
      {
        id: "part-4",
        name: "Dispute Resolution",
        category: "Legal",
        text: "In the event of any dispute arising out of this Agreement, the parties shall attempt to resolve it. If the dispute is not resolved within 15 days, either party may file a lawsuit in the state courts of Delaware.",
        status: "Warning",
        confidence: 91,
        riskLevel: "Medium",
        riskDescription: "The clause lacks structured dispute escalation steps such as executive consultation or mandatory mediation. Direct escalation to litigation in 15 days increases legal costs and destroys partnership relationships prematurely."
      }
    ],
    riskFlags: [
      {
        id: "part-f1",
        category: "Financial",
        severity: "High",
        description: "Subjective revenue-sharing deductions calculated unilaterally without auditing rights.",
        recommendation: "Define deductions using GAAP standards, and add an annual third-party audit provision with fees split equally."
      },
      {
        id: "part-f2",
        category: "Legal",
        severity: "High",
        description: "Unbalanced exit clause where one partner retains all IP ownership despite joint contributions.",
        recommendation: "Specify joint ownership or a fair buyout mechanism based on a third-party valuation of the co-developed IP upon dissolution."
      },
      {
        id: "part-f3",
        category: "Legal",
        severity: "Medium",
        description: "Lack of structured dispute resolution pathways like executive escalation or mediation.",
        recommendation: "Revise dispute resolution to require 15 days of executive negotiations, followed by mandatory mediation, before initiating lawsuit proceedings."
      }
    ]
  }
];

export const recentContractsList = mockContracts.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  riskScore: c.riskScore,
  riskLevel: c.riskLevel,
  status: c.status,
  lastUpdated: c.lastUpdated
}));

export const dashboardStats = {
  contractsAnalyzed: 148,
  avgRiskScore: 68,
  highRiskContracts: 14,
  clausesReviewed: 1842
};

export const riskDistributionData = [
  { name: 'Low Risk (0-40)', count: 48, fill: '#22C55E' },
  { name: 'Medium Risk (41-60)', count: 62, fill: '#F59E0B' },
  { name: 'High Risk (61-80)', count: 24, fill: '#EA580C' },
  { name: 'Critical Risk (81-100)', count: 14, fill: '#EF4444' }
];

export const categoryBreakdownData = [
  { name: 'SaaS Agreements', count: 38 },
  { name: 'NDAs', count: 45 },
  { name: 'Employment Contracts', count: 29 },
  { name: 'Vendor Contracts', count: 18 },
  { name: 'DPAs', count: 12 },
  { name: 'Partnerships', count: 6 }
];

export const monthlyActivityData = [
  { month: 'Jan', analyzed: 12, flagged: 3, complianceRate: 90 },
  { month: 'Feb', analyzed: 18, flagged: 5, complianceRate: 85 },
  { month: 'Mar', analyzed: 22, flagged: 8, complianceRate: 78 },
  { month: 'Apr', analyzed: 25, flagged: 6, complianceRate: 82 },
  { month: 'May', analyzed: 31, flagged: 9, complianceRate: 75 },
  { month: 'Jun', analyzed: 40, flagged: 14, complianceRate: 68 }
];

export const riskTrendData = [
  { date: 'Jan 26', averageScore: 42, criticalCount: 2 },
  { date: 'Feb 26', averageScore: 48, criticalCount: 4 },
  { date: 'Mar 26', averageScore: 55, criticalCount: 6 },
  { date: 'Apr 26', averageScore: 53, criticalCount: 5 },
  { date: 'May 26', averageScore: 62, criticalCount: 9 },
  { date: 'Jun 26', averageScore: 68, criticalCount: 14 }
];

export const clauseFrequencyData = [
  { name: 'Indemnity', frequency: 95, averageRisk: 72 },
  { name: 'Liability Caps', frequency: 98, averageRisk: 85 },
  { name: 'Confidentiality', frequency: 100, averageRisk: 30 },
  { name: 'Termination', frequency: 88, averageRisk: 65 },
  { name: 'IP Ownership', frequency: 92, averageRisk: 80 },
  { name: 'SLA Outages', frequency: 45, averageRisk: 58 },
  { name: 'Data Transfers', frequency: 62, averageRisk: 75 },
  { name: 'Dispute Settlement', frequency: 90, averageRisk: 50 }
];
