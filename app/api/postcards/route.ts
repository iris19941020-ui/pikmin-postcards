import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET：取得所有明信片
 */
export async function GET() {
  const { data, error } = await supabase
    .from("postcards")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json(data);
}

/**
 * POST：上傳圖片 + 寫入資料
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File;

    if (!file) {
      return Response.json(
        { error: "No image uploaded" },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${file.name}`;

    // 1️⃣ 上傳圖片到 Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("postcards")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return Response.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // 2️⃣ 取得公開 URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("postcards")
      .getPublicUrl(fileName);

    // 3️⃣ 寫入資料表
    const { data, error } = await supabase
      .from("postcards")
      .insert([
        {
          image: publicUrl,
          coords: formData.get("coords"),
          method: formData.get("method"),
          country: formData.get("country"),
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

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
  const { id } = await req.json();

  const { error } = await supabase
    .from("postcards")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}

/**
 * PUT：更新明信片
 */
export async function PUT(req: Request) {
  const body = await req.json();

  const { error } = await supabase
    .from("postcards")
    .update({
      coords: body.coords,
      method: body.method,
      country: body.country,
    })
    .eq("id", body.id);

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}