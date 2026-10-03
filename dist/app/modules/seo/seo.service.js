"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const appError_1 = __importDefault(require("../../errorHerplrs/appError"));
// ======================================================
// ALLOWED ORIGIN
// ======================================================
const getAllowedOrigin = () => {
    const siteUrl = process.env.FRONTEND_URL;
    if (!siteUrl) {
        throw new appError_1.default(500, "FRONTEND_URL is not configured");
    }
    try {
        return new URL(siteUrl).origin;
    }
    catch (_a) {
        throw new appError_1.default(500, "FRONTEND_URL is invalid");
    }
};
// ======================================================
// FETCH WEBSITE RESOURCE
// ======================================================
const fetchResource = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, accept = "*/*") {
    try {
        return yield axios_1.default.get(url, {
            timeout: 10000,
            maxRedirects: 3,
            responseType: "text",
            headers: {
                Accept: accept,
                "User-Agent": "AtnaMira-SEO-Audit/2.0",
            },
            validateStatus: () => true,
        });
    }
    catch (_a) {
        return null;
    }
});
// ======================================================
// AUDIT PAGE
// ======================================================
const auditPage = (inputUrl) => __awaiter(void 0, void 0, void 0, function* () {
    // ----------------------------------------------------
    // Parse URL
    // ----------------------------------------------------
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    let parsedUrl;
    try {
        parsedUrl = new URL(inputUrl);
    }
    catch (_o) {
        throw new appError_1.default(400, "Please provide a valid URL");
    }
    // ----------------------------------------------------
    // Security: only configured frontend allowed
    // ----------------------------------------------------
    const allowedOrigin = getAllowedOrigin();
    if (!["http:", "https:"].includes(parsedUrl.protocol) ||
        parsedUrl.origin !== allowedOrigin ||
        parsedUrl.username ||
        parsedUrl.password) {
        throw new appError_1.default(400, "Only URLs from the configured website are allowed");
    }
    // ----------------------------------------------------
    // Fetch page
    // ----------------------------------------------------
    const response = yield fetchResource(parsedUrl.toString(), "text/html");
    if (!response) {
        throw new appError_1.default(502, "Could not fetch the website page");
    }
    const contentType = String(response.headers["content-type"] || "");
    if (!contentType.includes("text/html")) {
        throw new appError_1.default(400, "The requested URL did not return HTML");
    }
    const html = String(response.data || "");
    const $ = cheerio.load(html);
    // ====================================================
    // BASIC SEO DATA
    // ====================================================
    const title = $("title")
        .first()
        .text()
        .trim();
    const description = ((_a = $('meta[name="description"]')
        .attr("content")) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    const canonical = ((_b = $('link[rel="canonical"]')
        .attr("href")) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    const h1Count = $("h1").length;
    const h2Count = $("h2").length;
    const imageCount = $("img").length;
    const imagesWithoutAlt = $("img").filter((_, element) => {
        var _a;
        const alt = (_a = $(element)
            .attr("alt")) === null || _a === void 0 ? void 0 : _a.trim();
        return !alt;
    }).length;
    // ====================================================
    // META
    // ====================================================
    const hasViewport = $('meta[name="viewport"]').length >
        0;
    const hasRobots = $('meta[name="robots"]').length >
        0;
    const robotsContent = ((_c = $('meta[name="robots"]')
        .attr("content")) === null || _c === void 0 ? void 0 : _c.toLowerCase().trim()) || "";
    const hasNoIndex = robotsContent.includes("noindex");
    // ====================================================
    // OPEN GRAPH
    // ====================================================
    const ogTitle = ((_d = $('meta[property="og:title"]')
        .attr("content")) === null || _d === void 0 ? void 0 : _d.trim()) || "";
    const ogDescription = ((_e = $('meta[property="og:description"]')
        .attr("content")) === null || _e === void 0 ? void 0 : _e.trim()) || "";
    const ogImage = ((_f = $('meta[property="og:image"]')
        .attr("content")) === null || _f === void 0 ? void 0 : _f.trim()) || "";
    const ogUrl = ((_g = $('meta[property="og:url"]')
        .attr("content")) === null || _g === void 0 ? void 0 : _g.trim()) || "";
    const hasOpenGraph = Boolean(ogTitle &&
        ogDescription &&
        ogImage &&
        ogUrl);
    // ====================================================
    // TWITTER CARD
    // ====================================================
    const twitterCard = ((_h = $('meta[name="twitter:card"]')
        .attr("content")) === null || _h === void 0 ? void 0 : _h.trim()) || "";
    const twitterTitle = ((_j = $('meta[name="twitter:title"]')
        .attr("content")) === null || _j === void 0 ? void 0 : _j.trim()) || "";
    const twitterDescription = ((_k = $('meta[name="twitter:description"]')
        .attr("content")) === null || _k === void 0 ? void 0 : _k.trim()) || "";
    const twitterImage = ((_l = $('meta[name="twitter:image"]')
        .attr("content")) === null || _l === void 0 ? void 0 : _l.trim()) || "";
    const hasTwitterCard = Boolean(twitterCard &&
        twitterTitle &&
        twitterDescription &&
        twitterImage);
    // ====================================================
    // LANGUAGE
    // ====================================================
    const language = ((_m = $("html")
        .attr("lang")) === null || _m === void 0 ? void 0 : _m.trim()) || "";
    const hasLanguage = Boolean(language);
    // ====================================================
    // STRUCTURED DATA
    // ====================================================
    const structuredDataCount = $('script[type="application/ld+json"]')
        .length;
    const hasStructuredData = structuredDataCount > 0;
    // ====================================================
    // LINKS
    // ====================================================
    let internalLinks = 0;
    let externalLinks = 0;
    $("a[href]").each((_, element) => {
        var _a;
        const href = (_a = $(element)
            .attr("href")) === null || _a === void 0 ? void 0 : _a.trim();
        if (!href) {
            return;
        }
        // Ignore anchors, javascript and mail links
        if (href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")) {
            return;
        }
        try {
            const linkUrl = new URL(href, parsedUrl.toString());
            if (linkUrl.origin ===
                allowedOrigin) {
                internalLinks++;
            }
            else if (["http:", "https:"].includes(linkUrl.protocol)) {
                externalLinks++;
            }
        }
        catch (_b) {
            // Ignore invalid links
        }
    });
    // ====================================================
    // HTTPS
    // ====================================================
    const isHttps = parsedUrl.protocol === "https:";
    // ====================================================
    // ROBOTS.TXT
    // ====================================================
    const robotsUrl = new URL("/robots.txt", allowedOrigin).toString();
    const robotsResponse = yield fetchResource(robotsUrl, "text/plain");
    const hasRobotsTxt = Boolean(robotsResponse &&
        robotsResponse.status >= 200 &&
        robotsResponse.status < 400 &&
        String(robotsResponse.data || "").trim());
    // ====================================================
    // SITEMAP
    // ====================================================
    const sitemapUrl = new URL("/sitemap.xml", allowedOrigin).toString();
    const sitemapResponse = yield fetchResource(sitemapUrl, "application/xml,text/xml");
    const sitemapBody = String((sitemapResponse === null || sitemapResponse === void 0 ? void 0 : sitemapResponse.data) || "");
    const hasSitemap = Boolean(sitemapResponse &&
        sitemapResponse.status >= 200 &&
        sitemapResponse.status < 400 &&
        (sitemapBody.includes("<urlset") ||
            sitemapBody.includes("<sitemapindex")));
    // ====================================================
    // ISSUES
    // ====================================================
    const issues = [];
    const addIssue = (code, severity, message, recommendation) => {
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
        addIssue("HTTP_ERROR", "error", `Page returned HTTP ${response.status}`, "Fix the page response so visitors and search engine crawlers can access it.");
    }
    // ====================================================
    // TITLE
    // ====================================================
    if (!title) {
        addIssue("MISSING_TITLE", "error", "Page title is missing", "Add a unique and descriptive title element.");
    }
    else if (title.length < 30 ||
        title.length > 60) {
        addIssue("TITLE_LENGTH", "warning", `Title length is ${title.length} characters`, "Review the title and keep it concise and descriptive. Around 30–60 characters is a practical guideline.");
    }
    // ====================================================
    // DESCRIPTION
    // ====================================================
    if (!description) {
        addIssue("MISSING_DESCRIPTION", "error", "Meta description is missing", "Add a unique and useful meta description for this page.");
    }
    else if (description.length < 70 ||
        description.length > 160) {
        addIssue("DESCRIPTION_LENGTH", "warning", `Meta description length is ${description.length} characters`, "Review the description so it clearly summarizes the page.");
    }
    // ====================================================
    // CANONICAL
    // ====================================================
    if (!canonical) {
        addIssue("MISSING_CANONICAL", "warning", "Canonical URL is missing", "Add a canonical URL when this page has a preferred URL.");
    }
    else {
        try {
            const canonicalUrl = new URL(canonical, parsedUrl.toString());
            if (canonicalUrl.protocol !==
                "http:" &&
                canonicalUrl.protocol !==
                    "https:") {
                addIssue("INVALID_CANONICAL", "error", "Canonical URL uses an invalid protocol", "Use a valid HTTP or HTTPS canonical URL.");
            }
            if (canonicalUrl.origin !==
                allowedOrigin) {
                addIssue("EXTERNAL_CANONICAL", "warning", "Canonical URL points to another domain", "Verify that the external canonical URL is intentional.");
            }
        }
        catch (_p) {
            addIssue("INVALID_CANONICAL", "error", "Canonical URL is invalid", "Use a valid absolute or relative canonical URL.");
        }
    }
    // ====================================================
    // H1
    // ====================================================
    if (h1Count === 0) {
        addIssue("MISSING_H1", "warning", "No H1 heading found", "Add a clear main heading that describes the page.");
    }
    else if (h1Count > 1) {
        addIssue("MULTIPLE_H1", "warning", `Found ${h1Count} H1 headings`, "Review the heading structure and keep one clear primary page heading where appropriate.");
    }
    // ====================================================
    // H2
    // ====================================================
    if (h1Count > 0 &&
        h2Count === 0) {
        addIssue("NO_H2", "info", "No H2 headings found", "Consider using H2 headings to organize longer page content.");
    }
    // ====================================================
    // IMAGE ALT
    // ====================================================
    if (imagesWithoutAlt > 0) {
        addIssue("MISSING_IMAGE_ALT", "warning", `${imagesWithoutAlt} of ${imageCount} images have no non-empty alt text`, "Add meaningful alt text to informative images. Decorative images can use empty alt text.");
    }
    // ====================================================
    // VIEWPORT
    // ====================================================
    if (!hasViewport) {
        addIssue("MISSING_VIEWPORT", "error", "Viewport meta tag is missing", "Add a viewport meta tag for responsive rendering.");
    }
    // ====================================================
    // ROBOTS META
    // ====================================================
    if (!hasRobots) {
        addIssue("MISSING_ROBOTS_META", "info", "No robots meta tag found", "This is not necessarily a problem. Add one only when page-specific crawler directives are required.");
    }
    if (hasNoIndex) {
        addIssue("NOINDEX", "error", "This page contains a noindex directive", "Remove noindex if this page is intended to appear in search engine results.");
    }
    // ====================================================
    // ROBOTS.TXT
    // ====================================================
    if (!hasRobotsTxt) {
        addIssue("MISSING_ROBOTS_TXT", "warning", "robots.txt could not be found", "Create a robots.txt file at the website root and define crawler rules as needed.");
    }
    // ====================================================
    // SITEMAP
    // ====================================================
    if (!hasSitemap) {
        addIssue("MISSING_SITEMAP", "warning", "sitemap.xml could not be found", "Create a sitemap.xml file containing the important indexable URLs.");
    }
    // ====================================================
    // OPEN GRAPH
    // ====================================================
    if (!hasOpenGraph) {
        addIssue("INCOMPLETE_OPEN_GRAPH", "info", "Open Graph metadata is incomplete", "Add og:title, og:description, og:image and og:url.");
    }
    // ====================================================
    // TWITTER CARD
    // ====================================================
    if (!hasTwitterCard) {
        addIssue("INCOMPLETE_TWITTER_CARD", "info", "Twitter/X Card metadata is incomplete", "Add Twitter card metadata for better social sharing previews.");
    }
    // ====================================================
    // LANGUAGE
    // ====================================================
    if (!hasLanguage) {
        addIssue("MISSING_HTML_LANGUAGE", "warning", "HTML lang attribute is missing", "Add a language attribute such as lang=\"en\" to the HTML element.");
    }
    // ====================================================
    // STRUCTURED DATA
    // ====================================================
    if (!hasStructuredData) {
        addIssue("MISSING_STRUCTURED_DATA", "info", "No JSON-LD structured data found", "Consider adding appropriate Schema.org structured data for the page type.");
    }
    // ====================================================
    // HTTPS
    // ====================================================
    if (!isHttps) {
        addIssue("NOT_HTTPS", "warning", "Page is not using HTTPS", "Use HTTPS in production to protect visitors and data.");
    }
    // ====================================================
    // LINKS
    // ====================================================
    if (internalLinks === 0) {
        addIssue("NO_INTERNAL_LINKS", "warning", "No internal links were found", "Add relevant internal links to help users and crawlers discover related pages.");
    }
    // ====================================================
    // SCORE
    // ====================================================
    const weights = {
        error: 15,
        warning: 7,
        info: 2,
    };
    const deduction = issues.reduce((total, issue) => total +
        weights[issue.severity], 0);
    const score = Math.max(0, Math.min(100, 100 - deduction));
    // ====================================================
    // RESULT
    // ====================================================
    return {
        url: parsedUrl.toString(),
        score,
        auditedAt: new Date(),
        statusCode: response.status,
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
});
// ======================================================
// EXPORT
// ======================================================
exports.seoService = {
    auditPage,
};
