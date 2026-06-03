# Keep-alive script for Vercel deployment
$url = "https://xiaomangmimi.vercel.app"
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "$timestamp - Status: $($response.StatusCode)"
} catch {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "$timestamp - ERROR: $($_.Exception.Message)"
}
