"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Coffee,
  ChevronLeft, ChevronRight, CalendarCheck, Save, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import type { Attendance, AttendanceStatus } from "@/lib/supabase/types";

const STATUSES: { value: AttendanceStatus; label: string; color: string; icon: any }[] = [
  { value: "present",  label: "Present",  color: "bg-green-500  text-white", icon: CheckCircle2 },
  { value: "absent",   label: "Absent",   color: "bg-red-500    text-white", icon: XCircle      },
  { value: "half_day", label: "Half Day", color: "bg-yellow-500 text-white", icon: Clock        },
  { value: "leave",    label: "Leave",    color: "bg-blue-500   text-white", icon: AlertCircle  },
  { value: "late",     label: "Late",     color: "bg-orange-500 text-white", icon: Coffee       },
];

const STATUS_MINI: Record<string, string> = {
  present: "bg-green-500", absent: "bg-red-500", half_day: "bg-yellow-400",
  leave: "bg-blue-500", late: "bg-orange-400",
};

type EmpMini = { id: string; name: string; employee_id: string; role: string };

interface DayEntry {
  status: AttendanceStatus;
  check_in: string;
  check_out: string;
  remarks: string;
  record_id?: string;
}

interface Props {
  employees: EmpMini[];
  todayRecords: Attendance[];
  monthRecords: Attendance[];
  today: string;
}

export default function AttendanceClient({ employees, todayRecords, monthRecords: initMonth, today }: Props) {
  const [activeTab, setActiveTab] = useState<"mark"|"monthly">("mark");
  const [monthRecords, setMonthRecords] = useState<Attendance[]>(initMonth);
  const [viewMonth, setViewMonth] = useState(new Date());

  // Build daily attendance state: empId -> DayEntry
  const [dayEntries, setDayEntries] = useState<Record<string, DayEntry>>(() => {
    const init: Record<string, DayEntry> = {};
    employees.forEach(e => {
      const rec = todayRecords.find(r => r.employee_id === e.id);
      init[e.id] = {
        status: rec?.status ?? "present",
        check_in: rec?.check_in ?? "",
        check_out: rec?.check_out ?? "",
        remarks: rec?.remarks ?? "",
        record_id: rec?.id,
      };
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [editEmp, setEditEmp] = useState<string|null>(null);
  const db = createClient() as any;

  // Mark all as present
  function markAll(status: AttendanceStatus) {
    setDayEntries(p => {
      const updated = { ...p };
      employees.forEach(e => { updated[e.id] = { ...updated[e.id], status }; });
      return updated;
    });
  }

  async function saveAttendance() {
    setSaving(true);
    try {
      const upserts = employees.map(e => ({
        employee_id: e.id, date: today,
        status: dayEntries[e.id]?.status ?? "present",
        check_in: dayEntries[e.id]?.check_in || null,
        check_out: dayEntries[e.id]?.check_out || null,
        remarks: dayEntries[e.id]?.remarks || null,
      }));
      const { error } = await db.from("attendance")
        .upsert(upserts, { onConflict: "employee_id,date" });
      if (error) throw error;
      toast.success("Attendance saved for " + format(new Date(today), "MMMM d, yyyy"));
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  // Monthly view calculations
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthRecordMap = useMemo(() => {
    const m: Record<string, Record<string, Attendance>> = {};
    monthRecords.forEach(r => {
      if (!m[r.employee_id]) m[r.employee_id] = {};
      m[r.employee_id][r.date] = r;
    });
    return m;
  }, [monthRecords]);

  const monthStats = useMemo(() => {
    return employees.map(emp => {
      const empRecs = monthRecordMap[emp.id] ?? {};
      const present = Object.values(empRecs).filter(r => r.status === "present").length;
      const absent  = Object.values(empRecs).filter(r => r.status === "absent").length;
      const half    = Object.values(empRecs).filter(r => r.status === "half_day").length;
      const leave   = Object.values(empRecs).filter(r => r.status === "leave").length;
      const late    = Object.values(empRecs).filter(r => r.status === "late").length;
      const total = present + absent + half + leave + late;
      const pct = total > 0 ? Math.round((present + late * 0.9 + half * 0.5) / total * 100) : 0;
      return { emp, present, absent, half, leave, late, total, pct };
    });
  }, [employees, monthRecordMap]);

  const todayStats = {
    present: Object.values(dayEntries).filter(e => e.status === "present").length,
    absent: Object.values(dayEntries).filter(e => e.status === "absent").length,
    late: Object.values(dayEntries).filter(e => e.status === "late").length,
    leave: Object.values(dayEntries).filter(e => e.status === "leave").length,
    half_day: Object.values(dayEntries).filter(e => e.status === "half_day").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2B1B14]">Attendance</h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(new Date(today), "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 w-fit shadow-sm border border-gray-100">
        {([["mark","Mark Today"],["monthly","Monthly View"]] as const).map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t ? "bg-[#E86A2A] text-white shadow-sm" : "text-gray-500 hover:text-[#2B1B14]"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Mark Today ── */}
      {activeTab === "mark" && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-5 gap-3">
            {[
              ["present","Present",todayStats.present,"bg-green-50 text-green-700"],
              ["absent","Absent",todayStats.absent,"bg-red-50 text-red-700"],
              ["late","Late",todayStats.late,"bg-orange-50 text-orange-700"],
              ["half_day","Half Day",todayStats.half_day,"bg-yellow-50 text-yellow-700"],
              ["leave","Leave",todayStats.leave,"bg-blue-50 text-blue-700"],
            ].map(([k,l,n,c]) => (
              <div key={k as string} className={`rounded-2xl p-4 text-center ${c}`}>
                <div className="text-2xl font-bold">{n}</div>
                <div className="text-xs font-medium mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          {/* Quick mark all */}
          <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-sm font-semibold text-[#2B1B14] mr-2">Mark all as:</span>
            {STATUSES.map(s => (
              <button key={s.value} onClick={() => markAll(s.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${s.color}`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Employee list */}
          <div className="space-y-2">
            {employees.map(emp => {
              const entry = dayEntries[emp.id] ?? { status: "present" as AttendanceStatus, check_in: "", check_out: "", remarks: "" };
              const isExpanded = editEmp === emp.id;
              return (
                <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 bg-[#E86A2A] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2B1B14] text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.employee_id} · {emp.role}</p>
                    </div>
                    {/* Status buttons */}
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {STATUSES.map(s => {
                        const Icon = s.icon;
                        return (
                          <button key={s.value}
                            onClick={() => setDayEntries(p => ({ ...p, [emp.id]: { ...entry, status: s.value } }))}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              entry.status === s.value ? s.color : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            <Icon className="w-3 h-3" />{s.label}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setEditEmp(isExpanded ? null : emp.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#E86A2A] transition-colors ml-1">
                      {isExpanded ? <X className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 grid grid-cols-3 gap-3 border-t border-gray-50">
                      {["check_in","check_out"].map(field => (
                        <div key={field}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">
                            {field.replace("_"," ")}
                          </label>
                          <input type="time" value={(entry as any)[field]}
                            onChange={e => setDayEntries(p => ({ ...p, [emp.id]: { ...entry, [field]: e.target.value } }))}
                            className="w-full px-3 py-2 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                        </div>
                      ))}
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Remarks</label>
                        <input value={entry.remarks} onChange={e => setDayEntries(p => ({ ...p, [emp.id]: { ...entry, remarks: e.target.value } }))}
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-[#FFF7ED] border border-[#E8D5C0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E86A2A]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {employees.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active employees. Add employees first.</p>
            </div>
          )}

          {employees.length > 0 && (
            <button onClick={saveAttendance} disabled={saving}
              className="flex items-center gap-2 bg-[#E86A2A] text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-[#C94F16] transition-colors disabled:opacity-60 shadow-md">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : `Save Attendance — ${format(new Date(today), "MMM d")}`}
            </button>
          )}
        </>
      )}

      {/* ── Monthly View ── */}
      {activeTab === "monthly" && (
        <>
          <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-fit">
            <button onClick={() => setViewMonth(p => subMonths(p, 1))}
              className="p-2 rounded-xl hover:bg-[#FFF7ED] transition-colors">
              <ChevronLeft className="w-5 h-5 text-[#2B1B14]" />
            </button>
            <h2 className="font-bold text-[#2B1B14] min-w-[160px] text-center">
              {format(viewMonth, "MMMM yyyy")}
            </h2>
            <button onClick={() => setViewMonth(p => addMonths(p, 1))}
              className="p-2 rounded-xl hover:bg-[#FFF7ED] transition-colors">
              <ChevronRight className="w-5 h-5 text-[#2B1B14]" />
            </button>
          </div>

          <div className="space-y-4">
            {monthStats.map(({ emp, present, absent, half, leave, late, pct }) => (
              <div key={emp.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#E86A2A] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#2B1B14]">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#E86A2A]">{pct}%</div>
                    <div className="text-xs text-gray-400">attendance</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs mb-3">
                  {[["green-600","Present",present],["red-600","Absent",absent],
                    ["yellow-600","Half",half],["blue-600","Leave",leave],["orange-600","Late",late]
                  ].map(([c,l,n]) => (
                    <div key={l as string} className={`p-2 rounded-xl bg-gray-50`}>
                      <div className={`font-bold text-base text-${c}`}>{n}</div>
                      <div className="text-gray-400">{l}</div>
                    </div>
                  ))}
                </div>
                {/* Day dots */}
                <div className="flex flex-wrap gap-1">
                  {daysInMonth.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const rec = monthRecordMap[emp.id]?.[dateStr];
                    return (
                      <div key={dateStr} title={`${format(day,"MMM d")}: ${rec?.status ?? "no record"}`}
                        className={`w-5 h-5 rounded-full ${rec ? STATUS_MINI[rec.status] : "bg-gray-100"} ${isToday(day) ? "ring-2 ring-[#E86A2A]" : ""}`} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
