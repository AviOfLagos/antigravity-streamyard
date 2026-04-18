/**
 * Playwright script to provision Upstash Redis via console.upstash.com
 * Uses existing Chrome profile to leverage any existing Google sessions
 */
import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";

const CHROME_USER_DATA = `${process.env.HOME}/Library/Application Support/Google/Chrome`;
const OUTPUT_FILE = "/tmp/upstash-credentials.json";
const DB_NAME = "Zerocast-redis";
const REGION = "us-east-1";

async function main() {
  console.log("Launching browser with existing Chrome profile...");

  const browser = await chromium
    .launchPersistentContext(CHROME_USER_DATA, {
      headless: false,
      channel: "chrome",
      args: ["--no-first-run", "--no-default-browser-check"],
      ignoreDefaultArgs: ["--enable-automation"],
    })
    .catch(async (err) => {
      console.log(
        "Chrome launch failed, trying headless chromium:",
        err.message
      );
      return chromium.launch({ headless: true });
    });

  let page;
  if (browser.newPage) {
    // It's a Browser, not BrowserContext
    page = await browser.newPage();
  } else {
    // It's a BrowserContext (persistent)
    page = await browser.newPage();
  }

  try {
    console.log("Navigating to Upstash console...");
    await page.goto("https://console.upstash.com", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Take a screenshot to see current state
    await page.screenshot({ path: "/tmp/upstash-1-initial.png" });
    console.log("Screenshot saved: /tmp/upstash-1-initial.png");

    const url = page.url();
    console.log("Current URL:", url);

    // Check if we're already logged in or need to sign in
    if (url.includes("auth") || url.includes("login") || url.includes("sign")) {
      console.log("Not logged in - trying Google OAuth...");

      // Look for Google sign-in button
      const googleBtn = await page
        .locator(
          'text=/google/i, button:has-text("Google"), a:has-text("Google")'
        )
        .first();
      if (await googleBtn.isVisible({ timeout: 5000 })) {
        await googleBtn.click();
        await page.waitForLoadState("networkidle", { timeout: 30000 });
        await page.screenshot({ path: "/tmp/upstash-2-after-google.png" });
        console.log("Screenshot: /tmp/upstash-2-after-google.png");
      } else {
        console.log("No Google button found, current page text:");
        console.log(await page.textContent("body"));
      }
    } else {
      console.log("Already on Upstash console (may be logged in)");
    }

    await page.screenshot({ path: "/tmp/upstash-3-dashboard.png" });
    console.log("Current URL after auth:", page.url());
    console.log("Page title:", await page.title());

    // Wait to see if we land on dashboard
    await page
      .waitForURL("**/console.upstash.com**", { timeout: 15000 })
      .catch(() => {});

    const currentUrl = page.url();
    console.log("Final URL:", currentUrl);
    await page.screenshot({ path: "/tmp/upstash-4-final.png" });

    // Check if we're on the main dashboard
    if (
      currentUrl.includes("console.upstash.com") &&
      !currentUrl.includes("auth")
    ) {
      console.log("SUCCESS: On Upstash dashboard!");

      // Look for "Create Database" button
      const createBtn = await page
        .locator(
          'button:has-text("Create"), a:has-text("Create Database"), button:has-text("New Database")'
        )
        .first();
      if (await createBtn.isVisible({ timeout: 5000 })) {
        console.log("Found Create Database button, clicking...");
        await createBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "/tmp/upstash-5-create.png" });

        // Fill in database name
        const nameInput = await page
          .locator('input[placeholder*="name" i], input[name="name"]')
          .first();
        if (await nameInput.isVisible({ timeout: 5000 })) {
          await nameInput.fill(DB_NAME);
          console.log("Filled database name:", DB_NAME);
        }

        // Select region us-east-1
        await page.screenshot({ path: "/tmp/upstash-6-name-filled.png" });

        // Try to find and select us-east-1 region
        const regionOption = await page
          .locator(`text=us-east-1, text=N. Virginia, text=US East`)
          .first();
        if (await regionOption.isVisible({ timeout: 5000 })) {
          await regionOption.click();
          console.log("Selected us-east-1 region");
        }

        await page.screenshot({ path: "/tmp/upstash-7-region.png" });

        // Click Create/Submit
        const submitBtn = await page
          .locator('button[type="submit"], button:has-text("Create")')
          .last();
        if (await submitBtn.isVisible({ timeout: 5000 })) {
          await submitBtn.click();
          console.log("Clicked Create button");
          await page.waitForTimeout(5000);
          await page.screenshot({ path: "/tmp/upstash-8-created.png" });
        }

        // Navigate to database details to get credentials
        await page.waitForTimeout(3000);

        // Look for the new database link
        const dbLink = await page.locator(`text=${DB_NAME}`).first();
        if (await dbLink.isVisible({ timeout: 10000 })) {
          await dbLink.click();
          await page.waitForLoadState("networkidle");
          await page.screenshot({ path: "/tmp/upstash-9-db-details.png" });

          // Try to find REST URL and Token
          const pageText = await page.textContent("body");
          console.log("=== DATABASE DETAILS PAGE TEXT ===");
          console.log(pageText.substring(0, 5000));

          // Look for REST URL
          const restUrlEl = await page
            .locator("text=UPSTASH_REDIS_REST_URL")
            .first();
          if (await restUrlEl.isVisible({ timeout: 5000 })) {
            // Get the value next to the label
            await page.screenshot({ path: "/tmp/upstash-10-credentials.png" });
            console.log("Found REST URL section");
          }
        }
      } else {
        console.log("No Create Database button found. Page content:");
        const text = await page.textContent("body");
        console.log(text.substring(0, 3000));
      }
    } else {
      console.log("Not on Upstash dashboard. Current URL:", currentUrl);
      const bodyText = await page.textContent("body").catch(() => "N/A");
      console.log("Page text:", bodyText.substring(0, 2000));
    }
  } catch (err) {
    console.error("Error:", err.message);
    await page.screenshot({ path: "/tmp/upstash-error.png" }).catch(() => {});
  } finally {
    // Keep browser open for 5 seconds to see final state
    await page.waitForTimeout(3000);
    if (browser.close) await browser.close();
  }
}

main().catch(console.error);
