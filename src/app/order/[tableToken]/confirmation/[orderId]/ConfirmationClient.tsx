"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2, Clock, ChefHat, Bell, PartyPopper,
  ArrowLeft, Receipt
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems, OrderStatus } from "@/lib/supabase/types";
import { formatPrice } from "@/lib/utils";

const STATUS_STEPS: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: "pending",   label: "Order Received",  icon: Receipt      },
  { status: "accepted",  label: "Accepted",         icon: CheckCircle2 },
  { status: "preparing", label: "Preparing",        icon: ChefHat      },
  { status: "ready",     label: "Ready",            icon: Bell         },
  { status: "completed", label: "Completed",        icon: PartyPopper  },
];

const STATUS_ORDER: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "completed"];

interface Props {
  order: OrderWithItems;
  tableToken: string;
}

export default function ConfirmationClient({ order: initialOrder, tableToken }: Props) {
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const supabase = createClient();

  const tableLabel = `Table ${(initialOrder.table?.table_number ?? "").replace(/\D/g, "").padStart(2, "0")}`;
  const currentIdx = STATUS_ORDER.indexOf(status);

  useEffect(() => {
    const channel = supabase
      .channel(`order_${initialOrder.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          setStatus(payload.new.status as OrderStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialOrder.id, supabase]);

  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen bg-[#FAF3E8]">
      {/* Header */}
      <header className="bg-white border-b border-[#F2E6D0] px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={`/order/${tableToken}`}
            className="p-2 rounded-xl hover:bg-[#F2E6D0] transition-colors text-[#1A1108]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-[#1A1108]">
              Order Confirmation
            </h1>
            <p className="text-xs text-[#6B4C35]">{tableLabel}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Success banner */}
        <div className={`rounded-3xl p-6 text-center ${isRejected ? "bg-red-50 border border-red-100" : "bg-[#BF4E19]"}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isRejected ? "bg-red-100" : "bg-white/20"}`}>
            {isRejected ? (
              <span className="text-3xl">❌</span>
            ) : (
              <PartyPopper className="w-8 h-8 text-white" />
            )}
          </div>
          {isRejected ? (
            <>
              <h2 className="text-xl font-bold text-red-700 mb-1">
                Order Rejected
              </h2>
              <p className="text-red-600 text-sm">
                Sorry, we couldn&apos;t process your order. Please speak with a staff member.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">
                🎉 Order Placed Successfully!
              </h2>
              <p className="text-white/80 text-sm">
                Your order is confirmed and being processed.
              </p>
            </>
          )}
        </div>

        {/* Order info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F2E6D0]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6B4C35] uppercase tracking-wider mb-1">
                Order Number
              </p>
              <p className="font-bold text-[#1A1108] text-lg">
                #{initialOrder.order_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B4C35] uppercase tracking-wider mb-1">
                Table
              </p>
              <p className="font-bold text-[#1A1108] text-lg">{tableLabel}</p>
            </div>
          </div>
        </div>

        {/* Status tracker */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F2E6D0]">
          <h3 className="font-semibold text-[#1A1108] mb-5">Order Status</h3>
          {isRejected ? (
            <div className="text-center py-4 text-red-500">
              <p className="font-semibold">Order has been rejected</p>
              <p className="text-sm mt-1 text-[#6B4C35]">
                Please visit the counter or speak to staff.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {STATUS_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isPending = idx > currentIdx;

                return (
                  <div key={step.status} className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-[#BF4E19] text-white shadow-md ring-4 ring-[#BF4E19]/20"
                          : "bg-[#F2E6D0] text-[#6B4C35]"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className={`w-4 h-4 ${isCurrent ? "animate-pulse" : ""}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium text-sm ${
                          isCompleted || isCurrent
                            ? "text-[#1A1108]"
                            : "text-[#6B4C35]"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-[#BF4E19] mt-0.5">
                          {step.status === "pending"
                            ? "Waiting for café to accept..."
                            : step.status === "accepted"
                            ? "Order accepted!"
                            : step.status === "preparing"
                            ? "Kitchen is preparing your order..."
                            : step.status === "ready"
                            ? "Your order is ready! Staff will bring it shortly."
                            : "Enjoy your meal!"}
                        </p>
                      )}
                    </div>
                    {(isCompleted || isCurrent) && !isPending && (
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isCurrent ? "bg-[#BF4E19] animate-pulse" : "bg-green-500"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order items */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#F2E6D0]">
          <h3 className="font-semibold text-[#1A1108] mb-4">Your Order</h3>
          <div className="space-y-2">
            {initialOrder.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-[#3D2B1A]">
                  {item.quantity} × {item.item_name}
                </span>
                <span className="font-medium text-[#1A1108]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-[#F2E6D0] pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm text-[#3D2B1A]">
                <span>Subtotal</span>
                <span>{formatPrice(initialOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#3D2B1A]">
                <span>GST (5%)</span>
                <span>{formatPrice(initialOrder.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#1A1108] mt-2">
                <span>Total</span>
                <span className="text-[#BF4E19]">
                  {formatPrice(initialOrder.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to menu */}
        <Link
          href={`/order/${tableToken}`}
          className="block w-full text-center py-4 bg-[#F2E6D0] text-[#1A1108] rounded-2xl font-semibold hover:bg-[#E8D5B7] transition-colors"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
