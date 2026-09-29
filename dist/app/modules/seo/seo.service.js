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
const auditPage = (inputUrl) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let parsedUrl;
    try {
        parsedUrl = new URL(inputUrl);
    }
    catch (_c) {
        throw new appError_1.default(400, "Please provide a valid URL");
    }
    const allowedOrigin = getAllowedOrigin();
    if (!["http:", "https:"].includes(parsedUrl.protocol) ||
        parsedUrl.origin !== allowedOrigin ||
        parsedUrl.username ||
        parsedUrl.password) {
        throw new appError_1.default(400, "Only URLs from the configured website are allowed");
    }
    let response;
    try {
        response = yield axios_1.default.get(parsedUrl.toString(), {
            timeout: 12000,
            maxRedirects: 0,
            responseType: "text",
            headers: {
                Accept: "text/html",
                "User-Agent": "AtnaMira-SEO-Audit/1.0",
            },
            validateStatus: () => true,
        });
    }
    catch (_d) {
        throw new appError_1.default(502, "Could not fetch the website page");
    }
    const contentType = String(response.headers["content-type"] || "");
    if (!contentType.includes("text/html")) {
        throw new appError_1.default(400, "The requested URL did not return HTML");
    }
    const html = String(response.data || "");
    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    const description = ((_a = $('meta[name="description"]').attr("content")) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    const canonical = ((_b = $('link[rel="canonical"]').attr("href")) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    const h1Count = $("h1").length;
    const imageCount = $("img").length;
    const imagesWithoutAlt = $("img").filter((_, el) => {
        var _a;
        return !((_a = $(el).attr("alt")) === null || _a === void 0 ? void 0 : _a.trim());
    }).length;
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const hasRobots = $('meta[name="robots"]').length > 0;
    const hasOpenGraph = $('meta[property="og:title"]').length > 0 &&
        $('meta[property="og:description"]').length > 0;
    const issues = [];
    const addIssue = (code, severity, message, recommendation) => {
        issues.push({ code, severity, message, recommendation });
    };
    if (response.status >= 400) {
        addIssue("HTTP_ERROR", "error", `Page returned HTTP ${response.status}`, "Fix the page response so visitors and crawlers can access it.");
    }
    if (!title) {
        addIssue("MISSING_TITLE", "error", "Page title is missing", "Add a unique, descriptive title element.");
    }
    else if (title.length < 30 || title.length > 60) {
        addIssue("TITLE_LENGTH", "warning", `Title length is ${title.length} characters`, "Review the title so it clearly describes the page; around 30–60 characters is a practical editorial guideline.");
    }
    if (!description) {
        addIssue("MISSING_DESCRIPTION", "error", "Meta description is missing", "Add a concise, unique description for this page.");
    }
    else if (description.length < 70 || description.length > 160) {
        addIssue("DESCRIPTION_LENGTH", "warning", `Meta description length is ${description.length} characters`, "Review the description for clarity and useful page-specific information.");
    }
    if (!canonical) {
        addIssue("MISSING_CANONICAL", "warning", "Canonical link is missing", "Add a canonical URL when the page needs a preferred URL.");
    }
    if (h1Count === 0) {
        addIssue("MISSING_H1", "warning", "No H1 heading found", "Add a clear main heading that describes the page.");
    }
    else if (h1Count > 1) {
        addIssue("MULTIPLE_H1", "warning", `Found ${h1Count} H1 headings`, "Review the heading structure and identify one clear main page heading.");
    }
    if (imagesWithoutAlt > 0) {
        addIssue("MISSING_IMAGE_ALT", "warning", `${imagesWithoutAlt} of ${imageCount} images have no non-empty alt text`, "Add meaningful alt text to informative images; use empty alt text for decorative images.");
    }
    if (!hasViewport) {
        addIssue("MISSING_VIEWPORT", "error", "Viewport meta tag is missing", "Add a viewport meta tag for responsive rendering.");
    }
    if (!hasRobots) {
        addIssue("MISSING_ROBOTS_META", "info", "No robots meta tag found", "This is not necessarily a problem. Add one only when you need page-specific crawler directives.");
    }
    if (!hasOpenGraph) {
        addIssue("MISSING_OPEN_GRAPH", "info", "Open Graph title or description is missing", "Add Open Graph metadata to control how the page is represented when shared.");
    }
    const weights = {
        error: 15,
        warning: 7,
        info: 2,
    };
    const deduction = issues.reduce((total, issue) => total + weights[issue.severity], 0);
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
});
exports.seoService = {
    auditPage,
};
