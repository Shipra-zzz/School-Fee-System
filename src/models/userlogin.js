const mongoose = require("mongoose");
// const validator = require("validator");

const adminSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

// Creating a collection
const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;

