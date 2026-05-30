import { test, expect } from '@playwright/test';

test.describe('Navegación básica — sin login', () => {
  test('el HTML base carga correctamente', async ({ page }) => {
    await page.goto('/');

    // Verificar elementos estructurales
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('img[alt="Rugby Orcos Negros"]')).toBeVisible();
  });

  test('el manifest PWA es accesible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.name).toContain('Rugby');
  });

  test('meta tags PWA están presentes', async ({ page }) => {
    await page.goto('/');
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#00e676');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('viewport-fit=cover');
  });

  test('meta description para SEO', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('Rugby');
  });

  test('apple-touch-icon existe', async ({ page }) => {
    await page.goto('/');
    const icon = page.locator('link[rel="apple-touch-icon"]').first();
    await expect(icon).toBeAttached();
  });
});
