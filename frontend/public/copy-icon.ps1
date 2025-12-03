# Copy PWA icon
$source = "..\..\cropped-EWMC-Logo-1.png"
$dest1 = "icon.png"
$dest2 = "apple-touch-icon.png"

if (Test-Path $source) {
    Copy-Item $source -Destination $dest1 -Force
    Copy-Item $source -Destination $dest2 -Force
    Write-Host "Icons copied successfully!"
    Write-Host "Files created:"
    Write-Host "  - icon.png"
    Write-Host "  - apple-touch-icon.png"
} else {
    Write-Host "Error: Source file not found at: $source"
    Write-Host "Please ensure cropped-EWMC-Logo-1.png exists in the root directory"
}
