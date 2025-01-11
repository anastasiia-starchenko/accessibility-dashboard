const express = require("express");
const axios = require("axios");

const app = express();

app.get("/analyze", async (req, res) => {
  try {
    const response = await axios.get("https://diia.gov.ua");
    res.send(response.data);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
fetch("http://localhost:3000/analyze")
  .then((response) => response.text())
  .then((html) => {
    console.log(html)
  })
  .catch((error) => console.error("Error:", error));