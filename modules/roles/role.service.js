const Role = require("./role.model");

exports.createRole = async ({ name }) => {
  const existing = await Role.findOne({ name });
  if (existing) {
    throw new Error("Role already exists");
  }

  const role = new Role({ name });
  return await role.save();
};

exports.getAllRoles = async () => {
  return await Role.find().sort({ name: 1 });
};

exports.getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  return role;
};

exports.updateRole = async (id, data) => {
  const updated = await Role.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new Error("Role not found");
  return updated;
};

exports.deleteRole = async (id) => {
  const deleted = await Role.findByIdAndDelete(id);
  if (!deleted) throw new Error("Role not found");
  return deleted;
};
