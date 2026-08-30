import { adminFetch, apiFetch } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";

export interface NewsCategory { id: number; name: string; slug: string; description: string | null; isActive: boolean; publishedArticleCount: number; totalArticleCount: number; }
export interface Article { id: number; categoryId: number; categoryName: string; categorySlug: string; title: string; slug: string; summary: string | null; content: string; thumbnailUrl: string | null; authorName: string | null; publishedAt: string | null; isPublished: boolean; isDeleted: boolean; viewCount: number; createdAt: string; updatedAt: string | null; }
export type TestimonialModerationStatus = "Pending" | "Published" | "Hidden";
export interface Testimonial { id: number; customerName: string; companyName: string | null; position: string | null; content: string; avatarUrl: string | null; logoUrl: string | null; rating: number; displayOrder: number; isActive: boolean; isVerifiedOrder: boolean; isFeaturedCustomer: boolean; orderReference: string | null; servicePlanName: string | null; serviceCategoryName: string | null; moderationStatus: TestimonialModerationStatus; createdAt: string; }
export interface TestimonialSubmission { id: number; isPendingModeration: boolean; isFeaturedCustomer: boolean; message: string; }
export type ContactResponderRole = "Admin" | "Editor";
export interface Contact { id: number; trackingCode: string; fullName: string; email: string; phone: string | null; subject: string; message: string; adminReply: string | null; repliedByRole: ContactResponderRole | null; status: "New" | "Read" | "Replied"; createdAt: string; updatedAt: string | null; repliedAt: string | null; parentContactRequestId: number | null; parentSubject: string | null; followUpCount: number; }
export interface PublicContactStatus { trackingCode: string; subject: string; status: Contact["status"]; adminReply: string | null; repliedByRole: ContactResponderRole | null; createdAt: string; repliedAt: string | null; }
export interface PublicQnAFollowUp { id: number; fullName: string; message: string; adminReply: string; repliedByRole: ContactResponderRole | null; createdAt: string; repliedAt: string | null; }
export interface PublicQnA { id: number; fullName: string; subject: string; message: string; adminReply: string; repliedByRole: ContactResponderRole | null; createdAt: string; repliedAt: string | null; followUps: PublicQnAFollowUp[]; }
export function getArticles(query = "pageNumber=1&pageSize=10") { return apiFetch<Page<Article>>(`/news-articles?${query}`); }
export function getArticle(slug: string) { return apiFetch<Article>(`/news-articles/${encodeURIComponent(slug)}`); }
export function getNewsCategories() { return apiFetch<Page<NewsCategory>>("/news-categories?pageNumber=1&pageSize=50"); }
export function getAdminNewsCategories(query = "pageNumber=1&pageSize=100") { return adminFetch<Page<NewsCategory>>(`/admin/news-categories?${query}`); }
export function createContact(body: unknown) { return apiFetch<Contact>("/contact-requests", { method: "POST", body: JSON.stringify(body) }); }
export function getContactStatus(trackingCode: string) { return apiFetch<PublicContactStatus>(`/contact-requests/tracking/${encodeURIComponent(trackingCode)}`, { cache: "no-store" }); }
export function getPublicQnAs(query = "pageNumber=1&pageSize=10") { return apiFetch<Page<PublicQnA>>(`/public/qna?${query}`); }
export function createNewsCategory(body: unknown) { return adminFetch<NewsCategory>("/news-categories", { method: "POST", body: JSON.stringify(body) }); }
export function updateNewsCategory(id: number, body: unknown) { return adminFetch<NewsCategory>(`/news-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deactivateNewsCategory(id: number) { return adminFetch<void>(`/news-categories/${id}`, { method: "DELETE" }); }
export function setNewsCategoryActive(id: number, isActive: boolean) { return adminFetch<NewsCategory>(`/news-categories/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }); }
export function getAdminArticles(query = "pageNumber=1&pageSize=50") { return adminFetch<Page<Article>>(`/admin/news-articles?${query}`); }
export function createArticle(body: unknown) { return adminFetch<Article>("/news-articles", { method: "POST", body: JSON.stringify(body) }); }
export function updateArticle(id: number, body: unknown) { return adminFetch<Article>(`/news-articles/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function unpublishArticle(id: number) { return adminFetch<void>(`/news-articles/${id}`, { method: "DELETE" }); }
export function restoreArticle(id: number) { return adminFetch<Article>(`/news-articles/${id}/restore`, { method: "PATCH" }); }
export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return adminFetch<{ url: string }>("/content/upload-image", {
    method: "POST",
    body: formData,
  });
}
export function getTestimonials(options: { verifiedOnly?: boolean; pageSize?: number } = {}) {
  const params = new URLSearchParams({ pageNumber: "1", pageSize: String(options.pageSize ?? 20) });
  if (options.verifiedOnly) params.set("verifiedOnly", "true");
  return apiFetch<Page<Testimonial>>(`/testimonials?${params.toString()}`);
}
export function submitTestimonial(body: { trackingCode: string; content: string; rating: number; consentToPublish: boolean }) { return apiFetch<TestimonialSubmission>("/testimonials/submissions", { method: "POST", body: JSON.stringify(body) }); }
export function getAdminTestimonials() { return adminFetch<Page<Testimonial>>("/admin/testimonials?pageNumber=1&pageSize=100"); }
export function setTestimonialActive(id: number, isActive: boolean) { return adminFetch<Testimonial>(`/testimonials/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }); }
export function getContacts(query = "pageNumber=1&pageSize=20") { return adminFetch<Page<Contact>>(`/contact-requests?${query}`); }
export function updateContactStatus(id: number, body: unknown) { return adminFetch<void>(`/contact-requests/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }); }
export function replyToContact(id: number, body: unknown) { return adminFetch<void>(`/contact-requests/${id}/reply`, { method: "PATCH", body: JSON.stringify(body) }); }
