import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET
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
 * POST
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File;

    if (!file) {
      return Response.json(
        { error: "No image" },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${file.name}`;

    // upload storage
    const { error: uploadError } =
      await supabase.storage
        .from("postcards")
        .upload(fileName, file);

    if (uploadError) {
      return Response.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // public url
    const { data } = supabase.storage
      .from("postcards")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    // insert DB
    const { data: inserted, error } =
      await supabase
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

    return Response.json(inserted);
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE
 */
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    // 找資料
    const { data: postcard, error: findError } =
      await supabase
        .from("postcards")
        .select("*")
        .eq("id", id)
        .single();

    if (findError || !postcard) {
      return Response.json(
        { error: "Postcard not found" },
        { status: 404 }
      );
    }

    // 從 URL 拿檔名
    const imageUrl = postcard.image;

    const fileName =
      imageUrl.split("/postcards/")[1];

    // 刪 Storage 圖片
    if (fileName) {
      await supabase.storage
        .from("postcards")
        .remove([fileName]);
    }

    // 刪 DB
    const { error: deleteError } =
      await supabase
        .from("postcards")
        .delete()
        .eq("id", id);

    if (deleteError) {
      return Response.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PUT
 */
export async function PUT(req: Request) {
  try {
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

    return Response.json({
      success: true,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}