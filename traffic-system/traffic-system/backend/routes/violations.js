const router = require("express").Router();
const Violation = require("../models/Violation");

router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== "All") query.status = status;
    if (search) query.$or = [
      { violationId: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
    res.json(await Violation.find(query).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const v = await Violation.findOne({ violationId: req.params.id });
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json(v);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await new Violation(req.body).save());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await Violation.findOneAndUpdate(
      { violationId: req.params.id }, req.body, { new: true }
    ));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Violation.findOneAndDelete({ violationId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;