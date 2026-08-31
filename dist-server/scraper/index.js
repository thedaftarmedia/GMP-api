import "dotenv/config";
import { upsertIpo } from "./convexClient.js";
import { fetchAndParseSource } from "./source.js";
import { pathToFileURL } from "node:url";
export async function runIPOScraper() {
    console.log("[SCRAPER] Starting IPO scrape");
    const records = await fetchAndParseSource();
    const mainboard = records.filter((record) => record.category === "mainboard");
    const sme = records.filter((record) => record.category === "sme");
    console.log(`[SCRAPER] Source fetched successfully: ${records.length} valid records`);
    console.log(`[SCRAPER] Mainboard records: ${mainboard.length}`);
    console.log(`[SCRAPER] SME records: ${sme.length}`);
    if (mainboard.length === 0 && sme.length === 0) {
        throw new Error("Scrape validation failed: zero valid IPO records; existing Convex data was not touched.");
    }
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let historyRecordsCreated = 0;
    let recordsSkipped = 0;
    for (const record of records) {
        try {
            const result = await upsertIpo(record);
            if (result.action === "created")
                recordsCreated += 1;
            else
                recordsUpdated += 1;
            if (result.historyCreated)
                historyRecordsCreated += 1;
        }
        catch (error) {
            recordsSkipped += 1;
            console.error(`[SCRAPER] Skipped ${record.name}: ${error.message}`);
        }
    }
    if (recordsSkipped === records.length) {
        throw new Error("All Convex writes failed; existing data was preserved.");
    }
    const result = {
        recordsScraped: records.length,
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        historyRecordsCreated,
        mainboardValid: mainboard.length,
        smeValid: sme.length,
    };
    console.log(`[SCRAPER] Records created: ${recordsCreated}`);
    console.log(`[SCRAPER] Records updated: ${recordsUpdated}`);
    console.log(`[SCRAPER] Records skipped: ${recordsSkipped}`);
    console.log(`[SCRAPER] GMP history records: ${historyRecordsCreated}`);
    console.log("[SCRAPER] Scrape completed successfully");
    return result;
}
if (process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href) {
    runIPOScraper().catch((error) => {
        console.error(`[SCRAPER] Failed: ${error instanceof Error
            ? error.message
            : error}`);
        process.exitCode = 1;
    });
}
