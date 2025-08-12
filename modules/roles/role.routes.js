const express = require("express");
const router = express.Router();
const {createRole,getAllRoles,getRoleById,updateRole,deleteRole} = require("./role.controller");
const {isAdmin} = require("../../middlewares/auth");

// Only admins can manage roles
router.post("/", isAdmin, createRole);
router.get("/", isAdmin, getAllRoles);
router.get("/:id", isAdmin, getRoleById);
router.patch("/:id", isAdmin,updateRole);
router.delete("/:id", isAdmin, deleteRole);

module.exports = router;
