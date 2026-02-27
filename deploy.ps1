# ─────────────────────────────────────────────────────────────────────────────
# Business Card Automation — Vercel Deployment Script
# Run this ONCE in PowerShell from the project folder.
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=== Business Card Automation — Vercel Deployer ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to Vercel (opens browser once)
Write-Host "[1/4] Logging in to Vercel..." -ForegroundColor Yellow
npx vercel login
Write-Host ""

# Step 2: Create the project on Vercel (answer defaults)
Write-Host "[2/4] Creating Vercel project..." -ForegroundColor Yellow
npx vercel --yes
Write-Host ""

# Step 3: Add all environment variables
Write-Host "[3/4] Adding environment variables to Vercel..." -ForegroundColor Yellow

$envVars = @{
    "GEMINI_API_KEY"         = "AIzaSyDrrY0E4VuwcR15ib2LiF-eueBrA3gMwiw"
    "GOOGLE_PROJECT_ID"      = "gen-lang-client-0238298598"
    "GOOGLE_PRIVATE_KEY_ID"  = "9ed20d30b04284afd731d5344bc81a9c198bdbcb"
    "GOOGLE_CLIENT_EMAIL"    = "bcard-automation@gen-lang-client-0238298598.iam.gserviceaccount.com"
    "GOOGLE_CLIENT_ID"       = "117974201140986004934"
    "GOOGLE_DRIVE_FOLDER_ID" = "1iuk1806wTIQoqdMsYTEewpn77ZaftCsc"
    "GOOGLE_SHEET_ID"        = "1Xm3OYuenlRiYnRS0qMlPFOLJJQJRri684UGTCiLuPjU"
    "GOOGLE_SHEET_NAME"      = "Sheet1"
}

# Private key needs special handling (multi-line)
$privateKey = "-----BEGIN PRIVATE KEY-----`nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCrWj1o3ohU8XKM`nhKQFwZJIqcb1FsRip7yCAp5NgN7dmS6Ad7Kpd+RWcnw+bsleS3Ox27QhV3/AZaKd`ntc+LQ1WmV6fbd23Rw2UMjGwDF7TFUyUwciPAx7+L9t9luXU8xtHIqWm6WdilGLPo`nlw/O9BBlxcwqUZ2XznTiOj7FaJEAr/LXz4vsjChVhuuGjzrbqIhVatxlyg9qr7BE`nPabsAWnxqM9uR1LpVefPpUxbYoQhy2Z0SCNFs/Mrl6/lmumFHLp68OIbuWJvJZ0p`nVxqA0eK08H6kIKCfdzNoXEe2rIL2Rq/DgoNRhChAZJipYTvspAGdJQZVh1KqXOlQ`n5mmfyXmVAgMBAAECggEACfoEUs+IGQgAzyEm6qXhVkU6TglQEF1rSpeL73/GGhlh`n3X16o8bU/tqGFN1+8HRMrWmZFIrjZ4iTXgLYrWdTfI6keZD7zieGAePIIyr1bbrA`nUtCGd+I5axUJ30KbypjZ3IjOnNi/1ib4zJ1FAJvxu3c3gqxDVHQjFovlHTnQHX3I`nm2f6G1Sbi6uLjyjo2cvUaFK5M5JvOMxvFeI+BO8Qcb4kXyrsAruf00slW8xJwF4T`nP+PMaU1bWBYUtTD7vI1c26uE8AkkRYMSqkxXs8Pzfgk4sCViSmIjufgnqSOhOaIr`nVJGM1w03l1TUh9ZQSAyBDXpVAS8l0Bi9l1zvSsu+EQKBgQDieopOvT4zTje/tnJ2`nSEq2jrt8SgKgnf4YOs9LpTwFDdJqhlqoFbAsAHZsDEl9Cj96hINTEB4BTCQZEnE5`nTRz9BYyh0skgRmsR1F3Mf6aQB3C5oW2tEsNdeEdMsex5E3P5+UhFYMmkGcewrZ1k`n6wJK3tCn0hHPVrNyGt1aI/VEZQKBgQDBsCv2O540nI/7V9riasPELhiWlTQVKwMm`nZeSksezvbYBGqTV3Eqty/P2wU4ynlBPwgEc3fPf4hMRlgw+YVQrdxvK6HgdmmHpk`n3UAm7xhJGfhISB2t+cvL3fElRAfIuUA8z2J8S0Ne9nbO4WRlWQgAx2T98+AeqHo0`nZh7jUqIVcQKBgQCra/8lzB25bbnKtUj7+In8lhqY39gPRKbgJhtjcWT1mlmq4Zja`n4tee5pa7/6zcJRaZIJXaGDft2Xj1NT1YFuMbLMkeb1JmyIYgT7LTp8cl+0u6ZdKD`nDtGq/PBSv9Vya2P8UFAAm1rkh9LbCv44NZ1dmDss21c5rbFTa7whj1gE9QKBgQCQ`noCOzcUDouB8q5qcieeZEDsd9aVvCkqN/gIYCFHl/LpyiJqctiltLOW2UxE46s29Q`nHfkPjdj7UOf1hK+YZ6f9ghissM+F5EVAG5VTfST9MM8b6f1/cw6h48+0q9/EGc/F`nmHVJqklcF10PjW2R37ECI+FdX0Tyn4rgpYBa7dDpgQKBgQDSPAsNGjsiMxY8D7Ms`nP/qACvD4J4d924xMMYt4JfTlBz8rxkIjrgxOo0gIgk4Cel0vxbe9QWF4eiSd9M+/`nLG2ukYG7kAgQXJVK17roerP3l5hu9TOZEjwof/9oeJ6YVCxQ72lFPXtv+zuvDArH`nW6Y4JBakq805FEld0VcygoEIJQ==`n-----END PRIVATE KEY-----`n"

# Add simple env vars
foreach ($key in $envVars.Keys) {
    Write-Host "  Adding $key..." -ForegroundColor Gray
    $envVars[$key] | npx vercel env add $key production --force 2>$null
    $envVars[$key] | npx vercel env add $key preview --force 2>$null
}

# Add private key via temp file
Write-Host "  Adding GOOGLE_PRIVATE_KEY..." -ForegroundColor Gray
$tmpFile = [System.IO.Path]::GetTempFileName()
$privateKey | Set-Content -Path $tmpFile -Encoding UTF8 -NoNewline
Get-Content $tmpFile | npx vercel env add GOOGLE_PRIVATE_KEY production --force 2>$null
Get-Content $tmpFile | npx vercel env add GOOGLE_PRIVATE_KEY preview --force 2>$null
Remove-Item $tmpFile

Write-Host ""

# Step 4: Deploy to production
Write-Host "[4/4] Deploying to production..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host ""
Write-Host "=== DONE! Your app is live. ===" -ForegroundColor Green
Write-Host "Copy the URL above and open it on your phone to test." -ForegroundColor Cyan
Write-Host ""
