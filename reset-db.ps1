# PowerShell script to reset the database
# This will delete the existing database and create a fresh one with seed data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Stop"

try {
    # Step 1: Delete existing database
    Write-Host "[1/3] Deleting existing database..." -ForegroundColor Yellow

    $dbPath = "prisma/dev.db"
    $dbJournalPath = "prisma/dev.db-journal"

    if (Test-Path $dbPath) {
        Remove-Item $dbPath -Force
        Write-Host "  ✓ Deleted dev.db" -ForegroundColor Green
    } else {
        Write-Host "  ℹ dev.db not found (skipping)" -ForegroundColor Gray
    }

    if (Test-Path $dbJournalPath) {
        Remove-Item $dbJournalPath -Force
        Write-Host "  ✓ Deleted dev.db-journal" -ForegroundColor Green
    }

    Write-Host ""

    # Step 2: Push Prisma schema to database
    Write-Host "[2/3] Pushing Prisma schema to database..." -ForegroundColor Yellow
    npx prisma db push --skip-generate

    if ($LASTEXITCODE -ne 0) {
        throw "Prisma db push failed"
    }

    Write-Host "  ✓ Schema pushed successfully" -ForegroundColor Green
    Write-Host ""

    # Step 3: Seed the database
    Write-Host "[3/3] Seeding database..." -ForegroundColor Yellow
    npm run prisma:seed

    if ($LASTEXITCODE -ne 0) {
        throw "Database seeding failed"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Database reset completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Default admin credentials:" -ForegroundColor White
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ Error occurred during database reset" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
