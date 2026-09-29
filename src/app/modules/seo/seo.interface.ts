
export interface ISeoIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  recommendation: string;
}

export interface ISeoAuditResult {
  url: string;
  score: number;
  auditedAt: Date;

  statusCode: number;

  title: string;
  description: string;
  canonical: string;

  h1Count: number;
  h2Count: number;

  imageCount: number;
  imagesWithoutAlt: number;

  internalLinks: number;
  externalLinks: number;

  hasViewport: boolean;
  hasRobots: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;

  hasOpenGraph: boolean;
  hasTwitterCard: boolean;

  hasLanguage: boolean;
  language: string;

  hasStructuredData: boolean;

  isHttps: boolean;
  hasNoIndex: boolean;

  issues: ISeoIssue[];
}

