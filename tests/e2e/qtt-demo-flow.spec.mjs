import { expect, test } from '@playwright/test'

const email = process.env.DEMO_EMAIL
const password = process.env.DEMO_PASSWORD
const apiPort = process.env.TAXMATE_API_PORT ?? '5087'
const frontendApiPort = process.env.TAXMATE_FRONTEND_API_PORT ?? '5086'
const targetBusiness = /Bếp Hoàng Nam.*Cơ sở 1/

test('demo login reaches QTT readiness gate without changing tax data', async ({ page }) => {
  expect(email, 'Set DEMO_EMAIL in the test environment').toBeTruthy()
  expect(password, 'Set DEMO_PASSWORD in the test environment').toBeTruthy()

  const unexpectedWrites = []

  // The checked-in frontend defaults to :5086, while this demo API is running
  // on :5087. Rewrite only that local API origin; other URLs pass through.
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.port === frontendApiPort) {
      url.port = apiPort
      await route.continue({ url: url.toString() })
      return
    }
    await route.continue()
  })

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.port !== apiPort || ['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return
    if (request.method() === 'POST' && /\/api\/auth\/login$/i.test(url.pathname)) return
    unexpectedWrites.push(`${request.method()} ${url.pathname}`)
  })

  await page.goto('/login')
  await page.getByPlaceholder('Số điện thoại/Email').fill(email)
  await page.getByPlaceholder('Mật khẩu').fill(password)
  const loginResponsePromise = page.waitForResponse((response) => {
    return /\/api\/auth\/login$/i.test(new URL(response.url()).pathname)
  })
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  const loginResponse = await loginResponsePromise
  expect(loginResponse.status(), 'Demo login endpoint must accept the supplied account').toBe(200)
  await expect(page).toHaveURL(/\/business-owner\/home(?:$|\?)/)

  // The account opens its profile drawer to choose the specific demo branch.
  await page.locator('button:has(svg.lucide-user)').click()
  const branchChoice = page.getByText(targetBusiness, { exact: true }).last()
  await expect(branchChoice).toBeVisible()
  await branchChoice.click()
  await page.locator('div.fixed.inset-0.z-50 > div.absolute.inset-0').click()

  await page.getByText('Sổ sách', { exact: true }).click()
  await page.getByRole('menuitem', { name: 'QTT — Quyết toán TNCN' }).click()

  await expect(page).toHaveURL(/\/business-owner\/tax-books\/qtt/)
  await expect(page.getByRole('heading', { name: 'Quyết toán thuế TNCN', exact: true })).toBeVisible()
  await expect(page.getByLabel('Năm')).toHaveValue('2026')
  await expect(page.getByRole('heading', { name: /Kê khai thuế năm 2026/ })).toBeVisible()
  await expect(page.getByText('Chưa đóng kỳ', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Xác nhận rà soát chi phí S2c', exact: true })).toBeVisible()
  await expect(page.getByText(/Cần hoàn tất đóng đủ 4 Quý trong năm/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chưa đủ điều kiện tính quyết toán' })).toBeDisabled()

  // This snapshot has no saved annual calculation, so the overpayment
  // allocation controls should not be present at this readiness gate.
  await expect(page.getByText('Đề nghị hoàn [22]', { exact: true })).toHaveCount(0)
  expect(unexpectedWrites).toEqual([])
})
