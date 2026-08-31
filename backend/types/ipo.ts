export type IPOCategory = "mainboard" | "sme";
export type ProfitType = "profit" | "loss";

export interface IPO {
  id: string;
  name: string;
  category: IPOCategory;
  status: string;
  price: number | null;
  gmp: number | null;
  gmpPercentage: number | null;
  estimatedListing: number | null;
  estimatedListingPercentage: number | null;
  expectedProfit: number | null;
  profitType: ProfitType | null;
  lotSize: number | null;
  issueSize: number | null;
  subscription: number | null;
  biddingStartDate: string | null;
  biddingEndDate: string | null;
  sourceUrl: string | null;
  sourceId: string;
  scrapedAt: string;
  updatedAt: string;
  lastSeenAt: string;
  active: boolean;
}

export interface ConvexIPODocument extends Omit<IPO, "id"> {
  _id?: string;
  id?: string;
}

export interface IpoGroups {
  mainboard: IPO[];
  sme: IPO[];
}

export interface IposResponse {
  success: boolean;
  available: boolean;
  data: IpoGroups;
  message?: string;
}

export function normalizeIpo(document: ConvexIPODocument): IPO {
  return {
    id: document.id ?? document._id ?? document.sourceId,
    name: document.name,
    category: document.category,
    status: document.status,
    price: document.price ?? null,
    gmp: document.gmp ?? null,
    gmpPercentage: document.gmpPercentage ?? null,
    estimatedListing: document.estimatedListing ?? null,
    estimatedListingPercentage: document.estimatedListingPercentage ?? null,
    expectedProfit: document.expectedProfit ?? null,
    profitType: document.profitType ?? null,
    lotSize: document.lotSize ?? null,
    issueSize: document.issueSize ?? null,
    subscription: document.subscription ?? null,
    biddingStartDate: document.biddingStartDate ?? null,
    biddingEndDate: document.biddingEndDate ?? null,
    sourceUrl: document.sourceUrl ?? null,
    sourceId: document.sourceId,
    scrapedAt: document.scrapedAt,
    updatedAt: document.updatedAt,
    lastSeenAt: document.lastSeenAt ?? document.updatedAt,
    active: document.active ?? true,
  };
}