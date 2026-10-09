"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Printer, Plus, Trash2, Table2, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import type { CafeTable } from "@/lib/supabase/types";

interface Props {
  tables: CafeTable[];
  activeOrders: any[];
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-50 border-green-200 text-green-700",
  occupied:  "bg-orange-50 border-orange-200 text-orange-700",
  reserved:  "bg-blue-50  border-blue-200  text-blue-700",
};

export default function TablesClient({ tables: initialTables, activeOrders }: Props) {
  const [tables, setTables] = useState<CafeTable[]>(initialTables);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // Build a map of table_id -> active order
  const orderByTable = activeOrders.reduce<Record<string, any>>((acc, o) => {
    if (!acc[o.table_id]) acc[o.table_id] = o;
    return acc;
  }, {});

  // Generate QR codes for all tables
  useEffect(() => {
    async function generateAll() {
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const urls: Record<string, string> = {};
      for (const table of tables) {
        try {
          urls[table.id] = await QRCode.toDataURL(
            `${baseUrl}/order/${table.qr_token}`,
            {
              width: 300,
              margin: 2,
              color: { dark: "#1A1108", light: "#FFFFFF" },
            }
          );
        } catch {}
      }
      setQrDataUrls(urls);
    }
    generateAll();
  }, [tables]);

  function downloadQR(tableId: string, tableNumber: string) {
    const url = qrDataUrls[tableId];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `KOKO_QR_Table${tableNumber}.png`;
    a.click();
  }

  function printQR(tableId: string, tableNumber: string) {
    const url = qrDataUrls[tableId];
    if (!url) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const tableLabel = `Table ${tableNumber.replace(/\D/g, "").padStart(2, "0")}`;
    win.document.write(`
      <html>
        <head>
          <title>KOKO QR – ${tableLabel}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: #FAF3E8; }
            .card { display: inline-block; background: white; border-radius: 20px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { font-size: 28px; font-weight: 900; color: #1A1108; margin: 0; }
            h2 { font-size: 16px; color: #6B4C35; margin: 4px 0 20px; }
            img { width: 220px; height: 220px; display: block; margin: 0 auto 20px; }
            p { color: #3D2B1A; font-size: 14px; margin: 0; }
            .table-badge { background: #BF4E19; color: white; font-size: 22px; font-weight: 800; padding: 8px 24px; border-radius: 12px; display: inline-block; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>KOKO</h1>
            <h2>Café & Bakers</h2>
            <img src="${url}" alt="QR Code" />
            <p>Scan to order</p>
            <div class="table-badge">${tableLabel}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  async function addTable() {
    if (!newTableNumber.trim()) return;
    setSaving(true);
    try {
      const token = newTableNumber.trim().toUpperCase();
      const db = supabase as any;
      const { data, error } = await db
        .from("tables")
        .insert([{ table_number: token, qr_token: token, status: "available" }])
        .select()
        .single();
      if (error) throw error;
      setTables((prev) => [...prev, data]);
      setNewTableNumber("");
      setAdding(false);
      toast.success(`Table ${token} added`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add table");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTable(id: string) {
    if (!confirm("Delete this table?")) return;
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTables((prev) => prev.filter((t) => t.id !== id));
    toast.success("Table removed");
  }

  async function resetTableStatus(id: string) {
    const { error } = await (supabase as any)
      .from("tables")
      .update({ status: "available" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "available" } : t))
    );
    toast.success("Table reset to available");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1108]">
            Table & QR Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tables.length} tables · Generate and download QR codes
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 bg-[#BF4E19] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Add table form */}
      {adding && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#1A1108] mb-3">New Table</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="e.g. T11"
              className="flex-1 px-4 py-2.5 bg-[#FAF3E8] border border-[#E8D5B7] rounded-xl text-sm text-[#1A1108] focus:outline-none focus:ring-2 focus:ring-[#BF4E19]"
              onKeyDown={(e) => e.key === "Enter" && addTable()}
            />
            <button
              onClick={addTable}
              disabled={saving}
              className="bg-[#BF4E19] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#A33D10] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tables.map((table) => {
          const activeOrder = orderByTable[table.id];
          const statusColor = STATUS_COLORS[table.status] ?? STATUS_COLORS.available;

          return (
            <div
              key={table.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4"
            >
              {/* Table header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-[#BF4E19]" />
                  <span className="font-bold text-[#1A1108]">
                    Table {table.table_number.replace(/\D/g, "").padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {table.status !== "available" && (
                    <button
                      onClick={() => resetTableStatus(table.id)}
                      className="p-1.5 text-gray-400 hover:text-[#BF4E19] transition-colors"
                      title="Reset to available"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status badge */}
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${statusColor}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  table.status === "available" ? "bg-green-500" :
                  table.status === "occupied"  ? "bg-orange-500" : "bg-blue-500"
                }`} />
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                {activeOrder && (
                  <span className="ml-1">· #{activeOrder.order_number}</span>
                )}
              </div>

              {/* QR code */}
              <div className="flex justify-center bg-[#FAF3E8] rounded-2xl p-4">
                {qrDataUrls[table.id] ? (
                  <img
                    src={qrDataUrls[table.id]}
                    alt={`QR for Table ${table.table_number}`}
                    className="w-36 h-36"
                  />
                ) : (
                  <div className="w-36 h-36 bg-[#F2E6D0] rounded-xl flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-[#E8D5B7]" />
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-[#6B4C35]">
                /order/{table.qr_token}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadQR(table.id, table.table_number)}
                  disabled={!qrDataUrls[table.id]}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#FAF3E8] text-[#BF4E19] rounded-xl text-xs font-semibold hover:bg-[#F2E6D0] transition-colors disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => printQR(table.id, table.table_number)}
                  disabled={!qrDataUrls[table.id]}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1A1108] text-white rounded-xl text-xs font-semibold hover:bg-[#3D2B1A] transition-colors disabled:opacity-40"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
