import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/panel"] },
    sitemap: "https://guilloguambi.com/sitemap.xml",
  };
}
