import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const api = `${baseUrl}/api`;
const isCiSmokeProfile = __ENV.K6_PROFILE === "ci";

export const options = {
  // CI verifies the load script and public read path without treating a shared
  // GitHub runner as a performance benchmark. The default remains the 500-VU
  // campaign used for the recorded load-test report on an isolated machine.
  stages: isCiSmokeProfile
    ? [
        { duration: "10s", target: 20 },
        { duration: "20s", target: 50 },
        { duration: "10s", target: 0 },
      ]
    : [
        { duration: "30s", target: 100 },
        { duration: "60s", target: 500 },
        { duration: "30s", target: 0 },
      ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: [isCiSmokeProfile ? "p(95)<1000" : "p(95)<500"],
  },
};

export default function () {
  const plans = http.get(`${api}/service-plans?pageNumber=1&pageSize=20`, {
    tags: { endpoint: "service-plans" },
  });
  check(plans, {
    "service plans return 200": (response) => response.status === 200,
    "service plans return JSON": (response) => response.headers["Content-Type"]?.includes("json"),
  });

  if (__ENV.RUN_ORDER_WRITE === "true" && plans.status === 200) {
    const body = JSON.parse(plans.body);
    const plan = body.items?.[0];
    const price = plan?.prices?.find((item) => item.isActive && !item.isDeleted);
    if (plan && price) {
      const quote = http.post(`${api}/pricing/quotes`, JSON.stringify({
        servicePlanId: plan.id,
        billingCycle: price.billingCycle,
        promotionCode: null,
      }), {
        headers: { "Content-Type": "application/json" },
        tags: { endpoint: "pricing-quote" },
      });
      if (quote.status === 200) {
        const quoteBody = JSON.parse(quote.body);
        http.post(`${api}/order-requests`, JSON.stringify({
          fullName: `k6-${__VU}`,
          email: `k6-${__VU}@example.invalid`,
          phone: "0900000000",
          servicePlanId: plan.id,
          billingCycle: price.billingCycle,
          promotionCode: null,
          quoteToken: quoteBody.quoteToken,
          message: "Performance test request",
        }), {
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `k6-${__VU}-${__ITER}`,
          },
          tags: { endpoint: "order-create" },
        });
      }
    }
  }

  sleep(1);
}
