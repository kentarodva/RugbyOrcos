import { test, expect } from '@playwright/test';

test.describe('Invitación pública — sin login', () => {
  test('token inexistente muestra error amigable', async ({ page }) => {
    await page.goto('/invitacion/noexiste');

    // Debe mostrar error sin pedir login
    await expect(page.locator('text=Invitacion no disponible')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Invitacion no encontrada o expirada.')).toBeVisible();
  });

  test('link con query params limpia el token', async ({ page }) => {
    await page.goto('/invitacion/test123?from=whatsapp');

    // Debe intentar cargar (aunque falle, no debe mostrar error de link inválido)
    await expect(page.locator('text=Invitacion no disponible')).toBeVisible({ timeout: 5000 });
  });

  test('link con trailing slash funciona', async ({ page }) => {
    await page.goto('/invitacion/test123/');

    await expect(page.locator('text=Invitacion no disponible')).toBeVisible({ timeout: 5000 });
  });

  test('ruta /invitation/ (inglés) también funciona', async ({ page }) => {
    await page.goto('/invitation/test123');

    await expect(page.locator('text=Invitacion no disponible')).toBeVisible({ timeout: 5000 });
  });

  test('página de invitación no redirige al login', async ({ page }) => {
    await page.goto('/invitacion/test');

    // NO debe mostrar el botón de login
    await expect(page.locator('button:has-text("Entrar al Reino")')).not.toBeVisible({ timeout: 3000 });
    // Debe mostrar contenido de invitación
    await expect(page.locator('text=Rugby Orcos Negros')).toBeVisible({ timeout: 5000 });
  });
});
