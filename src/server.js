const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// first endpoint 
app.get("/api", (req, res) => {
    res.send("Hello world!");
});

app.listen(PORT, () => {
    console.log(`Server listens on port ${PORT}`);
})



