export type IpoCategory = "mainboard" | "sme";
export type IpoStatus = string;

export interface NormalizedIPO {
  name: string;
  category: IpoCategory;
  status: IpoStatus;
  price: number | null;
  gmp: number | null;
  gmpPercentage: number | null;
  estimatedListing: number | null;
  estimatedListingPercentage: number | null;
  expectedProfit: number | null;
  profitType: "profit" | "loss" | null;
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

export interface ScrapeResult {
  recordsScraped: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  historyRecordsCreated: number;
  mainboardValid: number;
  smeValid: number;
}