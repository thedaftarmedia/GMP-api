import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  Braces,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  Filter,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";

type Category = "all" | "mainboard" | "sme";
type StatusFilter = "all" | "Open" | "Pending" | "Listed";
type SortKey = "gmp-desc" | "gmp-asc" | "return" | "bidding" | "updated";

export interface IPO {
  id: string;
  name: string;
  category: "mainboard" | "sme";
  status: string;
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

interface IpoGroups {
  mainboard: IPO[];
  sme: IPO[];
}

interface IposResponse {
  success: boolean;
  available: boolean;
  data: IpoGroups;
  message?: string | null;
}

const fetchIpos = () => apiGet<IposResponse>("/ipos");

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All categories",
  mainboard: "Mainboard",
  sme: "SME",
};

const SORT_LABELS: Record<SortKey, string> = {
  "gmp-desc": "GMP high → low",
  "gmp-asc": "GMP low → high",
  return: "Expected return",
  bidding: "Bidding date",
  updated: "Recently updated",
};

function formatCurrency(value: number | null, decimals = 0): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
}

function formatSignedPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
    new Date(value),
  );
}

function formatUpdated(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Updated recently";
  return `Updated ${formatDistanceToNow(parsed, { addSuffix: true })}`;
}

function signedValue(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${formatCurrency(value)}`;
}

function statusClass(status: string): string {
  if (status === "Open") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  if (status === "Pending") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  if (status === "Listed") return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

function valueClass(value: number | null): string {
  if (value === null || value === 0) return "text-zinc-400";
  return value > 0 ? "text-emerald-300" : "text-rose-300";
}

function SummaryCard({ label, value, detail, icon: Icon, testId }: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  testId: string;
}) {
  return (
    <div className="group relative overflow-hidden border border-white/10 bg-[#141414] px-5 py-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20" data-testid={testId}>
      <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-white/[0.025] blur-2xl transition-transform duration-300 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500" data-testid={`${testId}-label`}>{label}</p>
          <p className="mt-3 font-mono text-2xl font-medium tabular-nums tracking-tight text-white" data-testid={`${testId}-value`}>{value}</p>
          <p className="mt-1 text-xs text-zinc-500" data-testid={`${testId}-detail`}>{detail}</p>
        </div>
        <Icon className="mt-0.5 size-4 text-zinc-600" aria-hidden="true" />
      </div>
    </div>
  );
}

const API_TIERS = [
  {
    name: "Explorer",
    price: "₹0",
    cadence: "forever",
    description: "For prototypes, student projects, and evaluating the data contract.",
    requests: "250 requests / month",
    features: ["Current IPO snapshot", "Mainboard + SME records", "Community support"],
    featured: false,
  },
  {
    name: "Builder",
    price: "₹3,749",
    cadence: "/ month",
    description: "For fintech products shipping reliable IPO intelligence to users.",
    requests: "25,000 requests / month",
    features: ["Everything in Explorer", "GMP history access", "Webhooks and email support"],
    featured: true,
  },
  {
    name: "Scale",
    price: "₹9,949",
    cadence: "/ month",
    description: "For high-volume platforms that need deeper limits and support.",
    requests: "250,000 requests / month",
    features: ["Everything in Builder", "Priority data delivery", "Usage analytics and SLA"],
    featured: false,
  },
] as const;

function ApiPricingCard({ tier, index }: { tier: (typeof API_TIERS)[number]; index: number }) {
  return (
    <article
      className={`relative flex min-h-[390px] flex-col border p-6 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 ${tier.featured ? "border-emerald-300/30 bg-emerald-300/[0.055]" : "border-white/10 bg-[#111111] hover:border-white/20"}`}
      data-testid={`api-pricing-tier-${tier.name.toLowerCase()}`}
    >
      {tier.featured ? <span className="absolute right-5 top-5 border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300" data-testid="api-pricing-popular-badge">Most popular</span> : null}
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600" data-testid={`api-pricing-tier-number-${index}`}>0{index + 1} / API tier</p>
      <h3 className="mt-5 font-heading text-xl font-semibold text-white" data-testid={`api-pricing-tier-name-${index}`}>{tier.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500" data-testid={`api-pricing-tier-description-${index}`}>{tier.description}</p>
      <div className="mt-7 flex items-end gap-2" data-testid={`api-pricing-tier-price-${index}`}>
        <span className="font-mono text-3xl font-medium tabular-nums tracking-tight text-white">{tier.price}</span>
        <span className="pb-1 text-xs text-zinc-600">{tier.cadence}</span>
      </div>
      <p className={`mt-4 border-y py-3 font-mono text-xs tabular-nums ${tier.featured ? "border-emerald-300/15 text-emerald-200" : "border-white/[0.07] text-zinc-400"}`} data-testid={`api-pricing-tier-requests-${index}`}>{tier.requests}</p>
      <ul className="mt-5 space-y-3" data-testid={`api-pricing-tier-features-${index}`}>
        {tier.features.map((feature, featureIndex) => (
          <li className="flex items-start gap-3 text-sm text-zinc-400" key={feature} data-testid={`api-pricing-tier-${index}-feature-${featureIndex}`}>
            <Check className={`mt-0.5 size-3.5 shrink-0 ${tier.featured ? "text-emerald-300" : "text-zinc-600"}`} aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-7">
        <span className="inline-flex w-full items-center justify-between border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-500" data-testid={`api-pricing-tier-availability-${index}`}>
          Access opens soon <Clock3 className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-px p-4" data-testid="ipo-table-loading">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="grid min-w-[1120px] grid-cols-[2.2fr_repeat(9,1fr)] gap-4 border-b border-white/[0.06] px-3 py-5" key={index} data-testid={`ipo-skeleton-row-${index}`}>
          {Array.from({ length: 10 }, (_, cellIndex) => (
            <div className={`h-4 animate-pulse rounded-sm bg-white/[0.06] ${cellIndex === 0 ? "w-4/5" : "w-3/5"}`} key={cellIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

function UnavailableState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="relative isolate min-h-[360px] overflow-hidden border border-amber-400/15 bg-black" data-testid="ipo-data-unavailable">
      <img
        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNDR8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBzdG9jayUyMG1hcmtldCUyMGNoYXJ0JTIwZGFya3xlbnwwfHx8fDE3ODgyMDU1NTV8MA&ixlib=rb-4.1.0&q=85"
        alt="Dark financial chart background"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
        data-testid="ipo-unavailable-background"
      />
      <div className="absolute inset-0 -z-10 bg-black/80" />
      <div className="flex min-h-[360px] flex-col items-start justify-center px-6 py-10 sm:px-12">
        <div className="mb-5 flex size-11 items-center justify-center border border-amber-300/20 bg-amber-300/10 text-amber-300" data-testid="ipo-unavailable-icon">
          <Database className="size-5" aria-hidden="true" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300/80" data-testid="ipo-unavailable-kicker">System offline</p>
        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl" data-testid="ipo-unavailable-title">Awaiting live data connection</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400" data-testid="ipo-unavailable-message">The dashboard shell is ready, but this deployment has not been connected to its Convex data source yet. No placeholder IPOs are being shown.</p>
        <Button className="mt-7 gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10" variant="outline" onClick={onRetry} data-testid="ipo-unavailable-retry-button">
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry connection
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center border border-rose-400/15 bg-rose-400/[0.03] px-6 text-center" data-testid="ipo-data-error">
      <CircleAlert className="size-8 text-rose-300" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-xl font-semibold text-white" data-testid="ipo-error-title">Unable to load IPO data</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500" data-testid="ipo-error-message">The data service did not respond. Try again without leaving the dashboard.</p>
      <Button className="mt-6 gap-2" variant="outline" onClick={onRetry} data-testid="ipo-error-retry-button">
        <RefreshCw className="size-4" aria-hidden="true" /> Retry
      </Button>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("gmp-desc");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["ipos"],
    queryFn: fetchIpos,
    refetchInterval: 180_000,
    retry: 1,
  });

  const allIpos = useMemo(() => {
    if (!data?.available) return [];
    return [...data.data.mainboard, ...data.data.sme];
  }, [data]);

  const filteredIpos = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = allIpos.filter((ipo) => {
      const matchesSearch = !query || ipo.name.toLowerCase().includes(query);
      const matchesCategory = category === "all" || ipo.category === category;
      const matchesStatus = status === "all" || ipo.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
    return result.sort((left, right) => {
      if (sort === "gmp-desc") return (right.gmp ?? -Infinity) - (left.gmp ?? -Infinity);
      if (sort === "gmp-asc") return (left.gmp ?? Infinity) - (right.gmp ?? Infinity);
      if (sort === "return") return (right.estimatedListingPercentage ?? -Infinity) - (left.estimatedListingPercentage ?? -Infinity);
      if (sort === "bidding") return (left.biddingStartDate ?? "9999").localeCompare(right.biddingStartDate ?? "9999");
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [allIpos, category, search, sort, status]);

  const openCount = allIpos.filter((ipo) => ipo.status === "Open").length;
  const pendingCount = allIpos.filter((ipo) => ipo.status === "Pending").length;
  const listedCount = allIpos.filter((ipo) => ipo.status === "Listed").length;
  const highestGmp = allIpos.reduce<number | null>((highest, ipo) => {
    if (ipo.gmp === null) return highest;
    return highest === null ? ipo.gmp : Math.max(highest, ipo.gmp);
  }, null);
  const latestUpdate = allIpos.reduce<string | null>((latest, ipo) => (!latest || ipo.updatedAt > latest ? ipo.updatedAt : latest), null);
  const isUnavailable = Boolean(data && !data.available);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setSort("gmp-desc");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" data-testid="ipo-dashboard">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl" data-testid="ipo-dashboard-header">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center border border-emerald-300/20 bg-emerald-300/10 text-emerald-300" data-testid="ipo-brand-mark">
              <TrendingUp className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold tracking-tight text-white" data-testid="ipo-brand-name">IPO GMP Tracker</p>
              <p className="hidden text-[11px] text-zinc-500 sm:block" data-testid="ipo-brand-subtitle">Live grey market premium and IPO intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5" data-testid="ipo-live-status">
            <span className="relative flex size-2" aria-hidden="true"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-emerald-300" /></span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald-300" data-testid="ipo-live-status-label">Live data</span>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-grid relative isolate overflow-hidden border-b border-white/10" data-testid="ipo-hero-section">
          <div className="hero-scanline absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" aria-hidden="true" />
          <div className="hero-orb hero-orb-one absolute -left-28 top-12 -z-20 size-80 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />
          <div className="hero-orb hero-orb-two absolute -right-24 bottom-0 -z-20 size-96 rounded-full bg-cyan-400/[0.07] blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid min-h-[630px] max-w-[1440px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-7 inline-flex items-center gap-3 border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2" data-testid="ipo-hero-eyebrow">
                <RadioTower className="size-3.5 text-emerald-300" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200">India's IPO intelligence layer</span>
              </div>
              <h1 className="font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl" data-testid="ipo-dashboard-title">
                Read the grey market<br />before the market opens.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg" data-testid="ipo-dashboard-description">Validated GMP, subscription, listing estimates, and bidding intelligence—collected server-side and shaped for faster financial decisions.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row" data-testid="ipo-hero-actions">
                <Button
                  size="lg"
                  className="group gap-2 bg-emerald-300 text-black hover:bg-emerald-200"
                  onClick={() => document.getElementById("ipo-monitor")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="ipo-hero-view-monitor-button"
                >
                  Explore live monitor
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  onClick={() => document.getElementById("api-pricing")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  data-testid="ipo-hero-api-pricing-button"
                >
                  <Braces className="size-4" aria-hidden="true" /> API pricing
                </Button>
              </div>
              <div className="mt-12 grid max-w-2xl grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3" data-testid="ipo-hero-usps">
                <div className="bg-[#0b0b0b]/90 p-4" data-testid="ipo-hero-usp-server"><ShieldCheck className="size-4 text-emerald-300" aria-hidden="true" /><p className="mt-3 text-xs font-medium text-white">Server validated</p><p className="mt-1 text-[11px] leading-5 text-zinc-600">No browser scraping</p></div>
                <div className="bg-[#0b0b0b]/90 p-4" data-testid="ipo-hero-usp-refresh"><Zap className="size-4 text-amber-300" aria-hidden="true" /><p className="mt-3 text-xs font-medium text-white">30-min refresh</p><p className="mt-1 text-[11px] leading-5 text-zinc-600">Cron-driven updates</p></div>
                <div className="bg-[#0b0b0b]/90 p-4" data-testid="ipo-hero-usp-history"><TrendingUp className="size-4 text-cyan-300" aria-hidden="true" /><p className="mt-3 text-xs font-medium text-white">GMP history</p><p className="mt-1 text-[11px] leading-5 text-zinc-600">Signal changes retained</p></div>
              </div>
            </div>

            <div className="hero-console relative mx-auto w-full max-w-xl lg:ml-auto" data-testid="ipo-hero-console">
              <div className="absolute -inset-5 -z-10 border border-emerald-300/[0.06]" aria-hidden="true" />
              <div className="border border-white/10 bg-[#101211]/90 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                  <div className="flex items-center gap-2" data-testid="ipo-hero-console-status"><span className="size-1.5 rounded-full bg-emerald-300" /><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">Signal stream</span></div>
                  <span className="font-mono text-[9px] text-zinc-700" data-testid="ipo-hero-console-version">GMP / V1.0</span>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="flex items-end justify-between border-b border-white/[0.08] pb-6">
                    <div><p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600" data-testid="ipo-hero-console-label">Market pulse</p><p className="mt-2 font-mono text-3xl font-medium tabular-nums text-white" data-testid="ipo-hero-console-value">LIVE</p></div>
                    <div className="flex h-16 items-end gap-1" aria-hidden="true">{[32, 48, 38, 61, 52, 78, 67, 91, 74, 100].map((height, index) => <span className="hero-bar w-2 bg-emerald-300/60" key={height} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />)}</div>
                  </div>
                  <div className="mt-6 space-y-3" data-testid="ipo-hero-console-pipeline">
                    {["Source HTML acquired", "Records normalized", "Convex state synchronized"].map((item, index) => (
                      <div className="flex items-center justify-between border border-white/[0.07] bg-black/20 px-4 py-3" key={item} data-testid={`ipo-hero-pipeline-step-${index}`}><div className="flex items-center gap-3"><span className="font-mono text-[9px] text-zinc-700">0{index + 1}</span><span className="text-xs text-zinc-400">{item}</span></div><Check className="size-3.5 text-emerald-300" aria-hidden="true" /></div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-700" data-testid="ipo-hero-console-foot"><span>Mainboard + SME</span><span>Failure-safe writes</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end" data-testid="ipo-dashboard-intro">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/80" data-testid="ipo-dashboard-kicker">Market intelligence / 01</p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl" data-testid="ipo-monitor-heading">Grey market signals, without the noise.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500" data-testid="ipo-monitor-description">Track current IPO pricing, estimated listing upside, and GMP movement in one disciplined view.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500" data-testid="ipo-refresh-status">
            <Activity className="size-3.5 text-emerald-300" aria-hidden="true" />
            <span>{isFetching ? "Syncing data…" : latestUpdate ? formatUpdated(latestUpdate) : "Awaiting first sync"}</span>
          </div>
        </section>

        <section className="mb-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="ipo-summary-section">
          <SummaryCard label="Total IPOs" value={data?.available ? String(allIpos.length) : "—"} detail="Active records" icon={Database} testId="ipo-summary-total" />
          <SummaryCard label="Open" value={data?.available ? String(openCount) : "—"} detail="Open for bidding" icon={Activity} testId="ipo-summary-open" />
          <SummaryCard label="Pending" value={data?.available ? String(pendingCount) : "—"} detail="Awaiting allotment" icon={CalendarDays} testId="ipo-summary-pending" />
          <SummaryCard label="Listed" value={data?.available ? String(listedCount) : "—"} detail="Recently listed" icon={ArrowUpRight} testId="ipo-summary-listed" />
          <SummaryCard label="Highest GMP" value={data?.available ? formatCurrency(highestGmp) : "—"} detail="Current premium" icon={TrendingUp} testId="ipo-summary-highest-gmp" />
        </section>

        <section className="mb-5 flex flex-col gap-4 border border-white/10 bg-[#141414] p-4 lg:flex-row lg:items-center lg:justify-between" data-testid="ipo-filter-bar">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" aria-hidden="true" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search IPOs" className="h-10 border-white/10 bg-black/20 pl-10 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-emerald-300/30" aria-label="Search IPOs" data-testid="ipo-search-input" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500" data-testid="ipo-filter-label">
              <Filter className="size-3.5" aria-hidden="true" /> Filters
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[610px]" data-testid="ipo-filter-controls">
            <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
              <SelectTrigger className="h-10 border-white/10 bg-black/20 text-xs text-zinc-300" aria-label="Filter by category" data-testid="ipo-category-select"><SelectValue>{(value) => CATEGORY_LABELS[value as Category] ?? "All categories"}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem><SelectItem value="mainboard">Mainboard</SelectItem><SelectItem value="sme">SME</SelectItem></SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
              <SelectTrigger className="h-10 border-white/10 bg-black/20 text-xs text-zinc-300" aria-label="Filter by status" data-testid="ipo-status-select"><SelectValue>{(value) => value === "all" ? "All statuses" : value}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Listed">Listed</SelectItem></SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              <SelectTrigger className="h-10 border-white/10 bg-black/20 text-xs text-zinc-300" aria-label="Sort IPOs" data-testid="ipo-sort-select"><SlidersHorizontal className="mr-2 size-3.5 text-zinc-600" aria-hidden="true" /><SelectValue>{(value) => SORT_LABELS[value as SortKey] ?? SORT_LABELS["gmp-desc"]}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem value="gmp-desc">GMP high → low</SelectItem><SelectItem value="gmp-asc">GMP low → high</SelectItem><SelectItem value="return">Expected return</SelectItem><SelectItem value="bidding">Bidding date</SelectItem><SelectItem value="updated">Recently updated</SelectItem></SelectContent>
            </Select>
          </div>
        </section>

        <section id="ipo-monitor" className="scroll-mt-24 overflow-hidden border border-white/10 bg-[#141414]" data-testid="ipo-table-section">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3"><h2 className="font-heading text-lg font-semibold tracking-tight text-white" data-testid="ipo-table-title">Current IPO monitor</h2><Badge variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-500" data-testid="ipo-table-count">{data?.available ? `${filteredIpos.length} shown` : "Live feed"}</Badge></div>
              <p className="mt-1 text-xs text-zinc-600" data-testid="ipo-table-caption">Values are sourced from the latest validated server-side scrape.</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-600"><ChevronDown className="size-3.5" aria-hidden="true" /> Scroll horizontally for more fields</div>
          </div>

          {isLoading ? <LoadingTable /> : isError ? <ErrorState onRetry={() => void refetch()} /> : isUnavailable ? <UnavailableState onRetry={() => void refetch()} /> : filteredIpos.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center" data-testid="ipo-empty-state">
              <Search className="size-7 text-zinc-600" aria-hidden="true" />
              <h3 className="mt-4 font-heading text-lg font-semibold text-white" data-testid="ipo-empty-title">No IPOs match your filters.</h3>
              <p className="mt-2 text-sm text-zinc-600" data-testid="ipo-empty-message">Try a different search, category, or status.</p>
              <Button variant="outline" className="mt-5 border-white/10 bg-white/[0.03]" onClick={resetFilters} data-testid="ipo-reset-filters-button">Reset filters</Button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[1190px]">
                <TableHeader className="bg-[#171717]">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="sticky left-0 z-10 min-w-[240px] bg-[#171717] px-5 py-4 text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-details">IPO details</TableHead>
                    <TableHead className="px-4 py-4 text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-status">Status</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-price">Price</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-gmp">GMP</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-listing">Est. listing</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-profit">Expected profit</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-lot">Lot size</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-issue">Issue size</TableHead>
                    <TableHead className="px-4 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-subscription">Subscription</TableHead>
                    <TableHead className="px-5 py-4 text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500" data-testid="ipo-table-header-bidding">Bidding period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIpos.map((ipo) => (
                    <TableRow className="group border-white/[0.07] transition-[background-color] duration-200 hover:bg-white/[0.025]" key={ipo.id} data-testid={`ipo-row-${ipo.id}`}>
                      <TableCell className="sticky left-0 z-10 bg-[#141414] px-5 py-5 group-hover:bg-[#181818]" data-testid={`ipo-name-cell-${ipo.id}`}>
                        <div className="flex min-w-[215px] items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-white/10 bg-white/[0.03] font-mono text-[10px] text-zinc-500">{ipo.name.replace(" IPO", "").slice(0, 2).toUpperCase()}</div>
                          <div className="min-w-0">
                            {ipo.sourceUrl ? <a className="group/link inline-flex max-w-[205px] items-center gap-1 font-heading text-sm font-semibold text-white hover:text-emerald-300" href={ipo.sourceUrl} target="_blank" rel="noreferrer" data-testid={`ipo-source-link-${ipo.id}`}><span className="truncate">{ipo.name.replace(/ IPO$/, "")}</span><ArrowUpRight className="size-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" aria-hidden="true" /></a> : <p className="font-heading text-sm font-semibold text-white" data-testid={`ipo-name-${ipo.id}`}>{ipo.name.replace(/ IPO$/, "")}</p>}
                            <div className="mt-1 flex items-center gap-2"><span className="font-mono text-[10px] text-zinc-600" data-testid={`ipo-updated-${ipo.id}`}>{formatUpdated(ipo.updatedAt)}</span><span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${ipo.category === "sme" ? "border-violet-300/20 bg-violet-300/10 text-violet-200" : "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"}`} data-testid={`ipo-category-${ipo.id}`}>{ipo.category === "sme" ? "SME" : "Main"}</span></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-5" data-testid={`ipo-status-cell-${ipo.id}`}><span className={`inline-flex border px-2 py-1 text-[10px] font-medium ${statusClass(ipo.status)}`} data-testid={`ipo-status-${ipo.id}`}>{ipo.status}</span></TableCell>
                      <TableCell className="px-4 py-5 text-right font-mono text-sm tabular-nums text-zinc-300" data-testid={`ipo-price-${ipo.id}`}>{formatCurrency(ipo.price)}</TableCell>
                      <TableCell className="px-4 py-5 text-right" data-testid={`ipo-gmp-${ipo.id}`}><p className={`font-mono text-sm font-medium tabular-nums ${valueClass(ipo.gmp)}`}>{signedValue(ipo.gmp)}</p><p className={`mt-1 font-mono text-[10px] tabular-nums ${valueClass(ipo.gmpPercentage)}`}>{formatSignedPercent(ipo.gmpPercentage)}</p></TableCell>
                      <TableCell className="px-4 py-5 text-right" data-testid={`ipo-listing-${ipo.id}`}><p className="font-mono text-sm font-medium tabular-nums text-zinc-200">{formatCurrency(ipo.estimatedListing)}</p><p className={`mt-1 font-mono text-[10px] tabular-nums ${valueClass(ipo.estimatedListingPercentage)}`}>{formatSignedPercent(ipo.estimatedListingPercentage)}</p></TableCell>
                      <TableCell className="px-4 py-5 text-right" data-testid={`ipo-profit-${ipo.id}`}><p className={`font-mono text-sm font-medium tabular-nums ${ipo.profitType === "loss" ? "text-rose-300" : "text-emerald-300"}`}>{signedValue(ipo.expectedProfit)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">{ipo.expectedProfit === null ? "Not available" : ipo.profitType === "loss" ? "Loss" : "Profit"}</p></TableCell>
                      <TableCell className="px-4 py-5 text-right font-mono text-sm tabular-nums text-zinc-300" data-testid={`ipo-lot-size-${ipo.id}`}>{ipo.lotSize?.toLocaleString("en-IN") ?? "—"}</TableCell>
                      <TableCell className="px-4 py-5 text-right font-mono text-sm tabular-nums text-zinc-300" data-testid={`ipo-issue-size-${ipo.id}`}>{ipo.issueSize === null ? "—" : `₹${ipo.issueSize.toLocaleString("en-IN")} Cr`}</TableCell>
                      <TableCell className="px-4 py-5 text-right font-mono text-sm tabular-nums text-zinc-300" data-testid={`ipo-subscription-${ipo.id}`}>{ipo.subscription === null ? "—" : `${ipo.subscription.toLocaleString("en-IN")}x`}</TableCell>
                      <TableCell className="px-5 py-5 text-right" data-testid={`ipo-bidding-${ipo.id}`}><p className="font-mono text-xs tabular-nums text-zinc-300">{formatDate(ipo.biddingStartDate)} <span className="text-zinc-700">→</span> {formatDate(ipo.biddingEndDate)}</p><p className="mt-1 text-[10px] text-zinc-600">UTC date anchor</p></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section id="api-pricing" className="scroll-mt-24 border-x border-b border-white/10 bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-12 lg:py-20" data-testid="api-pricing-section">
          <div className="flex flex-col justify-between gap-7 border-b border-white/10 pb-9 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2" data-testid="api-pricing-eyebrow"><Braces className="size-4 text-emerald-300" aria-hidden="true" /><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">Data API / early access</p></div>
              <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl" data-testid="api-pricing-title">Put IPO intelligence inside your product.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500" data-testid="api-pricing-description">Build screeners, alerts, research tools, and investor workflows on normalized current IPO data and GMP history.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3" data-testid="api-pricing-grid">
            {API_TIERS.map((tier, index) => <ApiPricingCard tier={tier} index={index} key={tier.name} />)}
          </div>
          <div className="mt-6 flex flex-col gap-4 border border-white/[0.08] bg-white/[0.02] px-5 py-5 sm:flex-row sm:items-center sm:justify-between" data-testid="api-pricing-enterprise-note">
            <div><p className="text-sm font-medium text-white" data-testid="api-pricing-enterprise-title">Need custom throughput or redistribution rights?</p><p className="mt-1 text-xs text-zinc-600" data-testid="api-pricing-enterprise-description">Enterprise access will support tailored limits, SLAs, and commercial data licensing.</p></div>
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500" data-testid="api-pricing-enterprise-status"><Clock3 className="size-3.5" aria-hidden="true" /> Enquiries opening soon</span>
          </div>
        </section>

        <footer className="flex flex-col gap-3 py-7 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between" data-testid="ipo-dashboard-footer">
          <span data-testid="ipo-footer-source">Source: server-side IPOTrackr scrape · Convex current state</span>
          <span className="font-mono tabular-nums" data-testid="ipo-footer-refresh">Refresh window: 3 minutes</span>
        </footer>
        </div>
      </main>
    </div>
  );
}