export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
