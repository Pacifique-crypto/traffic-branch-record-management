const mongoose = require("mongoose");

const officerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  dob: {
    type: Date,
    required: true
  },

  policeId: {
    type: String,
    required: true,
    unique: true
  },

  gender: {
    type: String,
    required: true
  },

  contactNo: {
    type: String,
    required: true
  },

  username: {
    type: String,
    required: true,
    unique: true
  },

  nic: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    default: "officer"
  },

  email: {
    type: String,
    default: ""
  },

  rank: {
    type: String,
    default: "Constable"
  },

  address: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Officer", officerSchema);