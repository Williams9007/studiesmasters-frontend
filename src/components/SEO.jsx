import { useEffect } from "react";

/**
 * SEO Component - Manages document head meta tags
 * Usage: <SEO title="Page Title" description="Page description" />
 */
const SEO = ({
  title = "StudiesMasters - Online Tutoring Platform",
  description = "Premium online tutoring for students. Expert teachers, personalized learning, and real-time progress tracking.",
  keywords = "online tutoring, education, studies, masters, tutoring, learning, students, teachers",
  image = "/og-image.png",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
}) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Helper to set or update meta tags
    const setMeta = (attr, key, content) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // Standard meta tags
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("name", "author", "StudiesMasters");

    // Open Graph tags
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "StudiesMasters");

    // Twitter Card tags
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, keywords, image, url, type]);

  return null;
};

export default SEO;