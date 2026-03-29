import { useState, useCallback } from "react";
import { json } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import {
  Scissors,
  Plus,
  Trash2,
  Package,
  Palette,
  Ruler,
  Grid3X3,
  Sparkles,
} from "lucide-react";
import { authenticate } from "../shopify.server";
import { db } from "../firebase.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const doc = await db.collection("splitConfig").doc(shop).get();
  const configs = doc.exists ? doc.data().items || [] : [];
  return json({ shop, configs });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const configs = JSON.parse(formData.get("configs"));
    await db.collection("splitConfig").doc(shop).set({ items: configs });
    return json({ success: true });
  }

  if (intent === "delete") {
    const productId = formData.get("productId");
    const doc = await db.collection("splitConfig").doc(shop).get();
    const items = doc.exists ? doc.data().items || [] : [];
    const updated = items.filter((i) => i.productId !== productId);
    await db.collection("splitConfig").doc(shop).set({ items: updated });
    return json({ success: true });
  }

  return json({ success: false });
};

const SPLIT_OPTIONS = [
  {
    value: "color",
    label: "Color",
    desc: "One card per color option",
    icon: Palette,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    value: "size",
    label: "Size",
    desc: "One card per size option",
    icon: Ruler,
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    value: "all",
    label: "All Variants",
    desc: "One card per every variant",
    icon: Grid3X3,
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
];

export default function Index() {
  const { shop, configs: initialConfigs } = useLoaderData();
  const [configs, setConfigs] = useState(initialConfigs);
  const [modal, setModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [splitBy, setSplitBy] = useState("color");
  const fetcher = useFetcher();

  const openPicker = useCallback(async () => {
    const products = await window.shopify.resourcePicker({
      type: "product",
      multiple: false,
    });
    if (products && products.length > 0) {
      setSelectedProduct(products[0]);
      setSplitBy("color");
      setModal(true);
    }
  }, []);

  const handleAdd = () => {
    if (!selectedProduct) return;
    if (configs.find((c) => c.productId === selectedProduct.id)) {
      setModal(false);
      return;
    }
    const updated = [
      ...configs,
      {
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productImage: selectedProduct.images?.[0]?.originalSrc || null,
        productHandle: selectedProduct.handle,
        splitBy,
      },
    ];
    setConfigs(updated);
    fetcher.submit(
      { intent: "save", configs: JSON.stringify(updated) },
      { method: "post" }
    );
    setModal(false);
    setSelectedProduct(null);
  };

  const handleDelete = (productId) => {
    const updated = configs.filter((c) => c.productId !== productId);
    setConfigs(updated);
    fetcher.submit({ intent: "delete", productId }, { method: "post" });
  };

  const getOpt = (val) =>
    SPLIT_OPTIONS.find((o) => o.value === val) || SPLIT_OPTIONS[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #ebebeb",
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: "#e60023",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Scissors size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#111",
                letterSpacing: -0.4,
                lineHeight: 1.2,
              }}
            >
              xVariants
            </div>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.2 }}>
              {shop}
            </div>
          </div>
        </div>
        <button
          onClick={openPicker}
          style={{
            background: "#e60023",
            color: "#fff",
            border: "none",
            borderRadius: 100,
            padding: "9px 18px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: -0.2,
          }}
        >
          <Plus size={15} strokeWidth={3} />
          Add product
        </button>
      </div>

      <div style={{ padding: "28px 28px 60px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1px solid #ebebeb",
            borderRadius: 100,
            padding: "5px 12px",
            marginBottom: 24,
            fontSize: 12,
            color: "#555",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: configs.length > 0 ? "#22c55e" : "#d1d5db",
            }}
          />
          {configs.length === 0
            ? "No products split yet"
            : configs.length + " product" + (configs.length !== 1 ? "s" : "") + " configured"}
        </div>

        {configs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px 40px" }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "#fff",
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              }}
            >
              <Scissors size={34} color="#e60023" />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#111",
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              Split your first product
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#888",
                maxWidth: 340,
                margin: "0 auto 28px",
                lineHeight: 1.6,
              }}
            >
              Each variant shows as a separate card on your collection pages.
              Works with any Shopify theme.
            </div>
            <button
              onClick={openPicker}
              style={{
                background: "#e60023",
                color: "#fff",
                border: "none",
                borderRadius: 100,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={16} />
              Add your first product
            </button>
          </div>
        )}

        {configs.length > 0 && (
          <div style={{ columns: "auto 260px", gap: 16 }}>
            {configs.map((config) => {
              const opt = getOpt(config.splitBy);
              const Icon = opt.icon;
              return (
                <div
                  key={config.productId}
                  style={{
                    breakInside: "avoid",
                    marginBottom: 16,
                    background: "#fff",
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  {config.productImage ? (
                    <img
                      src={config.productImage}
                      alt={config.productTitle}
                      style={{ width: "100%", display: "block", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        paddingTop: "68%",
                        background: "#f9fafb",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Package size={36} color="#d1d5db" />
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "14px" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111",
                        marginBottom: 10,
                        lineHeight: 1.4,
                      }}
                    >
                      {config.productTitle}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: opt.bg,
                          color: opt.color,
                          border: "1px solid " + opt.border,
                          borderRadius: 100,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <Icon size={11} strokeWidth={2.5} />
                        {opt.label}
                      </div>
                      <button
                        onClick={() => handleDelete(config.productId)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          border: "none",
                          background: "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 22,
              padding: 26,
              width: "100%",
              maxWidth: 390,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#f3f4f6",
                  flexShrink: 0,
                }}
              >
                {selectedProduct.images?.[0]?.originalSrc ? (
                  <img
                    src={selectedProduct.images[0].originalSrc}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={22} color="#9ca3af" />
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>
                  {selectedProduct.title}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
                  Choose how to split
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {SPLIT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = splitBy === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "2px solid " + (active ? opt.color : "#f0f0f0"),
                      background: active ? opt.bg : "#fafafa",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="splitBy"
                      value={opt.value}
                      checked={active}
                      onChange={() => setSplitBy(opt.value)}
                      style={{ display: "none" }}
                    />
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: active ? opt.color : "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={active ? "#fff" : "#9ca3af"} strokeWidth={2.5} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setModal(false); setSelectedProduct(null); }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1.5px solid #e5e7eb",
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#e60023",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Scissors size={15} strokeWidth={2.5} />
                Split it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
