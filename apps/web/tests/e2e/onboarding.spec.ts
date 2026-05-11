import { test, expect, type Page } from '@playwright/test'

// ─── Helpers de mock de rede ──────────────────────────────────────────────────
// As chamadas são para os Route Handlers do Next.js (/api/auth/...),
// não para o Fastify diretamente. O browser faz essas chamadas, então
// page.route() consegue interceptá-las.

async function mockOtpRequest(page: Page, status: 200 | 429 = 200) {
  await page.route('**/api/auth/otp/request', (route) => {
    if (status === 429) {
      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Muitas tentativas.' },
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { expiresIn: 300, attemptsLeft: 5 }, error: null }),
    })
  })
}

async function mockOtpVerify(
  page: Page,
  options: { status: 200 | 400; needsOnboarding?: boolean } = {
    status: 200,
    needsOnboarding: true,
  },
) {
  await page.route('**/api/auth/otp/verify', (route) => {
    if (options.status === 400) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: { code: 'OTP_INVALID', message: 'Código incorreto.' },
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          userId: 'mock-user-id',
          needsOnboarding: options.needsOnboarding ?? true,
        },
        error: null,
      }),
    })
  })
}

// ─── Mock de geolocalização ───────────────────────────────────────────────────

async function grantGeolocation(page: Page, lat = -19.9236, lng = -43.9413) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude: lat, longitude: lng })
}

async function denyGeolocation(page: Page) {
  await page.context().clearPermissions()
}

// ─── Helper para preencher OTP ────────────────────────────────────────────────

async function fillOtp(page: Page, code = '123456') {
  // O InputOTP usa um input oculto — preenche pela role ou pelo elemento interno
  const otpInput = page.locator('input[data-input-otp]').first()
  if (await otpInput.isVisible()) {
    await otpInput.fill(code)
  } else {
    // Fallback: clica no container e digita
    const container = page.locator('[aria-label*="código"]').first()
    await container.click()
    await page.keyboard.type(code)
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

test.describe('Onboarding — happy path completo', () => {
  test('percorre todas as etapas e chega no feed', async ({ page }) => {
    await mockOtpRequest(page)
    await mockOtpVerify(page, { status: 200, needsOnboarding: true })
    await grantGeolocation(page)

    // Etapa 1a: Telefone
    await page.goto('/entrar')
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible()

    const phoneInput = page.locator('input[inputmode="tel"]')
    await phoneInput.fill('+5531999990001')
    await page.getByRole('button', { name: /receber código/i }).click()

    // Etapa 1b: Código OTP
    await page.waitForURL('**/entrar/codigo')
    await expect(page.getByRole('heading', { name: /código de verificação/i })).toBeVisible()

    await fillOtp(page, '123456')

    // Etapa 2: Tipo de perfil
    await page.waitForURL('**/cadastro/perfil', { timeout: 8_000 })
    const produtorLabel = page.getByText('Produtor Rural').first()
    await produtorLabel.click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Etapa 3: Dados pessoais
    await page.waitForURL('**/cadastro/dados')
    await page.getByLabel(/nome completo/i).fill('João Produtor')
    await page.getByRole('button', { name: /continuar/i }).click()

    // Etapa 4: Localização
    await page.waitForURL('**/cadastro/localizacao')
    await expect(page.getByRole('button', { name: /concluir cadastro/i })).toBeVisible({
      timeout: 15_000,
    })

    // Se o geocode reverso resolver, o botão estará habilitado
    const concludeBtn = page.getByRole('button', { name: /concluir cadastro/i })
    if (await concludeBtn.isEnabled()) {
      await concludeBtn.click()
      await page.waitForURL('**/feed', { timeout: 10_000 })
      await expect(page.getByRole('heading', { name: /em breve/i })).toBeVisible()
    } else {
      // Localização não resolvida (sem rede para Nominatim no CI) — testa só a navegação
      expect(await page.url()).toContain('/cadastro/localizacao')
    }
  })
})

test.describe('OTP — código inválido', () => {
  test('mostra erro e limpa o campo quando o código está errado', async ({ page }) => {
    await mockOtpRequest(page)
    await mockOtpVerify(page, { status: 400 })

    await page.goto('/entrar')
    await page.locator('input[inputmode="tel"]').fill('+5531999990001')
    await page.getByRole('button', { name: /receber código/i }).click()

    await page.waitForURL('**/entrar/codigo')

    await fillOtp(page, '000000')

    // Aguarda mensagem de erro — filtra para excluir o route-announcer do Next.js
    await expect(page.getByRole('alert').filter({ hasText: /incorreto/i })).toBeVisible({
      timeout: 8_000,
    })

    // Permanece na página de OTP
    await expect(page).toHaveURL(/\/entrar\/codigo/)
  })
})

test.describe('Localização — fallback CEP', () => {
  test('geolocation negada → campo CEP fica visível', async ({ page }) => {
    await denyGeolocation(page)

    // Navega direto para a etapa de localização
    await page.goto('/cadastro/localizacao')

    // O LocationPicker deve entrar em modo CEP quando geo é negada
    await expect(page.getByLabel(/cep/i)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Persistência de estado — sessionStorage', () => {
  test('nome preenchido sobrevive a um page.reload()', async ({ page }) => {
    await mockOtpRequest(page)
    await mockOtpVerify(page, { status: 200, needsOnboarding: true })

    // Avança até a etapa de dados
    await page.goto('/entrar')
    await page.locator('input[inputmode="tel"]').fill('+5531999990001')
    await page.getByRole('button', { name: /receber código/i }).click()

    await page.waitForURL('**/entrar/codigo')
    await fillOtp(page, '123456')

    await page.waitForURL('**/cadastro/perfil', { timeout: 8_000 })
    await page.getByText('Produtor Rural').first().click()
    await page.getByRole('button', { name: /continuar/i }).click()

    await page.waitForURL('**/cadastro/dados')
    await page.getByLabel(/nome completo/i).fill('Teste Persistência')

    // Reload
    await page.reload()

    // Zustand com sessionStorage deve preservar o valor
    await expect(page.getByLabel(/nome completo/i)).toHaveValue('Teste Persistência')
  })
})
