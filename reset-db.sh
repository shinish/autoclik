#!/bin/bash
# Shell script to reset the database
# This will delete the existing database and create a fresh one with seed data

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Database Reset Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Step 1: Delete existing database
echo -e "${YELLOW}[1/3] Deleting existing database...${NC}"

if [ -f "prisma/dev.db" ]; then
    rm -f "prisma/dev.db"
    echo -e "${GREEN}  ✓ Deleted dev.db${NC}"
else
    echo -e "${GRAY}  ℹ dev.db not found (skipping)${NC}"
fi

if [ -f "prisma/dev.db-journal" ]; then
    rm -f "prisma/dev.db-journal"
    echo -e "${GREEN}  ✓ Deleted dev.db-journal${NC}"
fi

echo ""

# Step 2: Push Prisma schema to database
echo -e "${YELLOW}[2/3] Pushing Prisma schema to database...${NC}"
npx prisma db push --skip-generate

if [ $? -ne 0 ]; then
    echo -e "${RED}  ✗ Prisma db push failed${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Schema pushed successfully${NC}"
echo ""

# Step 3: Seed the database
echo -e "${YELLOW}[3/3] Seeding database...${NC}"
npm run prisma:seed

if [ $? -ne 0 ]; then
    echo -e "${RED}  ✗ Database seeding failed${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}✓ Database reset completed successfully!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
