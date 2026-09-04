import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Only authenticated managers/admins can upload
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type & size
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    // Unique filename: timestamp + sanitised original name
    const ext = file.name.split(".").pop() ?? "jpg";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeName}.${ext}`;

    // Use service role client for storage upload
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await (adminClient.storage as any)
      .from("menu-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get the public URL
    const { data: urlData } = (adminClient.storage as any)
      .from("menu-images")
      .getPublicUrl(filename);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
