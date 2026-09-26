import { getStore } from "@netlify/blobs";

const store = getStore("gallery-memory-uploads");

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function cleanName(name = "foto") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");

  try {
    // GET /api/photos
    if (req.method === "GET" && path === "/photos") {
      const { blobs } = await store.list();
      const result = [];

      for (const blob of blobs) {
        const meta = await store.getMetadata(blob.key);
        result.push({
          name: blob.key,
          url: `/api/photo/${encodeURIComponent(blob.key)}`,
          originalName: meta?.metadata?.originalName || "foto",
          createdAt: meta?.metadata?.createdAt || 0
        });
      }

      result.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
      return json(result);
    }

    // GET /api/photo/:key
    if (req.method === "GET" && path.startsWith("/photo/")) {
      const key = decodeURIComponent(path.slice("/photo/".length));
      const entry = await store.getWithMetadata(key, { type: "arrayBuffer" });

      if (!entry) {
        return new Response("Foto tidak ditemukan", { status: 404 });
      }

      return new Response(entry.data, {
        status: 200,
        headers: {
          "Content-Type": entry.metadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    }

    // POST /api/upload
    if (req.method === "POST" && path === "/upload") {
      const form = await req.formData();
      const files = form.getAll("photos").filter(v => v instanceof File);

      if (!files.length) {
        return json({ message: "Tidak ada foto yang dipilih." }, 400);
      }

      if (files.length > 20) {
        return json({ message: "Maksimal 20 foto sekali upload." }, 400);
      }

      const saved = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        // Netlify Blobs is intended for relatively small unstructured values.
        // Reject very large original files rather than silently failing.
        if (file.size > 5 * 1024 * 1024) {
          return json({
            message: `${file.name} terlalu besar. Maksimal 5 MB per foto.`
          }, 400);
        }

        const key = `${Date.now()}_${crypto.randomUUID()}_${cleanName(file.name)}`;

        await store.set(key, file, {
          metadata: {
            contentType: file.type,
            originalName: file.name,
            createdAt: Date.now().toString()
          }
        });

        saved.push({
          name: key,
          originalName: file.name,
          url: `/api/photo/${encodeURIComponent(key)}`
        });
      }

      return json({
        message: "Foto berhasil disimpan.",
        files: saved
      });
    }

    // DELETE /api/delete/:key
    if (req.method === "DELETE" && path.startsWith("/delete/")) {
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return json({
          message: "ADMIN_PASSWORD belum diatur di Netlify."
        }, 500);
      }

      const provided = req.headers.get("X-Admin-Password") || "";
      if (provided !== adminPassword) {
        return json({ message: "Password admin salah." }, 403);
      }

      const key = decodeURIComponent(path.slice("/delete/".length));
      await store.delete(key);

      return json({ message: "Foto berhasil dihapus." });
    }

    return json({ message: "Endpoint tidak ditemukan." }, 404);
  } catch (error) {
    console.error(error);
    return json({
      message: error?.message || "Terjadi kesalahan di server."
    }, 500);
  }
};

export const config = {
  path: "/api/*"
};
