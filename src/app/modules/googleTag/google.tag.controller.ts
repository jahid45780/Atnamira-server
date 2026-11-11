
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import AppError from "../../errorHerplrs/appError";
import { GoogleTagManagerService } from "./google.tag.service";
import {
  GTMResource,
  IGTMPayload,
} from "./google.tag.interface";
import { envVers } from "../../config/env";

// --------------------------------------------------
// RESPONSE HELPER
// --------------------------------------------------

const sendSuccess = (
  res: Response,
  message: string,
  data: unknown = null,
  statusCode = 200,
): void => {
  res.status(statusCode).json({
    statusCode,
    success: true,
    message,
    data,
  });
};

// --------------------------------------------------
// COMMON HELPERS
// --------------------------------------------------

const getUserId = (req: Request): string => {
  const user = req.user as
    | {
        userId?: string;
        id?: string;
        _id?: string;
      }
    | undefined;

  const userId = user?.userId || user?.id || user?._id;

  if (!userId) {
    throw new AppError(401, "Authenticated user not found");
  }

  return String(userId);
};

const getParam = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
};

const getBody = (req: Request): Record<string, unknown> => {
  if (
    req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body)
  ) {
    return req.body as Record<string, unknown>;
  }

  return {};
};

const getIds = (req: Request) => ({
  accountId: getParam(req.params.accountId),
  containerId: getParam(req.params.containerId),
  workspaceId: getParam(req.params.workspaceId),
  resourceId: getParam(req.params.resourceId),
  versionId: getParam(req.params.versionId),
});

const getResourceName = (req: Request): GTMResource => {
  const resource = getParam(req.params.resource);

  const allowedResources: GTMResource[] = [
    "tags",
    "triggers",
    "variables",
  ];

  if (!allowedResources.includes(resource as GTMResource)) {
    throw new AppError(
      400,
      "Invalid resource. Use tags, triggers or variables",
    );
  }

  return resource as GTMResource;
};

const validateIds = (
  values: Record<string, string>,
): void => {
  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new AppError(
      400,
      `Missing required parameters: ${missing.join(", ")}`,
    );
  }
};

// --------------------------------------------------
// GOOGLE OAUTH
// --------------------------------------------------

const getConnectUrl = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const url =
      GoogleTagManagerService.getConnectionUrl(userId);

    sendSuccess(
      res,
      "Google Tag Manager authorization URL generated successfully",
      { url },
    );
  },
);

const googleCallback = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const code = getParam(req.query.code);
    const state = getParam(req.query.state);
    const error = getParam(req.query.error);

    if (error) {
      res.redirect(
        `${envVers.FRONTEND_URL}/admin/integrations/google-tag-manager?error=${encodeURIComponent(error)}`,
      );
      return;
    }

    if (!code || !state) {
      throw new AppError(
        400,
        "Google authorization code or state is missing",
      );
    }

    const result =
      await GoogleTagManagerService.connectGoogleTagManager(
        code,
        state,
      );

    const redirectUrl = new URL(
      "/admin/integrations/google-tag-manager",
      envVers.FRONTEND_URL,
    );

    redirectUrl.searchParams.set("connected", "true");
    redirectUrl.searchParams.set(
      "email",
      result.googleEmail,
    );

    res.redirect(redirectUrl.toString());
  },
);

// --------------------------------------------------
// CONNECTION
// --------------------------------------------------

const getConnection = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const result =
      await GoogleTagManagerService.getSafeConnection(userId);

    sendSuccess(
      res,
      "Google Tag Manager connection retrieved successfully",
      result,
    );
  },
);

const disconnect = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const result =
      await GoogleTagManagerService.disconnectGoogleTagManager(
        userId,
      );

    sendSuccess(
      res,
      "Google Tag Manager disconnected successfully",
      result,
    );
  },
);

// --------------------------------------------------
// ACCOUNTS
// --------------------------------------------------

const getAccounts = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    const result =
      await GoogleTagManagerService.getAccounts(userId);

    sendSuccess(
      res,
      "Google Tag Manager accounts retrieved successfully",
      result,
    );
  },
);

// --------------------------------------------------
// CONTAINERS
// --------------------------------------------------

const getContainers = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId } = getIds(req);

    validateIds({ accountId });

    const result =
      await GoogleTagManagerService.getContainers(
        userId,
        accountId,
      );

    sendSuccess(
      res,
      "Google Tag Manager containers retrieved successfully",
      result,
    );
  },
);

const createContainer = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId } = getIds(req);

    validateIds({ accountId });

    const result =
      await GoogleTagManagerService.createContainer(
        userId,
        accountId,
        getBody(req),
      );

    sendSuccess(
      res,
      "Google Tag Manager container created successfully",
      result,
      201,
    );
  },
);

// --------------------------------------------------
// WORKSPACES
// --------------------------------------------------

const getWorkspaces = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId } = getIds(req);

    validateIds({ accountId, containerId });

    const result =
      await GoogleTagManagerService.getWorkspaces(
        userId,
        accountId,
        containerId,
      );

    sendSuccess(
      res,
      "Google Tag Manager workspaces retrieved successfully",
      result,
    );
  },
);

const createWorkspace = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId } = getIds(req);

    validateIds({ accountId, containerId });

    const name = getBody(req).name;

    if (typeof name !== "string" || !name.trim()) {
      throw new AppError(400, "Workspace name is required");
    }

    const result =
      await GoogleTagManagerService.createWorkspace(
        userId,
        accountId,
        containerId,
        name.trim(),
      );

    sendSuccess(
      res,
      "Google Tag Manager workspace created successfully",
      result,
      201,
    );
  },
);

const getWorkspaceStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, workspaceId } =
      getIds(req);

    validateIds({ accountId, containerId, workspaceId });

    const result =
      await GoogleTagManagerService.getWorkspaceStatus(
        userId,
        accountId,
        containerId,
        workspaceId,
      );

    sendSuccess(
      res,
      "Google Tag Manager workspace status retrieved successfully",
      result,
    );
  },
);

// --------------------------------------------------
// QUICK PREVIEW
// --------------------------------------------------

const quickPreview = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, workspaceId } =
      getIds(req);

    validateIds({ accountId, containerId, workspaceId });

    const result =
      await GoogleTagManagerService.quickPreviewWorkspace(
        userId,
        accountId,
        containerId,
        workspaceId,
      );

    sendSuccess(
      res,
      "Google Tag Manager workspace preview retrieved successfully",
      result,
    );
  },
);

// --------------------------------------------------
// TAGS / TRIGGERS / VARIABLES
// --------------------------------------------------

const getResources = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, workspaceId } =
      getIds(req);

    const resource = getResourceName(req);

    validateIds({ accountId, containerId, workspaceId });

    const result =
      await GoogleTagManagerService.getResource(
        userId,
        accountId,
        containerId,
        workspaceId,
        resource,
      );

    sendSuccess(
      res,
      `Google Tag Manager ${resource} retrieved successfully`,
      result,
    );
  },
);

const createResource = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, workspaceId } =
      getIds(req);

    const resource = getResourceName(req);

    validateIds({ accountId, containerId, workspaceId });

    const payload = getBody(req) as IGTMPayload;

    if (
      typeof payload.name !== "string" ||
      !payload.name.trim()
    ) {
      throw new AppError(400, "Resource name is required");
    }

    const result =
      await GoogleTagManagerService.createResource(
        userId,
        accountId,
        containerId,
        workspaceId,
        resource,
        payload,
      );

    sendSuccess(
      res,
      `Google Tag Manager ${resource} created successfully`,
      result,
      201,
    );
  },
);

const updateResource = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const {
      accountId,
      containerId,
      workspaceId,
      resourceId,
    } = getIds(req);

    const resource = getResourceName(req);

    validateIds({
      accountId,
      containerId,
      workspaceId,
      resourceId,
    });

    const payload = getBody(req) as IGTMPayload;

    const result =
      await GoogleTagManagerService.updateResource(
        userId,
        accountId,
        containerId,
        workspaceId,
        resource,
        resourceId,
        payload,
      );

    sendSuccess(
      res,
      `Google Tag Manager ${resource} updated successfully`,
      result,
    );
  },
);

const deleteResource = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const {
      accountId,
      containerId,
      workspaceId,
      resourceId,
    } = getIds(req);

    const resource = getResourceName(req);

    validateIds({
      accountId,
      containerId,
      workspaceId,
      resourceId,
    });

    await GoogleTagManagerService.deleteResource(
      userId,
      accountId,
      containerId,
      workspaceId,
      resource,
      resourceId,
    );

    sendSuccess(
      res,
      `Google Tag Manager ${resource} deleted successfully`,
      null,
    );
  },
);

// --------------------------------------------------
// VERSIONS
// --------------------------------------------------

const createVersion = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, workspaceId } =
      getIds(req);

    validateIds({ accountId, containerId, workspaceId });

    const body = getBody(req);

    const name =
      typeof body.name === "string" ? body.name : undefined;

    const notes =
      typeof body.notes === "string" ? body.notes : undefined;

    const result =
      await GoogleTagManagerService.createVersion(
        userId,
        accountId,
        containerId,
        workspaceId,
        name,
        notes,
      );

    sendSuccess(
      res,
      "Google Tag Manager version created successfully",
      result,
      201,
    );
  },
);

const getVersions = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId } = getIds(req);

    validateIds({ accountId, containerId });

    const result =
      await GoogleTagManagerService.getVersions(
        userId,
        accountId,
        containerId,
      );

    sendSuccess(
      res,
      "Google Tag Manager versions retrieved successfully",
      result,
    );
  },
);

const publishVersion = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { accountId, containerId, versionId } =
      getIds(req);

    validateIds({ accountId, containerId, versionId });

    const result =
      await GoogleTagManagerService.publishVersion(
        userId,
        accountId,
        containerId,
        versionId,
      );

    sendSuccess(
      res,
      "Google Tag Manager version published successfully",
      result,
    );
  },
);

// --------------------------------------------------
// EXPORT CONTROLLER
// --------------------------------------------------

export const GoogleTagManagerController = {
  getConnectUrl,
  googleCallback,

  getConnection,
  disconnect,

  getAccounts,

  getContainers,
  createContainer,

  getWorkspaces,
  createWorkspace,
  getWorkspaceStatus,
  quickPreview,

  getResources,
  createResource,
  updateResource,
  deleteResource,

  createVersion,
  getVersions,
  publishVersion,
};
