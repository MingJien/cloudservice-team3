import { expect, test } from "@playwright/test";

test("customer can open the catalog and order form", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MekongNode|Cloud/i);
  await page.getByRole("link", { name: /đặt dịch vụ|báo giá/i }).first().click();
  await expect(page).toHaveURL(/\/(order|pricing)/);
  await expect(page.getByRole("heading", { name: /đặt dịch vụ|báo giá/i }).first()).toBeVisible();
});

test("invalid order input is rejected before a network submit", async ({ page }) => {
  const writeRequests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/pricing/quote") || path.endsWith("/order-requests")) writeRequests.push(path);
  });

  await page.goto("/order");
  const planSelect = page.getByRole("combobox", { name: /^gói dịch vụ$/i });
  await expect(planSelect).toBeVisible();
  await expect.poll(async () => planSelect.locator("option").count()).toBeGreaterThan(1);
  await planSelect.selectOption({ index: 1 });
  await page.getByLabel(/^họ và tên$/i).fill("Khách hàng kiểm thử");
  await page.getByLabel(/^email$/i).fill("test@example.com");
  await page.getByLabel(/^số điện thoại$/i).fill("123");
  await page.getByRole("button", { name: /^gửi yêu cầu$/i }).click();
  await expect(page.getByText(/số điện thoại không hợp lệ/i).first()).toBeVisible();
  expect(writeRequests).toHaveLength(0);
});

test("admin login and dashboard are reachable when demo seed is enabled", async ({ page }) => {
  test.skip(!process.env.RUN_E2E_ADMIN, "Set RUN_E2E_ADMIN=true to exercise the seeded admin flow.");
  await page.goto("/admin/login");
  await page.getByLabel(/tên đăng nhập hoặc email/i).fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel(/^mật khẩu$/i).fill(process.env.E2E_ADMIN_PASSWORD ?? "ad123");
  await page.getByRole("button", { name: /xác nhận truy cập/i }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText(/dashboard|tổng quan|yêu cầu đặt dịch vụ/i).first()).toBeVisible();
});
