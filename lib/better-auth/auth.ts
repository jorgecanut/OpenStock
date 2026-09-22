import { betterAuth } from "better-auth";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {connectToDatabase} from "@/database/mongoose";
import {nextCookies} from "better-auth/next-js";
import { sendPasswordResetEmail } from "@/lib/nodemailer/reset-password";

type AuthInstance = ReturnType<typeof betterAuth>;
type AuthApi = AuthInstance["api"];

let authInstance: AuthInstance | null = null;
let authPromise: Promise<AuthInstance> | null = null;


export const getAuth = async (): Promise<AuthInstance> => {
    if(authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;
    const database = db.db;

    if (!db || !database) {
        throw new Error("MongoDB connection not found!");
    }

    authInstance = betterAuth({
        database: mongodbAdapter(database),
       secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }) => {
                void sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    resetUrl: url,
                }).catch((error) => {
                    console.error('Failed to queue password reset email:', error);
                });
            },
        },
        plugins: [nextCookies()],

    });

    return authInstance;
}

// Resolve the singleton while de-duplicating concurrent callers. If connecting
// fails, clear the cached promise so a later request can retry.
const resolveAuth = (): Promise<AuthInstance> => {
    if (!authPromise) {
        authPromise = getAuth().catch((error) => {
            authPromise = null;
            throw error;
        });
    }
    return authPromise;
};

// Expose `auth.api.*` lazily. This is what lets `next build` import this module
// (and every page that depends on it) WITHOUT an open MongoDB connection or any
// runtime environment variables. The database is only touched on the first real
// request. Calling `auth.api.getSession(...)` still returns a Promise exactly as
// before, so no call site needs to change.
const authApi = new Proxy({} as AuthApi, {
    get(_target, property) {
        if (typeof property !== "string") {
            return undefined;
        }
        return (...args: unknown[]) =>
            resolveAuth().then((instance) => {
                const method = (instance.api as unknown as Record<string, unknown>)[property];
                if (typeof method !== "function") {
                    throw new Error(`auth.api.${property} is not a function`);
                }
                return (method as (...a: unknown[]) => unknown).apply(instance.api, args);
            });
    },
});

export const auth = { api: authApi } as unknown as AuthInstance;
