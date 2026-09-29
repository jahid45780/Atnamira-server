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
  imageCount: number;
  imagesWithoutAlt: number;
  hasViewport: boolean;
  hasRobots: boolean;
  hasOpenGraph: boolean;
  issues: ISeoIssue[];
}