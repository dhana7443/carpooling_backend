const roleService = require("./role.service");

exports.createRole = async (req, res) => {
  try {
    const role = await roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    res.status(200).json(role);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const updated = await roleService.updateRole(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const deleted = await roleService.deleteRole(req.params.id);
    res.status(200).json({ message: "Role deleted" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
