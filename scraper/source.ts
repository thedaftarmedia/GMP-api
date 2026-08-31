import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { IpoCategory, NormalizedIPO } from "./types.js";

const DEFAULT_SOURCE_URL = "https://ipotrackr.davincin.eu.org/";

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").replace(/₹/g, "").trim();
  if (!normalized || normalized === "-" || /^n\/?a$/i.test(normalized)) return null;
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseLabelNumber(text: string, label: string): number | null {
  const match = text.match(new RegExp(`${label}\\s*:?\\s*₹?\\s*(-?[\\d,.]+)`, "i"));
  return parseNumber(match?.[1]);
}

function parsePercentageAfter(text: string, label: string): number | null {
  const match = text.match(new RegExp(`${label}[\\s\\S]{0,80}?\\((-?[\\d,.]+)%\\)`, "i"));
  return parseNumber(match?.[1]);
}

function parseDate(value: string | undefined, now: Date): string | null {
  if (!value || /not updated|n\/a|-/i.test(value.trim())) return null;
  const match = value.match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
  if (!match) return null;
  const month = new Date(`${match[2]} 1, 2000`).getMonth();
  if (Number.isNaN(month)) return null;
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), month, Number(match[1])));
  if (candidate.getTime() > now.getTime() + 180 * 24 * 60 * 60 * 1000) {
    candidate.setUTCFullYear(candidate.getUTCFullYear() - 1);
  }
  return candidate.toISOString().slice(0, 10);
}

function detectStatus($: cheerio.CheerioAPI, article: cheerio.Cheerio<AnyNode>): string {
  for (const parent of article.parents().toArray()) {
    const heading = $(parent).find("h3").first().text().replace(/\s+/g, " ").trim().toLowerCase();
    if (heading.includes("open for bidding")) return "Open";
    if (heading.includes("pending")) return "Pending";
    if (heading.includes("recently listed")) return "Listed";
  }
  const availability = article.find('meta[itemprop="availability"]').attr("content")?.toLowerCase();
  if (availability?.includes("instock")) return "Open";
  return "Pending";
}

function detectCategory($: cheerio.CheerioAPI, article: cheerio.Cheerio<AnyNode>): IpoCategory {
  const hasSmeBadge = article
    .find("span, div")
    .toArray()
    .some((node) => $(node).text().trim().toLowerCase() === "sme");
  return hasSmeBadge ? "sme" : "mainboard";
}

function parseBiddingDates(text: string, now: Date): [string | null, string | null] {
  const match = text.match(/Bidding:\s*([^\-]+?)\s*-\s*([^G]+?)GMP trend/i);
  return [parseDate(match?.[1], now), parseDate(match?.[2], now)];
}

export function parseSourceHtml(html: string, sourceUrl: string, now = new Date()): NormalizedIPO[] {
  const $ = cheerio.load(html);
  const records: NormalizedIPO[] = [];
  $("article[itemtype*='FinancialProduct']").each((_, element) => {
    const article = $(element);
    const name = article.find('meta[itemprop="name"]').attr("content")?.trim();
    if (!name) return;

    const text = article.text().replace(/\s+/g, " ").trim();
    const price = parseLabelNumber(text, "Price");
    const issueSize = parseLabelNumber(text, "Issue Size");
    const lotSize = parseLabelNumber(text, "Lot Size");
    const estimatedListing = parseLabelNumber(text, "Est\\. Listing");
    const gmp = parseLabelNumber(text, "GMP");
    const expectedProfit = parseNumber(article.find('div[itemprop="offers"] meta[itemprop="price"]').last().attr("content"));
    const subscription = parseNumber(article.find('span[itemprop="offers"]').first().text());
    const [biddingStartDate, biddingEndDate] = parseBiddingDates(text, now);
    const gmpPercentage = parsePercentageAfter(text, "GMP");
    const estimatedListingPercentage = parsePercentageAfter(text, "Est\\. Listing");
    const category = detectCategory($, article);
    const updatedAt = now.toISOString();
    const sourceId = `${category}:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

    if (price === null && gmp === null && estimatedListing === null) return;
    records.push({
      name,
      category,
      status: detectStatus($, article),
      price,
      gmp,
      gmpPercentage,
      estimatedListing,
      estimatedListingPercentage,
      expectedProfit,
      profitType: expectedProfit === null ? null : expectedProfit < 0 ? "loss" : "profit",
      lotSize,
      issueSize,
      subscription,
      biddingStartDate,
      biddingEndDate,
      sourceUrl,
      sourceId,
      scrapedAt: updatedAt,
      updatedAt,
      lastSeenAt: updatedAt,
      active: true,
    });
  });
  return records;
}

export async function fetchAndParseSource(sourceUrl = process.env.IPO_SOURCE_URL ?? DEFAULT_SOURCE_URL): Promise<NormalizedIPO[]> {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "IPO-GMP-Tracker-Scraper/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`IPO source returned HTTP ${response.status}`);
  const html = await response.text();
  if (html.length < 5_000) throw new Error("IPO source returned unexpectedly small HTML");
  return parseSourceHtml(html, sourceUrl);
}