import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Guillo Guambi Reformas",
    short_name: "Guillo Guambi",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f0e9",
    theme_color: "#151512",
    lang: "es",
  };
}
