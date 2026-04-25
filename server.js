const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static("public"));

// helper retry
async function tryFetch(fn, name) {
try {
const result = await fn();
if (result) return { video: result, source: name };
} catch {}
return null;
}

// resolve shortlink
async function resolveUrl(url) {
try {
const r = await axios.get(url, {
maxRedirects: 5,
timeout: 8000,
headers: { "User-Agent": "Mozilla/5.0" }
});
return r.request.res.responseUrl;
} catch {
return url;
}
}

app.get("/api", async (req, res) => {
const url = req.query.url;
if (!url) return res.json({ status: false, msg: "No URL" });

```
try {
    const realUrl = await resolveUrl(url);

    // 🔥 METHOD 1: scrape langsung
    let result = await tryFetch(async () => {
        const page = await axios.get(realUrl, {
            timeout: 8000,
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://shopee.co.id/",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        const html = page.data;

        const match =
            html.match(/"play_url":"(.*?)"/) ||
            html.match(/"video_url":"(.*?)"/);

        if (!match) return null;

        return match[1]
            .replace(/\\u0026/g, "&")
            .replace(/\\/g, "");
    }, "scrape");

    // 🔥 METHOD 2: fallback API gratis
    if (!result) {
        result = await tryFetch(async () => {
            const api = await axios.get(
                `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
                { timeout: 8000 }
            );
            return api.data.video?.noWatermark || api.data.video;
        }, "fallback-api");
    }

    // 🔥 RESPONSE
    if (result) {
        res.json({
            status: true,
            video: result.video,
            source: result.source
        });
    } else {
        res.json({
            status: false,
            msg: "Video tidak ditemukan / diblok Shopee"
        });
    }

} catch {
    res.json({
        status: false,
        msg: "Server error / timeout"
    });
}
```

});

// ping test
app.get("/ping", (req, res) => {
res.send("OK");
});

app.listen(process.env.PORT || 3000, () => {
console.log("🔥 Server running");
});
