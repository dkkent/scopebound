#!/bin/bash
# Script to push database schema using drizzle-kit

# Create a temporary drizzle config
cat > drizzle.config.temp.ts << 'EOF'
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# Run drizzle-kit push with the temp config
npx drizzle-kit push --config=drizzle.config.temp.ts

# Clean up
rm drizzle.config.temp.ts
