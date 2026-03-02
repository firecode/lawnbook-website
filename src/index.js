export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle signup API
    if (url.pathname === "/api/signup") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      if (request.method === "POST") {
        const headers = {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        };

        try {
          const body = await request.json();
          const email = (body.email || "").trim().toLowerCase();

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({ error: "Invalid email address" }), {
              status: 400,
              headers,
            });
          }

          const existing = await env.SIGNUPS.get(email);
          if (existing) {
            return new Response(
              JSON.stringify({ message: "You're already on the list!" }),
              { status: 200, headers }
            );
          }

          await env.SIGNUPS.put(
            email,
            JSON.stringify({
              email,
              signedUpAt: new Date().toISOString(),
              source: body.source || "website",
            })
          );

          return new Response(
            JSON.stringify({ message: "You're in! We'll notify you when we launch." }),
            { status: 200, headers }
          );
        } catch (err) {
          return new Response(JSON.stringify({ error: "Something went wrong" }), {
            status: 500,
            headers,
          });
        }
      }
    }

    // Serve R2 assets (video, large files)
    if (url.pathname.startsWith("/assets/")) {
      const key = url.pathname.slice("/assets/".length);
      const object = await env.ASSETS_R2.get(key);
      if (!object) {
        return new Response("Not found", { status: 404 });
      }
      const headers = new Headers();
      headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Accept-Ranges", "bytes");
      return new Response(object.body, { headers });
    }

    // Everything else — serve static assets
    return env.ASSETS.fetch(request);
  },
};
