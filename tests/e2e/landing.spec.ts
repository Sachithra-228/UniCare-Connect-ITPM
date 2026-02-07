import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "UniCare Connect helps Sri Lankan students thrive academically, financially, and emotionally." })).toBeVisible();
});

test("navigate to financial aid page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Apply for aid" }).click();
  await expect(page.getByRole("heading", { name: "Apply for academic aid and daily necessities" })).toBeVisible();
});
