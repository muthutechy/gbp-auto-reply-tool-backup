const express = require("express");
const googleController = require("../controllers/google.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { resolveTenant, enforceTenantIsolation, requireTenantContext } = require("../middleware/tenant.middleware");

const router = express.Router();

router.get("/callback", googleController.callback);

router.use(authenticate, resolveTenant, enforceTenantIsolation);

router.get("/auth", requireTenantContext, googleController.startAuth);
router.get("/status", requireTenantContext, googleController.status);
router.delete("/disconnect", requireTenantContext, googleController.disconnect);

module.exports = router;
