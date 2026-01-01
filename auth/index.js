import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

// 🚨 Set same secret for Tasks & NGINX later
const SECRET = "SUPER_SECRET_KEY";

// 📌 Connect to MongoDB (inside docker)
mongoose.connect(process.env.MONGO_URL || "mongodb://mongo:27017/taskapp")
  .then(() => console.log("Auth DB Connected"))
  .catch(err => console.error("Mongo Error:", err));

// 👤 User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model("User", userSchema);

// ✨ Register
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  // check exists
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).send("User already exists!");

  const hashed = await bcrypt.hash(password, 10);

  await User.create({ email, password: hashed });
  res.send("User registered 🎉");
});

// 🔑 Login — returns JWT
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).send("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).send("Invalid password");

  const token = jwt.sign({ email }, SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// 🛂 Validation — NGINX uses this!
app.get("/validate", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    jwt.verify(token, SECRET);
    res.sendStatus(200);
  } catch {
    res.sendStatus(403);
  }
});

app.listen(4000, () => console.log("Auth service running on 4000 🚀"));
