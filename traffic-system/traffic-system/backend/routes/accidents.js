const router = require("express").Router();
const Accident = require("../models/Accident");

router.get("/", async (req, res) => {
  try {
    const { severity, search } = req.query;
    let query = {};
    if (severity && severity !== "All") query.severity = severity;
    if (search) query.$or = [
      { accidentId: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
    res.json(await Accident.find(query).sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const a = await Accident.findOne({ accidentId: req.params.id });
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await new Accident(req.body).save());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await Accident.findOneAndUpdate(
      { accidentId: req.params.id }, req.body, { new: true }
    ));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Accident.findOneAndDelete({ accidentId: req.params.id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;