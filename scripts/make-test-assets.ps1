# Generates the placeholder poster screenshots in /test-assets.
# Run with: powershell -ExecutionPolicy Bypass -File scripts/make-test-assets.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "test-assets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Poster {
    param(
        [string]$Path,
        [string]$HexBackground,
        [string[]]$Lines
    )

    $width = 800
    $height = 1000
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml($HexBackground))

    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $y = 70
    foreach ($line in $Lines) {
        $size = if ($y -lt 200) { 44 } else { 26 }
        $style = if ($y -lt 200) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
        $font = New-Object System.Drawing.Font "Segoe UI", $size, $style
        $g.DrawString($line, $font, $white, 60, $y)
        $y += [int]($size * 1.8)
        $font.Dispose()
    }

    $g.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Host "wrote $Path"
}

New-Poster -Path (Join-Path $outDir "poster-sport.png") -HexBackground "#0F766E" -Lines @(
    "MAASTRICHT",
    "RUN CLUB",
    "",
    "Elke woensdag 19:00 uur",
    "Start: Stadspark, Maastricht",
    "Prijs: gratis",
    "Iedereen welkom, ook beginners!",
    "Georganiseerd door Sportclub Sint Pieter",
    "@maastrichtrunclub"
)

New-Poster -Path (Join-Path $outDir "poster-party.png") -HexBackground "#4C1D95" -Lines @(
    "NEON NIGHT",
    "at DE KROEG",
    "",
    "Friday 3 October - doors 22:00",
    "Boschstraat 24, Maastricht",
    "Entry EUR 7,50 / EUR 5 with student card",
    "",
    "AFTERPARTY QUIZ - Saturday 16:00",
    "Same address, free entry"
)
