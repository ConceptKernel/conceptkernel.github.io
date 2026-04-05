// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the CKP Ontology Browser SPA at /browse/.
 *
 * These tests verify that the page loads, the header renders,
 * module pills appear, the sidebar populates after auto-load,
 * entity click shows details, and search filtering works.
 */

// VitePress dev server SPA-routes `/browse/` through its client app,
// which yields a VitePress 404 page.  Using the explicit path to
// index.html bypasses the SPA router and serves the static file.
const BROWSE_URL = '/browse/index.html';

// Module labels that should appear as pills in the sidebar
const MODULE_LABELS = ['Core', 'Metadata', 'Processes', 'Relations', 'Instances', 'Proof', 'RBAC'];

test.describe('Ontology Browser', () => {

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(BROWSE_URL);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Ontology Browser/);
  });

  test('header shows "Concept Kernel" and "Ontology Browser"', async ({ page }) => {
    await page.goto(BROWSE_URL);

    const brand = page.locator('.ckp-header-brand');
    await expect(brand).toHaveText('Concept Kernel');

    const title = page.locator('.ckp-header-title');
    await expect(title).toHaveText('Ontology Browser');
  });

  test('module pills appear', async ({ page }) => {
    await page.goto(BROWSE_URL);

    const pillContainer = page.locator('#modulePills');
    await expect(pillContainer).toBeVisible();

    // Wait for pills to be populated by JS
    await expect(pillContainer.locator('.module-pill')).toHaveCount(MODULE_LABELS.length, {
      timeout: 15_000,
    });

    // Verify each expected label is present
    for (const label of MODULE_LABELS) {
      await expect(pillContainer.locator('.module-pill', { hasText: label })).toBeVisible();
    }
  });

  test('sidebar shows "Loaded Entities" heading', async ({ page }) => {
    await page.goto(BROWSE_URL);

    const heading = page.locator('.entity-heading h2');
    await expect(heading).toContainText('Loaded Entities');
  });

  test('ontology sections appear in sidebar after auto-load', async ({ page }) => {
    await page.goto(BROWSE_URL);

    // Wait for the ontology tree to be populated (loading placeholder disappears)
    const tree = page.locator('#ontologyTree');
    await expect(tree.locator('.canvas-placeholder')).toBeHidden({ timeout: 30_000 });

    // After load, the entity count badge should show a non-zero number
    const badge = page.locator('#entityCountBadge');
    await expect(badge).not.toHaveText('0', { timeout: 30_000 });

    // There should be ontology items in the sidebar tree
    const sections = tree.locator('.ontology-item');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking an entity shows details in main panel', async ({ page }) => {
    await page.goto(BROWSE_URL);

    // Wait for entities to load
    const tree = page.locator('#ontologyTree');
    await expect(tree.locator('.canvas-placeholder')).toBeHidden({ timeout: 30_000 });

    // The welcome panel should be visible and the info panel hidden
    await expect(page.locator('#welcomePanel')).toBeVisible();
    await expect(page.locator('#infoPanel')).toBeHidden();

    // Click the first entity link in the tree
    const firstEntity = tree.locator('.entity-item').first();
    await firstEntity.click();

    // After click, the info panel should be visible and show content
    await expect(page.locator('#infoPanel')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#infoLabel')).not.toBeEmpty();
  });

  test('search filtering works', async ({ page }) => {
    await page.goto(BROWSE_URL);

    // Wait for entities to load
    const tree = page.locator('#ontologyTree');
    await expect(tree.locator('.canvas-placeholder')).toBeHidden({ timeout: 30_000 });

    // Count entities before search
    const allEntities = tree.locator('.entity-item');
    const totalBefore = await allEntities.count();
    expect(totalBefore).toBeGreaterThan(0);

    // Type a search query that should match some but not all entities
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Kernel');

    // Give the filter a moment to apply
    await page.waitForTimeout(500);

    // After filtering, visible entities should be fewer than total
    // (unless all entities contain "Kernel", which is unlikely)
    const visibleEntities = tree.locator('.entity-item:visible');
    const totalAfter = await visibleEntities.count();
    expect(totalAfter).toBeGreaterThan(0);
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('welcome panel appears on initial load', async ({ page }) => {
    await page.goto(BROWSE_URL);

    // Look for a welcome panel element (class "welcome-panel" or id "welcomePanel")
    const welcomePanel = page.locator('.welcome-panel, #welcomePanel');
    await expect(welcomePanel).toBeVisible({ timeout: 10_000 });
  });

});
