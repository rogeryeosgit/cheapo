import { expect, test } from "@playwright/test";

test("search form validates product query", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Product" }).fill("a");
  await page.getByRole("button", { name: "Find cheapest" }).click();
  await expect(page.getByText("Enter a product search between 2 and 120 characters.")).toBeVisible();
});

test("search page exposes core controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Find the cheapest visible price before you shop." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Product" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Find cheapest" })).toBeVisible();
});
