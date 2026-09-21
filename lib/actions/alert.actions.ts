'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Alert, type IAlert } from '@/database/models/alert.model';
import { revalidatePath } from 'next/cache';
import { getPeDropThreshold } from '@/lib/alerts/pe';

type PriceAlertParams = {
    userId: string;
    symbol: string;
    alertKind?: 'PRICE';
    alertName?: string;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
};

type PeDropAlertParams = {
    userId: string;
    symbol: string;
    alertKind: 'PE_DROP';
    alertName?: string;
    basePeRatio: number;
    dropPercent: number;
};

export type CreateAlertParams = PriceAlertParams | PeDropAlertParams;

// Create a new alert (price or P/E-drop)
export async function createAlert(params: CreateAlertParams) {
    try {
        await connectToDatabase();

        const symbol = params.symbol.trim().toUpperCase();
        const alertName = params.alertName?.trim() || undefined;
        const alertKind = params.alertKind ?? 'PRICE';

        if (alertKind === 'PE_DROP') {
            const { basePeRatio, dropPercent } = params as PeDropAlertParams;
            if (!Number.isFinite(basePeRatio) || basePeRatio <= 0) {
                throw new Error('Base P/E ratio must be a positive number');
            }
            if (!Number.isFinite(dropPercent) || dropPercent <= 0 || dropPercent >= 100) {
                throw new Error('Drop percentage must be between 0 and 100 (exclusive)');
            }
            // Sanity-check the derived threshold.
            const threshold = getPeDropThreshold(basePeRatio, dropPercent);
            if (!Number.isFinite(threshold)) {
                throw new Error('Invalid P/E alert parameters');
            }
            const newAlert = await Alert.create({
                userId: params.userId,
                symbol,
                alertKind: 'PE_DROP',
                alertName,
                basePeRatio,
                dropPercent,
                active: true,
                // expiresAt handled by default value in schema
            });
            revalidatePath('/watchlist');
            return JSON.parse(JSON.stringify(newAlert));
        }

        // PRICE alert (default, backwards compatible)
        const { targetPrice, condition } = params as PriceAlertParams;
        if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
            throw new Error('Target price must be a positive number');
        }
        if (condition !== 'ABOVE' && condition !== 'BELOW') {
            throw new Error('Condition must be ABOVE or BELOW');
        }
        const newAlert = await Alert.create({
            userId: params.userId,
            symbol,
            alertKind: 'PRICE',
            alertName,
            targetPrice,
            condition,
            active: true,
            // expiresAt handled by default value in schema
        });
        revalidatePath('/watchlist');
        return JSON.parse(JSON.stringify(newAlert));
    } catch (error) {
        console.error('Error creating alert:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create alert');
    }
}

// Get all alerts for a user
export async function getUserAlerts(userId: string) {
    try {
        await connectToDatabase();
        const alerts = await Alert.find({ userId }).sort({ createdAt: -1 });
        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

// Delete an alert
export async function deleteAlert(alertId: string) {
    try {
        await connectToDatabase();
        await Alert.findByIdAndDelete(alertId);
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error deleting alert:', error);
        throw new Error('Failed to delete alert');
    }
}

// Toggle alert active status (optional utility)
export async function toggleAlert(alertId: string, active: boolean) {
    try {
        await connectToDatabase();
        await Alert.findByIdAndUpdate(alertId, { active });
        revalidatePath('/watchlist');
        return { success: true };
    } catch (error) {
        console.error('Error toggling alert:', error);
        throw new Error('Failed to update alert');
    }
}

export type { IAlert };
