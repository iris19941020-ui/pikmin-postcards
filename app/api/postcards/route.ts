import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DB_PATH = path.join(process.cwd(), "data/postcards.json");

// 讀資料
export async function GET() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  return Response.json(data);
}

// 新增
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("image") as File;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(process.cwd(), "public/uploads", fileName);

  fs.writeFileSync(filePath, buffer);

  const newCard = {
    id: Date.now(),
    image: "/uploads/" + fileName,
    coords: formData.get("coords") || "",
    method: formData.get("method") || "",
    country: formData.get("country") || "",
  };

  const old = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  old.push(newCard);

  fs.writeFileSync(DB_PATH, JSON.stringify(old, null, 2));

  return Response.json(newCard);
}

// ❌ 刪除
export async function DELETE(req: Request) {
  const { id } = await req.json();

  const old = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  const filtered = old.filter((item: any) => item.id !== id);

  fs.writeFileSync(DB_PATH, JSON.stringify(filtered, null, 2));

  return Response.json({ success: true });
}

// ✏️ 編輯
export async function PUT(req: Request) {
  const body = await req.json();

  const old = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));

  const updated = old.map((item: any) =>
    item.id === body.id
      ? { ...item, ...body }
      : item
  );

  fs.writeFileSync(DB_PATH, JSON.stringify(updated, null, 2));

  return Response.json({ success: true });
}