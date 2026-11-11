
import { Router } from "express";

import { GoogleTagManagerController } from "./google.tag.controller";
import { checkAuth } from "../auth/authCheck";
import { Role } from "../user/user.interface";

const router = Router();

// --------------------------------------------------
// GOOGLE OAUTH
// --------------------------------------------------

// Generate Google authorization URL
router.get(
  "/connect",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getConnectUrl,
);

// Google OAuth callback
// No authentication middleware here.
// User identity is verified through OAuth state.
router.get(
  "/callback",
  GoogleTagManagerController.googleCallback,
);

// --------------------------------------------------
// CONNECTION
// --------------------------------------------------

router.get(
  "/connection",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getConnection,
);

router.delete(
  "/disconnect",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.disconnect,
);

// --------------------------------------------------
// ACCOUNTS
// --------------------------------------------------

router.get(
  "/accounts",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getAccounts,
);

// --------------------------------------------------
// CONTAINERS
// --------------------------------------------------

router.get(
  "/accounts/:accountId/containers",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getContainers,
);

router.post(
  "/accounts/:accountId/containers",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.createContainer,
);

// --------------------------------------------------
// WORKSPACES
// --------------------------------------------------

router.get(
  "/accounts/:accountId/containers/:containerId/workspaces",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getWorkspaces,
);

router.post(
  "/accounts/:accountId/containers/:containerId/workspaces",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.createWorkspace,
);

// Workspace status
router.get(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/status",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getWorkspaceStatus,
);

// Quick preview
router.post(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/quick-preview",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.quickPreview,
);

// --------------------------------------------------
// TAGS / TRIGGERS / VARIABLES
// --------------------------------------------------

// Get resources
router.get(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/:resource",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getResources,
);

// Create resource
router.post(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/:resource",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.createResource,
);

// Update resource
router.put(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/:resource/:resourceId",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.updateResource,
);

// Delete resource
router.delete(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/:resource/:resourceId",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.deleteResource,
);

// --------------------------------------------------
// VERSIONS
// --------------------------------------------------

// Create version from workspace
router.post(
  "/accounts/:accountId/containers/:containerId/workspaces/:workspaceId/versions",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.createVersion,
);

// Get container versions
router.get(
  "/accounts/:accountId/containers/:containerId/versions",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.getVersions,
);

// Publish version
router.post(
  "/accounts/:accountId/containers/:containerId/versions/:versionId/publish",
  checkAuth(Role.ADMIN),
  GoogleTagManagerController.publishVersion,
);

export const googleTagManagerRoutes = router;
