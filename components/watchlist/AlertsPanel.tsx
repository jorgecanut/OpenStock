"use client";

import React from "react";
import { Trash2, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getPeDropThreshold } from "@/lib/alerts/pe";
import { deleteAlert } from "@/lib/actions/alert.actions";

interface AlertsPanelProps {
    alerts: any[];
    onRefresh?: () => void;
}

function getAlertDescription(alert: any): string {
    if (alert.alertKind === "PE_DROP") {
        const threshold = getPeDropThreshold(alert.basePeRatio, alert.dropPercent);
        const thresholdText = Number.isFinite(threshold) ? threshold.toFixed(2) : "—";
        return `P/E drops ${alert.dropPercent}% below ${alert.basePeRatio} (≤ ${thresholdText})`;
    }
    return `Price ${String(alert.condition ?? "").toLowerCase()} ${formatCurrency(alert.targetPrice)}`;
}

export default function AlertsPanel({ alerts, onRefresh }: AlertsPanelProps) {
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this alert?")) {
            await deleteAlert(id);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                    Alerts
                </h2>
                {/* <button className="text-sm text-yellow-500 hover:underline">Create Alert</button> */}
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active alerts. Add one from the watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert._id} className="bg-gray-800/40 rounded-lg p-3 border border-gray-800 relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
                                            {alert.symbol[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">
                                                {alert.alertName ? `${alert.alertName} · ${alert.symbol}` : alert.symbol}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {alert.alertKind === "PE_DROP" ? (
                                                    <>Trigger at P/E ≤ {Number.isFinite(getPeDropThreshold(alert.basePeRatio, alert.dropPercent)) ? getPeDropThreshold(alert.basePeRatio, alert.dropPercent).toFixed(2) : "—"}</>
                                                ) : (
                                                    <>Target: {formatCurrency(alert.targetPrice)}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${alert.alertKind === "PE_DROP" ? "bg-purple-500/15 text-purple-300" : "bg-yellow-500/15 text-yellow-400"}`}>
                                            {alert.alertKind === "PE_DROP" ? "P/E drop" : "Price"}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-yellow-500 font-medium">
                                        Condition: {getAlertDescription(alert)}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        Active until {new Date(new Date(alert.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={() => handleDelete(alert._id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
