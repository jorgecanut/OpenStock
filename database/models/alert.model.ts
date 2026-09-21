import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface IAlert extends Document {
    userId: string;
    symbol: string;
    alertKind: 'PRICE' | 'PE_DROP';
    alertName?: string;
    targetPrice?: number;
    condition?: 'ABOVE' | 'BELOW';
    basePeRatio?: number;
    dropPercent?: number;
    active: boolean;
    triggered: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        alertKind: { type: String, enum: ['PRICE', 'PE_DROP'], default: 'PRICE', index: true },
        alertName: { type: String, trim: true },
        targetPrice: { type: Number, required: false },
        condition: { type: String, enum: ['ABOVE', 'BELOW'], required: false },
        basePeRatio: { type: Number, required: false, min: 0 },
        dropPercent: { type: Number, required: false, min: 0, max: 100 },
        active: { type: Boolean, default: true },
        triggered: { type: Boolean, default: false },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const Alert: Model<IAlert> = (models?.Alert as Model<IAlert>) || model<IAlert>('Alert', AlertSchema);
