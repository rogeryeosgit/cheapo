import { expect, test } from "@playwright/test";

test("search form validates required postal code through the API", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Product" }).fill("Meiji Low Fat Milk");
  await page.getByRole("button", { name: "Find cheapest" }).click();
  await expect(page.getByText("Enter a valid 6-digit Singapore postal code.")).toBeVisible();
});

test("search page exposes core controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the cheapest visible price before you shop." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Product" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Singapore postal code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Find cheapest" })).toBeVisible();
});
