import { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const MAX_STORE_SIZE = 10000;

function cleanupExpiredRecords() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    rateLimitStore.delete(key);
  }
  
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const oldestKeys = Array.from(rateLimitStore.keys()).slice(0, 1000);
    for (const key of oldestKeys) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredRecords, 60000);

export function rateLimit(config: RateLimitConfig) {
  return {
    check: async (request: NextRequest) => {
      const now = Date.now();
      const identifier = getClientIdentifier(request);
      
      cleanupExpiredRecords();
      
      const record = rateLimitStore.get(identifier);
      
      if (!record || now > record.resetTime) {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + config.interval,
        });
        return { success: true, remaining: config.maxRequests - 1 };
      }
      
      if (record.count >= config.maxRequests) {
        return { 
          success: false, 
          remaining: 0,
          reset: Math.ceil((record.resetTime - now) / 1000)
        };
      }
      
      record.count++;
      return { success: true, remaining: config.maxRequests - record.count };
    },
  };
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "127.0.0.1";
  return `ip:${ip}`;
}

export const aiRateLimiter = rateLimit({
  interval: 60 * 1000,
  maxRequests: 10,
});

export const authRateLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  maxRequests: 5,
});

export const inviteRateLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  maxRequests: 10,
});
