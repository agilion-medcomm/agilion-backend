const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
    res.status(200).json({ message: "API is set and ready to go!" });
});

app.listen(PORT, () => {
    console.log(`Server listens on port ${PORT}`);
})



