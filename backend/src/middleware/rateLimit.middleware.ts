import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // Limit tiap IP
    standardHeaders: true, // Return rate limit info di header `RateLimit-*`
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
        error: "Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit."
    }
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 10, // Cuma boleh 10x hit endpoint auth
    message: {
        error: "Terlalu banyak percobaan login/daftar. Silakan coba lagi nanti."
    }
});