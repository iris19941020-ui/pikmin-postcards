"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Postcard = {
  id: number;
  image: string;
  coords: string;
  method: string;
  country: string;
};

export default function Home() {
  const [data, setData] = useState<Postcard[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [countryFilter, setCountryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [form, setForm] = useState({
    image: null as File | null,
    coords: "",
    method: "菇",
    country: "",
  });

  // ===== 讀資料 =====
  const loadData = async () => {
    const { data, error } = await supabase
      .from("postcards")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setData(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isValid =
    form.image &&
    form.coords.trim() &&
    form.method &&
    form.country.trim();

  const filteredData = data.filter((card) => {
    const countryMatch =
      countryFilter === "all" || card.country === countryFilter;

    const methodMatch =
      methodFilter === "all" || card.method === methodFilter;

    return countryMatch && methodMatch;
  });

  const countries = Array.from(new Set(data.map((d) => d.country)));
  const methods = Array.from(new Set(data.map((d) => d.method)));

  // ===== 上傳 =====
  const handleUpload = async () => {
    if (!form.image) return;

    const fileName = `${Date.now()}-${form.image.name}`;

    // 1. upload image
    const { error: uploadError } = await supabase.storage
      .from("postcards")
      .upload(fileName, form.image);

    if (uploadError) {
      alert("圖片上傳失敗");
      return;
    }

    // 2. public url
    const { data: urlData } = supabase.storage
      .from("postcards")
      .getPublicUrl(fileName);

    // 3. insert DB
    await supabase.from("postcards").insert({
      image: urlData.publicUrl,
      coords: form.coords,
      method: form.method,
      country: form.country,
    });

    setForm({
      image: null,
      coords: "",
      method: "菇",
      country: "",
    });

    loadData();
  };

  // ===== delete =====
  const handleDelete = async (id: number) => {
    await supabase.from("postcards").delete().eq("id", id);
    loadData();
  };

  // ===== update =====
  const handleUpdate = async (card: Postcard) => {
    const coords = prompt("座標", card.coords);
    const country = prompt("國家", card.country);
    const method = prompt("方式", card.method);

    if (!coords || !country || !method) return;

    await supabase
      .from("postcards")
      .update({ coords, country, method })
      .eq("id", card.id);

    setOpenMenuId(null);
    loadData();
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Pikmin 明信片收藏
      </h1>

      {/* ===== 上傳 ===== */}
      <div className="grid gap-2 max-w-md mb-6">
        <input
          type="file"
          accept="image/*"
          className="border p-2"
          onChange={(e) =>
            setForm({ ...form, image: e.target.files?.[0] || null })
          }
        />

        <input
          placeholder="座標"
          className="border p-2"
          value={form.coords}
          onChange={(e) =>
            setForm({ ...form, coords: e.target.value })
          }
        />

        <select
          className="border p-2"
          value={form.method}
          onChange={(e) =>
            setForm({ ...form, method: e.target.value })
          }
        >
          <option value="菇">菇</option>
          <option value="掃描">掃描</option>
          <option value="花">花</option>
        </select>

        <input
          placeholder="國家"
          className="border p-2"
          value={form.country}
          onChange={(e) =>
            setForm({ ...form, country: e.target.value })
          }
        />

        <button
          disabled={!isValid}
          onClick={handleUpload}
          className="bg-black text-white p-2 rounded disabled:opacity-40"
        >
          新增明信片
        </button>
      </div>

      {/* ===== filter ===== */}
      <div className="flex gap-3 mb-6">
        <select
          className="border p-2"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="all">全部國家</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="border p-2"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="all">全部方式</option>
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <button
          className="border px-3"
          onClick={() => {
            setCountryFilter("all");
            setMethodFilter("all");
          }}
        >
          清除
        </button>
      </div>

      {/* ===== Pinterest ===== */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {filteredData.map((card) => (
          <div
            key={card.id}
            className="break-inside-avoid border rounded p-2 relative mb-3"
          >
            <img
              src={card.image}
              className="w-full rounded cursor-pointer"
              onClick={() => setSelectedImage(card.image)}
            />

            <p className="mt-2 text-sm font-semibold">
              {card.coords || "無座標"}
            </p>

            <p className="text-xs text-gray-500">
              {card.country} · {card.method}
            </p>

            {/* ⋯ menu */}
            <button
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 shadow"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(
                  openMenuId === card.id ? null : card.id
                );
              }}
            >
              ⋯
            </button>

            {openMenuId === card.id && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setOpenMenuId(null)}
                />

                <div className="absolute top-10 right-2 bg-white border rounded shadow z-20 w-28 text-sm">
                  <button
                    className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                    onClick={() => handleUpdate(card)}
                  >
                    編輯
                  </button>

                  <button
                    className="w-full px-3 py-2 hover:bg-red-50 text-left text-red-600"
                    onClick={() => handleDelete(card.id)}
                  >
                    刪除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ===== lightbox ===== */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-w-[90%] max-h-[90%]"
          />
        </div>
      )}
    </main>
  );
}