const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

// some change
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    res.send("Hello world!");
});

app.put("/api", (req, res) => {
    console.log("put req called");
})

app.listen(PORT, () => {
    console.log(`Server listens on port ${PORT}`);
})



