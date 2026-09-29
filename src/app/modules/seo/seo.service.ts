
import axios from "axios";
import * as cheerio from "cheerio";
import AppError from "../../errorHerplrs/appError";
import { ISeoAuditResult, ISeoIssue } from "./seo.interface";

const getAllowedOrigin = () => {
  const siteUrl = process.env.FRONTEND_URL;

  if (!siteUrl) {
    throw new AppError(500, "FRONTEND_URL is not configured");
  }

  try {
    return new URL(siteUrl).origin;
  } catch {
    throw new AppError(500, "FRONTEND_URL is invalid");
  }
};

const auditPage = async (inputUrl: string): Promise<ISeoAuditResult> => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl);
  } catch {
    throw new AppError(400, "Please provide a valid URL");
  }

  const allowedOrigin = getAllowedOrigin();

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.origin !== allowedOrigin ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    throw new AppError(
      400,
      "Only URLs from the configured website are allowed",
    );
  }

  let response;

  try {
    response = await axios.get(parsedUrl.toString(), {
      timeout: 12000,
      maxRedirects: 0,
      responseType: "text",
      headers: {
        Accept: "text/html",
        "User-Agent": "AtnaMira-SEO-Audit/1.0",
      },
      validateStatus: () => true,
    });
  } catch {
    throw new AppError(502, "Could not fetch the website page");
  }

  const contentType = String(response.headers["content-type"] || "");

  if (!contentType.includes("text/html")) {
    throw new AppError(400, "The requested URL did not return HTML");
  }

  const html = String(response.data || "");
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() || "";
  const canonical =
    $('link[rel="canonical"]').attr("href")?.trim() || "";
  const h1Count = $("h1").length;
  const imageCount = $("img").length;
  const imagesWithoutAlt = $("img").filter((_, el) => {
    return !$(el).attr("alt")?.trim();
  }).length;

  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasRobots = $('meta[name="robots"]').length > 0;
  const hasOpenGraph =
    $('meta[property="og:title"]').length > 0 &&
    $('meta[property="og:description"]').length > 0;

  const issues: ISeoIssue[] = [];

  const addIssue = (
    code: string,
    severity: ISeoIssue["severity"],
    message: string,
    recommendation: string,
  ) => {
    issues.push({ code, severity, message, recommendation });
  };

  if (response.status >= 400) {
    addIssue(
      "HTTP_ERROR",
      "error",
      `Page returned HTTP ${response.status}`,
      "Fix the page response so visitors and crawlers can access it.",
    );
  }

  if (!title) {
    addIssue(
      "MISSING_TITLE",
      "error",
      "Page title is missing",
      "Add a unique, descriptive title element.",
    );
  } else if (title.length < 30 || title.length > 60) {
    addIssue(
      "TITLE_LENGTH",
      "warning",
      `Title length is ${title.length} characters`,
      "Review the title so it clearly describes the page; around 30–60 characters is a practical editorial guideline.",
    );
  }

  if (!description) {
    addIssue(
      "MISSING_DESCRIPTION",
      "error",
      "Meta description is missing",
      "Add a concise, unique description for this page.",
    );
  } else if (description.length < 70 || description.length > 160) {
    addIssue(
      "DESCRIPTION_LENGTH",
      "warning",
      `Meta description length is ${description.length} characters`,
      "Review the description for clarity and useful page-specific information.",
    );
  }

  if (!canonical) {
    addIssue(
      "MISSING_CANONICAL",
      "warning",
      "Canonical link is missing",
      "Add a canonical URL when the page needs a preferred URL.",
    );
  }

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
      "Review the heading structure and identify one clear main page heading.",
    );
  }

  if (imagesWithoutAlt > 0) {
    addIssue(
      "MISSING_IMAGE_ALT",
      "warning",
      `${imagesWithoutAlt} of ${imageCount} images have no non-empty alt text`,
      "Add meaningful alt text to informative images; use empty alt text for decorative images.",
    );
  }

  if (!hasViewport) {
    addIssue(
      "MISSING_VIEWPORT",
      "error",
      "Viewport meta tag is missing",
      "Add a viewport meta tag for responsive rendering.",
    );
  }

  if (!hasRobots) {
    addIssue(
      "MISSING_ROBOTS_META",
      "info",
      "No robots meta tag found",
      "This is not necessarily a problem. Add one only when you need page-specific crawler directives.",
    );
  }

  if (!hasOpenGraph) {
    addIssue(
      "MISSING_OPEN_GRAPH",
      "info",
      "Open Graph title or description is missing",
      "Add Open Graph metadata to control how the page is represented when shared.",
    );
  }

  const weights: Record<ISeoIssue["severity"], number> = {
    error: 15,
    warning: 7,
    info: 2,
  };

  const deduction = issues.reduce(
    (total, issue) => total + weights[issue.severity],
    0,
  );

  const score = Math.max(0, 100 - deduction);

  return {
    url: parsedUrl.toString(),
    score,
    auditedAt: new Date(),
    statusCode: response.status,
    title,
    description,
    canonical,
    h1Count,
    imageCount,
    imagesWithoutAlt,
    hasViewport,
    hasRobots,
    hasOpenGraph,
    issues,
  };
};

export const seoService = {
  auditPage,
};