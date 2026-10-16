import { createFileRoute } from "@tanstack/react-router";
import { fetchPublishedProjects } from "@/lib/projects/public.functions";

const STATIC = ["/", "/projects", "/about", "/contact", "/faq", "/privacy", "/terms", "/refund-policy", "/delivery-policy", "/support-policy"];

/** Lists public pages and published projects only; base URL comes from the request host. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        let projects: { slug: string }[] = [];
        try {
          projects = await fetchPublishedProjects({ data: {} });
        } catch {
          projects = [];
        }
        const urls = [...STATIC, ...projects.map((p) => `/projects/${encodeURIComponent(p.slug)}`)];
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${origin}${u}</loc></url>`)
          .join("\n")}\n</urlset>\n`;
        return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
