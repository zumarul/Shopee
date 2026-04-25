const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static("public"));

app.get("/api", async (req, res) => {
    const url = req.query.url;

    try {
        const r = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const html = r.data;
        const match = html.match(/"play_url":"(.*?)"/);

        if (match) {
            const video = match[1]
                .replace(/\\u0026/g, "&")
                .replace(/\\/g, "");

            res.json({ status: true, video });
        } else {
            res.json({ status: false });
        }

    } catch {
        res.json({ status: false });
    }
});

app.listen(process.env.PORT || 3000);