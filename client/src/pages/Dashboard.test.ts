import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Dashboard from "./Dashboard";
const query = vi.hoisted(() => ({ data: undefined as undefined | object[], isLoading: false, isError: true, refetch: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Test" }, loading: false }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/dashboard", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { projects: {
  list: { useQuery: () => query },
  create: { useMutation: () => ({}) },
  delete: { useMutation: () => ({}) },
} } }));
describe("dashboard fetch errors", () => {
  it("keeps cached projects visible and offers retry after a refetch error", () => {
    query.data = [{ id: 1, name: "Cached project", createdAt: "2026-01-01" }];
    const html = renderToStaticMarkup(createElement(Dashboard));
    expect(html).toContain("Cached project");
    expect(html).toContain("前回取得した一覧を表示しています");
    expect(html).toContain("再読み込み");
  });
  it("shows a loading error when no cached data exists", () => {
    query.data = undefined;
    const html = renderToStaticMarkup(createElement(Dashboard));
    expect(html).toContain("プロジェクト一覧を読み込めませんでした");
    expect(html).not.toContain("前回取得した一覧を表示しています");
  });
});
