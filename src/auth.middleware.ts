import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT PAYLOAD TYPE WITH FARM ID
export interface JwtPayload {
    userId: string;
    role: string;
    farmId?: string;
    farmName?: string;
}

// EXTEND EXPRESS REQUEST TYPE
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// AUTHENTICATION MIDDLEWARE
export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        // Get Authorization header 
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Access denied. Token is required",
            });
            return;
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(401).json({
                message: "Invalid authorization format",
            });
            return;
        }

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            res.status(500).json({
                message: "JWT_SECRET is missing",
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as any;

        // Check payload
        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.userId !== "string" ||
            typeof decoded.role !== "string"
        ) {
            res.status(401).json({
                message: "Invalid token payload",
            });
            return;
        }

        // Attach user and farm details to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            farmId: decoded.farmId,
            farmName: decoded.farmName,
        };

        // Continue to controller
        next();

    } catch (error) {
        console.error("Authentication Error:", error);

        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

// ADMIN-ONLY MIDDLEWARE
export function adminOnly(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    if (req.user.role !== "admin") {
        res.status(403).json({
            message: "Access denied. Admin only",
        });
        return;
    }

    next();
}
