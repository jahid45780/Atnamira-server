
import axios from "axios";
import * as cheerio from "cheerio";

import AppError from "../../errorHerplrs/appError";

import {
  ISeoAuditResult,
  ISeoIssue,
} from "./seo.interface";

// ======================================================
// ALLOWED ORIGIN
// ======================================================

const getAllowedOrigin = () => {
  const siteUrl = process.env.FRONTEND_URL;

  if (!siteUrl) {
    throw new AppError(
      500,
      "FRONTEND_URL is not configured",
    );
  }

  try {
    return new URL(siteUrl).origin;
  } catch {
    throw new AppError(
      500,
      "FRONTEND_URL is invalid",
    );
  }
};

// ======================================================
// FETCH WEBSITE RESOURCE
// ======================================================

const fetchResource = async (
  url: string,
  accept = "*/*",
) => {
  try {
    return await axios.get(url, {
      timeout: 10000,
      maxRedirects: 3,
      responseType: "text",

      headers: {
        Accept: accept,
        "User-Agent":
          "AtnaMira-SEO-Audit/2.0",
      },

      validateStatus: () => true,
    });
  } catch {
    return null;
  }
};

// ======================================================
// AUDIT PAGE
// ======================================================

const auditPage = async (
  inputUrl: string,
): Promise<ISeoAuditResult> => {
  // ----------------------------------------------------
  // Parse URL
  // ----------------------------------------------------

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    throw new AppError(
      400,
      "Please provide a valid URL",
    );
  }

  // ----------------------------------------------------
  // Security: only configured frontend allowed
  // ----------------------------------------------------

  const allowedOrigin =
    getAllowedOrigin();

  if (
    !["http:", "https:"].includes(
      parsedUrl.protocol,
    ) ||
    parsedUrl.origin !== allowedOrigin ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new AppError(
      400,
      "Only URLs from the configured website are allowed",
    );
  }

  // ----------------------------------------------------
  // Fetch page
  // ----------------------------------------------------

  const response = await fetchResource(
    parsedUrl.toString(),
    "text/html",
  );

  if (!response) {
    throw new AppError(
      502,
      "Could not fetch the website page",
    );
  }

  const contentType = String(
    response.headers["content-type"] || "",
  );

  if (
    !contentType.includes("text/html")
  ) {
    throw new AppError(
      400,
      "The requested URL did not return HTML",
    );
  }

  const html = String(
    response.data || "",
  );

  const $ = cheerio.load(html);

  // ====================================================
  // BASIC SEO DATA
  // ====================================================

  const title = $("title")
    .first()
    .text()
    .trim();

  const description =
    $('meta[name="description"]')
      .attr("content")
      ?.trim() || "";

  const canonical =
    $('link[rel="canonical"]')
      .attr("href")
      ?.trim() || "";

  const h1Count = $("h1").length;

  const h2Count = $("h2").length;

  const imageCount = $("img").length;

  const imagesWithoutAlt = $("img").filter(
    (_, element) => {
      const alt = $(element)
        .attr("alt")
        ?.trim();

      return !alt;
    },
  ).length;

  // ====================================================
  // META
  // ====================================================

  const hasViewport =
    $('meta[name="viewport"]').length >
    0;

  const hasRobots =
    $('meta[name="robots"]').length >
    0;

  const robotsContent =
    $('meta[name="robots"]')
      .attr("content")
      ?.toLowerCase()
      .trim() || "";

  const hasNoIndex =
    robotsContent.includes("noindex");

  // ====================================================
  // OPEN GRAPH
  // ====================================================

  const ogTitle =
    $('meta[property="og:title"]')
      .attr("content")
      ?.trim() || "";

  const ogDescription =
    $('meta[property="og:description"]')
      .attr("content")
      ?.trim() || "";

  const ogImage =
    $('meta[property="og:image"]')
      .attr("content")
      ?.trim() || "";

  const ogUrl =
    $('meta[property="og:url"]')
      .attr("content")
      ?.trim() || "";

  const hasOpenGraph =
    Boolean(
      ogTitle &&
        ogDescription &&
        ogImage &&
        ogUrl,
    );

  // ====================================================
  // TWITTER CARD
  // ====================================================

  const twitterCard =
    $('meta[name="twitter:card"]')
      .attr("content")
      ?.trim() || "";

  const twitterTitle =
    $('meta[name="twitter:title"]')
      .attr("content")
      ?.trim() || "";

  const twitterDescription =
    $(
      'meta[name="twitter:description"]',
    )
      .attr("content")
      ?.trim() || "";

  const twitterImage =
    $('meta[name="twitter:image"]')
      .attr("content")
      ?.trim() || "";

  const hasTwitterCard =
    Boolean(
      twitterCard &&
        twitterTitle &&
        twitterDescription &&
        twitterImage,
    );

  // ====================================================
  // LANGUAGE
  // ====================================================

  const language =
    $("html")
      .attr("lang")
      ?.trim() || "";

  const hasLanguage =
    Boolean(language);

  // ====================================================
  // STRUCTURED DATA
  // ====================================================

  const structuredDataCount =
    $('script[type="application/ld+json"]')
      .length;

  const hasStructuredData =
    structuredDataCount > 0;

  // ====================================================
  // LINKS
  // ====================================================

  let internalLinks = 0;
  let externalLinks = 0;

  $("a[href]").each((_, element) => {
    const href = $(element)
      .attr("href")
      ?.trim();

    if (!href) {
      return;
    }

    // Ignore anchors, javascript and mail links
    if (
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return;
    }

    try {
      const linkUrl = new URL(
        href,
        parsedUrl.toString(),
      );

      if (
        linkUrl.origin ===
        allowedOrigin
      ) {
        internalLinks++;
      } else if (
        ["http:", "https:"].includes(
          linkUrl.protocol,
        )
      ) {
        externalLinks++;
      }
    } catch {
      // Ignore invalid links
    }
  });

  // ====================================================
  // HTTPS
  // ====================================================

  const isHttps =
    parsedUrl.protocol === "https:";

  // ====================================================
  // ROBOTS.TXT
  // ====================================================

  const robotsUrl =
    new URL(
      "/robots.txt",
      allowedOrigin,
    ).toString();

  const robotsResponse =
    await fetchResource(
      robotsUrl,
      "text/plain",
    );

  const hasRobotsTxt =
    Boolean(
      robotsResponse &&
        robotsResponse.status >= 200 &&
        robotsResponse.status < 400 &&
        String(
          robotsResponse.data || "",
        ).trim(),
    );

  // ====================================================
  // SITEMAP
  // ====================================================

  const sitemapUrl =
    new URL(
      "/sitemap.xml",
      allowedOrigin,
    ).toString();

  const sitemapResponse =
    await fetchResource(
      sitemapUrl,
      "application/xml,text/xml",
    );

  const sitemapBody =
    String(
      sitemapResponse?.data || "",
    );

  const hasSitemap =
  Boolean(
    sitemapResponse &&
      sitemapResponse.status >= 200 &&
      sitemapResponse.status < 400 &&
      (
        sitemapBody.includes("<urlset") ||
        sitemapBody.includes("<sitemapindex")
      ),
  );

  // ====================================================
  // ISSUES
  // ====================================================

  const issues: ISeoIssue[] = [];

  const addIssue = (
    code: string,
    severity: ISeoIssue["severity"],
    message: string,
    recommendation: string,
  ) => {
    issues.push({
      code,
      severity,
      message,
      recommendation,
    });
  };

  // ====================================================
  // HTTP STATUS
  // ====================================================

  if (response.status >= 400) {
    addIssue(
      "HTTP_ERROR",
      "error",
      `Page returned HTTP ${response.status}`,
      "Fix the page response so visitors and search engine crawlers can access it.",
    );
  }

  // ====================================================
  // TITLE
  // ====================================================

  if (!title) {
    addIssue(
      "MISSING_TITLE",
      "error",
      "Page title is missing",
      "Add a unique and descriptive title element.",
    );
  } else if (
    title.length < 30 ||
    title.length > 60
  ) {
    addIssue(
      "TITLE_LENGTH",
      "warning",
      `Title length is ${title.length} characters`,
      "Review the title and keep it concise and descriptive. Around 30–60 characters is a practical guideline.",
    );
  }

  // ====================================================
  // DESCRIPTION
  // ====================================================

  if (!description) {
    addIssue(
      "MISSING_DESCRIPTION",
      "error",
      "Meta description is missing",
      "Add a unique and useful meta description for this page.",
    );
  } else if (
    description.length < 70 ||
    description.length > 160
  ) {
    addIssue(
      "DESCRIPTION_LENGTH",
      "warning",
      `Meta description length is ${description.length} characters`,
      "Review the description so it clearly summarizes the page.",
    );
  }

  // ====================================================
  // CANONICAL
  // ====================================================

  if (!canonical) {
    addIssue(
      "MISSING_CANONICAL",
      "warning",
      "Canonical URL is missing",
      "Add a canonical URL when this page has a preferred URL.",
    );
  } else {
    try {
      const canonicalUrl =
        new URL(
          canonical,
          parsedUrl.toString(),
        );

      if (
        canonicalUrl.protocol !==
          "http:" &&
        canonicalUrl.protocol !==
          "https:"
      ) {
        addIssue(
          "INVALID_CANONICAL",
          "error",
          "Canonical URL uses an invalid protocol",
          "Use a valid HTTP or HTTPS canonical URL.",
        );
      }

      if (
        canonicalUrl.origin !==
        allowedOrigin
      ) {
        addIssue(
          "EXTERNAL_CANONICAL",
          "warning",
          "Canonical URL points to another domain",
          "Verify that the external canonical URL is intentional.",
        );
      }
    } catch {
      addIssue(
        "INVALID_CANONICAL",
        "error",
        "Canonical URL is invalid",
        "Use a valid absolute or relative canonical URL.",
      );
    }
  }

  // ====================================================
  // H1
  // ====================================================

  if (h1Count === 0) {
    addIssue(
      "MISSING_H1",
      "warning",
      "No H1 heading found",
      "Add a clear main heading that describes the page.",
    );
  } else if (h1Count > 1) {
    addIssue(
      "MULTIPLE_H1",
      "warning",
      `Found ${h1Count} H1 headings`,
      "Review the heading structure and keep one clear primary page heading where appropriate.",
    );
  }

  // ====================================================
  // H2
  // ====================================================

  if (
    h1Count > 0 &&
    h2Count === 0
  ) {
    addIssue(
      "NO_H2",
      "info",
      "No H2 headings found",
      "Consider using H2 headings to organize longer page content.",
    );
  }

  // ====================================================
  // IMAGE ALT
  // ====================================================

  if (imagesWithoutAlt > 0) {
    addIssue(
      "MISSING_IMAGE_ALT",
      "warning",
      `${imagesWithoutAlt} of ${imageCount} images have no non-empty alt text`,
      "Add meaningful alt text to informative images. Decorative images can use empty alt text.",
    );
  }

  // ====================================================
  // VIEWPORT
  // ====================================================

  if (!hasViewport) {
    addIssue(
      "MISSING_VIEWPORT",
      "error",
      "Viewport meta tag is missing",
      "Add a viewport meta tag for responsive rendering.",
    );
  }

  // ====================================================
  // ROBOTS META
  // ====================================================

  if (!hasRobots) {
    addIssue(
      "MISSING_ROBOTS_META",
      "info",
      "No robots meta tag found",
      "This is not necessarily a problem. Add one only when page-specific crawler directives are required.",
    );
  }

  if (hasNoIndex) {
    addIssue(
      "NOINDEX",
      "error",
      "This page contains a noindex directive",
      "Remove noindex if this page is intended to appear in search engine results.",
    );
  }

  // ====================================================
  // ROBOTS.TXT
  // ====================================================

  if (!hasRobotsTxt) {
    addIssue(
      "MISSING_ROBOTS_TXT",
      "warning",
      "robots.txt could not be found",
      "Create a robots.txt file at the website root and define crawler rules as needed.",
    );
  }

  // ====================================================
  // SITEMAP
  // ====================================================

  if (!hasSitemap) {
    addIssue(
      "MISSING_SITEMAP",
      "warning",
      "sitemap.xml could not be found",
      "Create a sitemap.xml file containing the important indexable URLs.",
    );
  }

  // ====================================================
  // OPEN GRAPH
  // ====================================================

  if (!hasOpenGraph) {
    addIssue(
      "INCOMPLETE_OPEN_GRAPH",
      "info",
      "Open Graph metadata is incomplete",
      "Add og:title, og:description, og:image and og:url.",
    );
  }

  // ====================================================
  // TWITTER CARD
  // ====================================================

  if (!hasTwitterCard) {
    addIssue(
      "INCOMPLETE_TWITTER_CARD",
      "info",
      "Twitter/X Card metadata is incomplete",
      "Add Twitter card metadata for better social sharing previews.",
    );
  }

  // ====================================================
  // LANGUAGE
  // ====================================================

  if (!hasLanguage) {
    addIssue(
      "MISSING_HTML_LANGUAGE",
      "warning",
      "HTML lang attribute is missing",
      "Add a language attribute such as lang=\"en\" to the HTML element.",
    );
  }

  // ====================================================
  // STRUCTURED DATA
  // ====================================================

  if (!hasStructuredData) {
    addIssue(
      "MISSING_STRUCTURED_DATA",
      "info",
      "No JSON-LD structured data found",
      "Consider adding appropriate Schema.org structured data for the page type.",
    );
  }

  // ====================================================
  // HTTPS
  // ====================================================

  if (!isHttps) {
    addIssue(
      "NOT_HTTPS",
      "warning",
      "Page is not using HTTPS",
      "Use HTTPS in production to protect visitors and data.",
    );
  }

  // ====================================================
  // LINKS
  // ====================================================

  if (
    internalLinks === 0
  ) {
    addIssue(
      "NO_INTERNAL_LINKS",
      "warning",
      "No internal links were found",
      "Add relevant internal links to help users and crawlers discover related pages.",
    );
  }

  // ====================================================
  // SCORE
  // ====================================================

  const weights: Record<
    ISeoIssue["severity"],
    number
  > = {
    error: 15,
    warning: 7,
    info: 2,
  };

  const deduction =
    issues.reduce(
      (total, issue) =>
        total +
        weights[issue.severity],
      0,
    );

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - deduction,
    ),
  );

  // ====================================================
  // RESULT
  // ====================================================

  return {
    url: parsedUrl.toString(),

    score,

    auditedAt: new Date(),

    statusCode:
      response.status,

    title,

    description,

    canonical,

    h1Count,

    h2Count,

    imageCount,

    imagesWithoutAlt,

    internalLinks,

    externalLinks,

    hasViewport,

    hasRobots,

    hasRobotsTxt,

    hasSitemap,

    hasOpenGraph,

    hasTwitterCard,

    hasLanguage,

    language,

    hasStructuredData,

    isHttps,

    hasNoIndex,

    issues,
  };
};

// ======================================================
// EXPORT
// ======================================================

export const seoService = {
  auditPage,
};

