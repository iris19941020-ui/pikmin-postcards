
"use client";

import { useEffect, useState } from "react";

type Postcard = {
  id: number;
  image: string;
  coords: string;
  method: string;
  country: string;
};

export default function Home() {
  const [data, setData] = useState<Postcard[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [countryFilter, setCountryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    image: null as File | null,
    coords: "",
    method: "菇",
    country: "",
  });

  const loadData = async () => {
    const res = await fetch("/api/postcards");
    const json = await res.json();
    setData(json.reverse());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const filteredData = data.filter((card) => {
    const countryMatch =
      countryFilter === "all" || card.country === countryFilter;

    const methodMatch =
      methodFilter === "all" || card.method === methodFilter;

    return countryMatch && methodMatch;
  });

  const countries = Array.from(new Set(data.map((d) => d.country)));
  const methods = Array.from(new Set(data.map((d) => d.method)));

  const isValid =
    form.image &&
    form.coords.trim() &&
    form.method &&
    form.country.trim();

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">

      {/* toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-5 py-3 rounded-full shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      {/* HERO */}
      <section className="px-6 md:px-12 pt-12 pb-8">
        <div className="max-w-7xl mx-auto">

          <p className="text-sm tracking-[0.25em] uppercase text-stone-400 mb-3">
            Pikmin Collection
          </p>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Pikmin Postcards
          </h1>

          <p className="mt-4 text-stone-500 max-w-xl leading-relaxed">
            世界各地的皮克敏明信片收藏。
          </p>

          <div className="flex gap-3 mt-8">

            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-stone-100">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-stone-500 mt-1">明信片</p>
            </div>

            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-stone-100">
              <p className="text-2xl font-bold">{countries.length}</p>
              <p className="text-xs text-stone-500 mt-1">國家</p>
            </div>

          </div>
        </div>
      </section>

      {/* floating add button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-stone-900 text-white text-3xl shadow-xl hover:scale-105 transition"
      >
        +
      </button>

      {/* upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">

          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl p-6 relative">

            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 transition"
            >
              ✕
            </button>

            <div className="mb-6">
              <p className="text-sm tracking-[0.2em] uppercase text-stone-400 mb-2">
                Add postcard
              </p>
              <h2 className="text-3xl font-black">新增明信片</h2>
            </div>

            <div className="grid gap-3">

              <input
                type="file"
                accept="image/*"
                className="bg-stone-50 rounded-2xl px-4 py-4 text-sm"
                onChange={(e) =>
                  setForm({ ...form, image: e.target.files?.[0] || null })
                }
              />

              <input
                placeholder="座標"
                className="bg-stone-50 rounded-2xl px-4 py-4 text-sm"
                value={form.coords}
                onChange={(e) =>
                  setForm({ ...form, coords: e.target.value })
                }
              />

              <select
                className="bg-stone-50 rounded-2xl px-4 py-4 text-sm"
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
                className="bg-stone-50 rounded-2xl px-4 py-4 text-sm"
                value={form.country}
                onChange={(e) =>
                  setForm({ ...form, country: e.target.value })
                }
              />

              <button
                disabled={!isValid || loading}
                className="mt-2 h-14 rounded-2xl bg-stone-900 text-white font-medium disabled:opacity-40"
                onClick={async () => {
                  try {
                    setLoading(true);

                    const fd = new FormData();
                    fd.append("image", form.image!);
                    fd.append("coords", form.coords);
                    fd.append("method", form.method);
                    fd.append("country", form.country);

                    const res = await fetch("/api/postcards", {
                      method: "POST",
                      body: fd,
                    });

                    if (!res.ok) throw new Error("upload failed");

                    setForm({
                      image: null,
                      coords: "",
                      method: "菇",
                      country: "",
                    });

                    setShowUploadModal(false);
                    loadData();
                    showToast("新增成功 ✨");

                  } catch (err) {
                    showToast("新增失敗 ❌");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "上傳中..." : "新增明信片"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* filters */}
      <section className="px-6 md:px-12 mb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3">

          <select
            className="bg-white border border-stone-200 rounded-full px-5 py-2 text-sm shadow-sm"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            <option value="all">全部國家</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="bg-white border border-stone-200 rounded-full px-5 py-2 text-sm shadow-sm"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">全部方式</option>
            {methods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

        </div>
      </section>

      {/* gallery */}
      <section className="px-4 md:px-10 pb-16">

        <div className="columns-2 md:columns-3 lg:columns-5 gap-5 space-y-5">

          {filteredData.map((card) => (
            <div
              key={card.id}
              className="break-inside-avoid bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition"
            >

              <img
                src={card.image}
                className="w-full cursor-pointer hover:scale-[1.03] transition"
                onClick={() => {
                  navigator.clipboard.writeText(card.coords);
                  showToast("已複製座標 📋");
                }}
              />

              <div className="p-4 relative">

                {/* delete */}
                <button
                  onClick={async () => {
                    const ok = confirm("確定要刪除這張明信片嗎？");

                    if (!ok) return;

                    try {
                      const res = await fetch("/api/postcards", {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id: card.id,
                        }),
                      });

                      if (!res.ok) {
                        throw new Error("delete failed");
                      }

                      loadData();
                      showToast("刪除成功 🗑️");

                    } catch {
                      showToast("刪除失敗 ❌");
                    }
                  }}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold transition"
                >
                  ✕
                </button>

                <div className="flex justify-between mb-3 pr-8">
                  <span className="text-xs px-3 py-1 rounded-full bg-stone-100">
                    {card.country}
                  </span>

                  <span className="text-xs px-3 py-1 rounded-full bg-stone-900 text-white">
                    {card.method}
                  </span>
                </div>

                <p className="text-sm break-all">{card.coords}</p>
              </div>
            </div>
          ))}

        </div>
      </section>
    </main>
  );
}
