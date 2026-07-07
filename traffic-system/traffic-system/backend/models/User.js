 const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const UserSchema = new mongoose.Schema({
  fullName:  { type: String, required: true },
  policeId:  { type: String, required: true, unique: true },
  nic:       { type: String, required: true, unique: true },
  dob:       String, gender: String, contactNo: String,
  username:  { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  rank:      { type: String, default: "Traffic Officer" },
}, { timestamps: true });
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
UserSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};
module.exports = mongoose.model("User", UserSchema);