import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const app = express();
app.use(express.json());

// 🚨 Set same secret for Tasks & NGINX later
const SECRET = "SUPER_SECRET_KEY";

// 📌 Connect to MongoDB (inside docker)
mongoose.connect(process.env.MONGO_URL || "mongodb+srv://utkarshsingh500500:AvNQD31mJn4ATxf2@cluster0.zhpzk7l.mongodb.net/taskapp?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("task DB Connected"))
  .catch(err => console.error("Mongo Error:", err));


const taskSchema = new mongoose.Schema({
   title: String,
   user: String
});
const Task = mongoose.model("Task", taskSchema);


function auth(req,res,next){
    try {
        const token=req.headers.authorization?.split(" ")[1];
        const decode=jwt.verify(token,SECRET)
        req.user=decode.email
        next()
        
    } catch {
            res.status(403).send("Not authorized");

    }
}


app.get("/tasks",auth,async(req,res)=>{
    const task=await Task.find({user:req.user})
    res.json(task)
})


app.post("/tasks", auth, async (req, res) => {
  const task = await Task.create({ title: req.body.title, user: req.user });
  res.json(task);
});


app.listen(4001, () => console.log("Task service running 4001🚀"));

















