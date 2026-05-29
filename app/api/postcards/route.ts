import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ✅ 用 server env（不要 NEXT_PUBLIC）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * GET：取得所有明信片
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("postcards")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    return Response.json(data);
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST：上傳圖片 + 寫入 DB
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File | null;
    const coords = formData.get("coords")?.toString();
    const method = formData.get("method")?.toString();
    const country = formData.get("country")?.toString();

    if (!file || !coords || !method || !country) {
      return Response.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${file.name}`;

    // 1️⃣ upload image
    const { error: uploadError } = await supabase.storage
      .from("postcards")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 2️⃣ get public url
    const { data: urlData } = supabase.storage
      .from("postcards")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 3️⃣ insert DB
    const { data, error } = await supabase
      .from("postcards")
      .insert([
        {
          image: publicUrl,
          coords,
          method,
          country,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE：刪除明信片
 */
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("postcards")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT：更新明信片
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("postcards")
      .update({
        coords: body.coords,
        method: body.method,
        country: body.country,
      })
      .eq("id", body.id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}