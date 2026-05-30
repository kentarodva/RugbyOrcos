import { test, expect } from '@playwright/test';

test.describe('Login — UI sin autenticación real', () => {
  test('pantalla de login renderiza correctamente', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=RUGBY ORCOS NEGROS')).toBeVisible();
    await expect(page.locator('text=Usuario o Email')).toBeVisible();
    await expect(page.locator('text=Contrasena')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar al Reino")')).toBeVisible();
    await expect(page.locator('button:has-text("Fundar un Nuevo Reino")')).toBeVisible();
  });

  test('Fundar Reino muestra campos adicionales', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Fundar un Nuevo Reino")');

    await expect(page.locator('text=Fundar un Nuevo Reino')).toBeVisible();
    await expect(page.locator('text=Nombre en el Reino')).toBeVisible();
    await expect(page.locator('button:has-text("Fundar el Reino")')).toBeVisible();
  });

  test('volver de Fundar Reino al login', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Fundar un Nuevo Reino")');
    await page.click('text=Volver al inicio de sesion');

    await expect(page.locator('button:has-text("Entrar al Reino")')).toBeVisible();
  });

  test('muestra error con campos vacíos', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Entrar al Reino")');

    await expect(page.locator('text=Completa todos los campos')).toBeVisible();
  });

  test('login fallido muestra error', async ({ page }) => {
    await page.goto('/');
    // Selector por label en vez de placeholder
    await page.locator('input[type="text"]').first().fill('noexiste@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.click('button:has-text("Entrar al Reino")');

    await expect(page.locator('text=Usuario o contrasena incorrectos')).toBeVisible({ timeout: 8000 });
  });

  test('modo Guerrero detecta username sin @', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="text"]').first().fill('freyder.andres');

    await expect(page.locator('text=Ingresando como Guerrero')).toBeVisible();
  });
});
