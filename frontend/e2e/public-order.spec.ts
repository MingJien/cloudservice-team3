import { expect, test } from "@playwright/test";

test("customer can open the catalog and order form", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/MekongNode|Cloud/i);
  await page.getByRole("link", { name: /đặt dịch vụ|báo giá/i }).first().click();
  await expect(page).toHaveURL(/\/(order|pricing)/);
  await expect(page.getByRole("heading", { name: /đặt dịch vụ|báo giá/i }).first()).toBeVisible();
});

test("invalid order input is rejected before a network submit", async ({ page }) => {
  await page.goto("/order");
  await page.getByRole("button", { name: /gửi yêu cầu/i }).click();
  await expect(page.getByText(/chọn gói dịch vụ/i)).toBeVisible();
});

test("admin login and dashboard are reachable when demo seed is enabled", async ({ page }) => {
  test.skip(!process.env.RUN_E2E_ADMIN, "Set RUN_E2E_ADMIN=true to exercise the seeded admin flow.");
  await page.goto("/admin/login");
  await page.getByLabel(/tên đăng nhập hoặc email/i).fill(process.env.E2E_ADMIN_USERNAME ?? "admin");
  await page.getByLabel(/mật khẩu/i).fill(process.env.E2E_ADMIN_PASSWORD ?? "ad123");
  await page.getByRole("button", { name: /xác nhận truy cập/i }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText(/dashboard|tổng quan|yêu cầu đặt dịch vụ/i).first()).toBeVisible();
});
