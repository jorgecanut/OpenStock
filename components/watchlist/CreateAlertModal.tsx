"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAlert } from "@/lib/actions/alert.actions";
import { getPeDropThreshold } from "@/lib/alerts/pe";
import { toast } from "sonner"; // Assuming sonner is available or use existing toast

type AlertKind = "PRICE" | "PE_DROP";

interface CreateAlertModalProps {
    userId: string;
    symbol: string;
    currentPrice: number;
    currentPeRatio?: number | null;
    companyName?: string; // Optional prop for better display
    onAlertCreated?: () => void;
    children?: React.ReactNode;
    // Controlled props
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateAlertModal({
    userId,
    symbol,
    currentPrice,
    currentPeRatio = null,
    companyName = "",
    onAlertCreated,
    children,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: CreateAlertModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const [alertKind, setAlertKind] = useState<AlertKind>("PRICE");
    const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString());
    const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
    const [basePeRatio, setBasePeRatio] = useState<string>(currentPeRatio?.toString() ?? "");
    const [dropPercent, setDropPercent] = useState<string>("10");
    const [alertName, setAlertName] = useState("");
    const [loading, setLoading] = useState(false);

    // Update defaults when market data changes (e.g. freshly fetched)
    React.useEffect(() => {
        setTargetPrice(currentPrice.toString());
    }, [currentPrice]);

    React.useEffect(() => {
        if (currentPeRatio != null && Number.isFinite(currentPeRatio) && currentPeRatio > 0) {
            setBasePeRatio(currentPeRatio.toString());
        }
    }, [currentPeRatio]);

    const parsedBasePe = parseFloat(basePeRatio);
    const parsedDrop = parseFloat(dropPercent);
    const peThreshold = getPeDropThreshold(parsedBasePe, parsedDrop);
    const peInputsValid =
        Number.isFinite(parsedBasePe) && parsedBasePe > 0 &&
        Number.isFinite(parsedDrop) && parsedDrop > 0 && parsedDrop < 100;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (alertKind === "PE_DROP") {
                if (!peInputsValid) {
                    toast.error("Enter a valid base P/E and a drop % between 0 and 100");
                    return;
                }
                await createAlert({
                    userId,
                    symbol,
                    alertKind: "PE_DROP",
                    alertName: alertName.trim() || undefined,
                    basePeRatio: parsedBasePe,
                    dropPercent: parsedDrop,
                });
            } else {
                const price = parseFloat(targetPrice);
                if (!Number.isFinite(price) || price <= 0) {
                    toast.error("Enter a valid target price");
                    return;
                }
                await createAlert({
                    userId,
                    symbol,
                    alertKind: "PRICE",
                    alertName: alertName.trim() || undefined,
                    targetPrice: price,
                    condition,
                });
            }
            toast.success("Alert created successfully");
            setOpen?.(false);
            if (onAlertCreated) onAlertCreated();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to create alert");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] border-gray-800 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white mb-2">
                        {alertKind === "PE_DROP" ? "P/E Drop Alert" : "Price Alert"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-2 relative z-10">

                    {/* Alert Name */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert Name</Label>
                        <Input
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="e.g. Apple at Discount"
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10"
                        />
                    </div>

                    {/* Stock Identifier */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Stock identifier</Label>
                        <div className="relative">
                            <Input
                                disabled
                                value={`${companyName || symbol} (${symbol})`}
                                className="bg-[#1C1C1F] border-none text-gray-500 shadow-inner rounded-md h-10"
                            />
                        </div>
                    </div>

                    {/* Alert Type */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert type</Label>
                        <Select value={alertKind} onValueChange={(val: string) => setAlertKind(val as AlertKind)}>
                            <SelectTrigger className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                <SelectItem value="PRICE">Price</SelectItem>
                                <SelectItem value="PE_DROP">P/E ratio drop %</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {alertKind === "PRICE" ? (
                        <>
                            {/* Condition */}
                            <div className="grid gap-2">
                                <Label className="text-gray-400 text-sm font-medium">Condition</Label>
                                <Select value={condition} onValueChange={(val: any) => setCondition(val)}>
                                    <SelectTrigger className="bg-[#1C1C1F] border-gray-800 text-gray-200 hover:border-gray-700 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1C1C1F] border-gray-800 text-gray-200">
                                        <SelectItem value="ABOVE">Greater than {">"}</SelectItem>
                                        <SelectItem value="BELOW">Less than {"<"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Threshold Value */}
                            <div className="grid gap-2">
                                <Label className="text-gray-400 text-sm font-medium">Threshold value</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 font-semibold">$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(e.target.value)}
                                        placeholder="eg: 140"
                                        className="pl-7 bg-[#1C1C1F] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Base P/E */}
                            <div className="grid gap-2">
                                <Label className="text-gray-400 text-sm font-medium">
                                    Baseline P/E ratio
                                    {currentPeRatio != null && currentPeRatio > 0 && (
                                        <span className="ml-2 text-xs text-gray-500">Current: {currentPeRatio.toFixed(2)}</span>
                                    )}
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={basePeRatio}
                                    onChange={(e) => setBasePeRatio(e.target.value)}
                                    placeholder="eg: 25.4"
                                    className="bg-[#1C1C1F] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
                                />
                                {currentPeRatio == null && (
                                    <p className="text-xs text-gray-500">No live P/E available — enter the baseline manually.</p>
                                )}
                            </div>

                            {/* Drop percent */}
                            <div className="grid gap-2">
                                <Label className="text-gray-400 text-sm font-medium">Drop percentage</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="99.9"
                                        value={dropPercent}
                                        onChange={(e) => setDropPercent(e.target.value)}
                                        placeholder="eg: 10"
                                        className="pr-9 bg-[#1C1C1F] border-gray-800 text-white placeholder:text-gray-600 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all rounded-md h-10 font-mono"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 font-semibold">%</span>
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className="rounded-md bg-[#1C1C1F] border border-gray-800 px-3 py-2.5 text-sm">
                                {peInputsValid ? (
                                    <p className="text-gray-300">
                                        Fires when P/E ≤{" "}
                                        <span className="font-mono font-semibold text-yellow-400">
                                            {peThreshold.toFixed(2)}
                                        </span>{" "}
                                        <span className="text-gray-500">
                                            ({parsedDrop}% below {parsedBasePe})
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-gray-500 text-xs">Enter a baseline P/E and a drop % to see the trigger.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Expiry Note */}
                    <div className="pt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 mr-2"></span>
                            Alert expires automatically in 90 days
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading || (alertKind === "PE_DROP" && !peInputsValid)}
                            className="w-full bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold h-11 text-base transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                        >
                            {loading ? "Creating Alert..." : "Create Alert"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
