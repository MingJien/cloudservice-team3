import { apiFetch } from "@/lib/api-client";
import type { RecommendationRequest, RecommendationResponse } from "./types";

export function requestRecommendations(request: RecommendationRequest) {
  return apiFetch<RecommendationResponse>("/service-plan-recommendations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
