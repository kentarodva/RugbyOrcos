import { test, expect } from '@playwright/test';

test('página de login muestra el formulario', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Ingresa al Reino')).toBeVisible({ timeout: 10000 });
});

test('intento de login con credenciales vacías muestra error', async ({ page }) => {
  await page.goto('/');
  await page.click('button[type="submit"]');
  await expect(page.locator('input:invalid')).toHaveCount(1);
});
