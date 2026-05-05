import { expect, test } from "@playwright/test"

test.describe("auth smoke", () => {
  test("landing redirect / → /es y muestra trust badge", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/es\/?$/)
    await expect(page.getByText(/Sandbox Phase 2/i)).toBeVisible()
  })

  test("complaint banner es visible en home", async ({ page }) => {
    await page.goto("/es")
    await expect(page.getByRole("region", { name: /sandbox compliance notice/i })).toBeVisible()
    await expect(
      page.getByText(/utahinnovationoffice\.org\/sandbox-customer-complaint/i),
    ).toBeVisible()
  })

  test("login muestra formulario y redirige a register", async ({ page }) => {
    await page.goto("/es/login")
    await expect(page.getByRole("heading", { name: /iniciar sesión/i })).toBeVisible()
    await expect(page.getByLabel(/correo/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()

    await page.getByRole("link", { name: /reg[íi]strate/i }).click()
    await expect(page).toHaveURL(/\/es\/register/)
  })

  test("locale en muestra UI en inglés", async ({ page }) => {
    await page.goto("/en/login")
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test("dashboard sin sesión redirige a login", async ({ page }) => {
    await page.goto("/es/dashboard")
    await expect(page).toHaveURL(/\/es\/login/)
  })

  test("manifest endpoint sirve JSON con start_url /es", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest")
    expect(response.ok()).toBe(true)
    const json = await response.json()
    expect(json.start_url).toBe("/es")
    expect(json.display).toBe("standalone")
    expect(Array.isArray(json.icons)).toBe(true)
  })

  test("services page lista 3 categorías y al menos 1 servicio cada una", async ({ page }) => {
    await page.goto("/es/services")
    await expect(page.getByRole("heading", { name: /servicios disponibles/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /familia/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /vivienda/i })).toBeVisible()
    await expect(page.getByRole("heading", { name: /empresarial/i })).toBeVisible()
  })

  test("ficha de servicio individual muestra precio y CTA Iniciar caso", async ({ page }) => {
    await page.goto("/es/services/uncontested-divorce")
    await expect(page.getByRole("heading", { name: /divorcio sin disputa/i })).toBeVisible()
    await expect(page.getByText("$299")).toBeVisible()
    await expect(page.getByRole("link", { name: /iniciar este caso/i })).toBeVisible()
  })

  test("admin sin sesión va a login", async ({ page }) => {
    await page.goto("/es/admin")
    await expect(page).toHaveURL(/\/es\/login/)
  })

  test("onboarding sin sesión va a login", async ({ page }) => {
    await page.goto("/es/onboarding")
    await expect(page).toHaveURL(/\/es\/login/)
  })
})
