$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         Cloudflare Tunnel Launcher - Vision-Trak           " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ---- check / download cloudflared ----
$cf = "cloudflared.exe"
$cfPath = Join-Path $rootDir $cf
if (-not (Test-Path $cfPath)) {
    Write-Host "[INFO] Downloading cloudflared..."
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfPath
    } catch {
        Write-Host "[ERROR] Failed to download cloudflared" -ForegroundColor Red
        pause; exit 1
    }
    if (Test-Path $cfPath) { Write-Host "[OK] Downloaded cloudflared.exe" -ForegroundColor Green }
} else {
    Write-Host "[OK] cloudflared.exe found" -ForegroundColor Green
}
Write-Host ""

# ---- resolve python executable ----
$pyExe = "python.exe"
$venvPython = Join-Path $rootDir "backend\venv\Scripts\python.exe"
if (Test-Path $venvPython) { $pyExe = $venvPython }

# ---- choose mode ----
Write-Host "Select mode:"
Write-Host "  [1] Cloudflare Tunnel (accessible from internet)"
Write-Host "  [2] Local Network only (PC / LAN IP address)"
$mode = Read-Host "Choice (1 or 2)"
$useCF = ($mode -eq "1")
Write-Host ""

# ---- clean up ----
Get-Process "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "python*" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "tunnel_be.log", "tunnel_fe.log", "tunnel_stream.log", "tunnel_be_url.txt", "tunnel_fe_url.txt", "tunnel_stream_url.txt" -ErrorAction SilentlyContinue
Start-Sleep 2

$bePort = 8000
$fePort = 5173
$streamPort = 8080
$mysqlOk = $false

# ---- check/start MariaDB ----
$mysqlPaths = @(
    "C:\xampp\mysql\bin\mysqld.exe",
    "C:\Program Files\MariaDB*\bin\mysqld.exe",
    "C:\Program Files\MySQL\MySQL Server*\bin\mysqld.exe"
)
$mysqlStarted = $false
try {
    $testConn = [System.Net.Sockets.TcpClient]::new()
    $testConn.ConnectAsync("127.0.0.1", 3306).Wait(1000)
    if ($testConn.Connected) { $testConn.Close(); $mysqlOk = $true }
    else { $testConn.Close() }
} catch {}
if (-not $mysqlOk) {
    Write-Host "[DB] MariaDB not running - searching for XAMPP..."
    $mysqld = Get-ChildItem "C:\xampp\mysql\bin\mysqld.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($mysqld) {
        Write-Host "[DB] Starting MariaDB from $mysqld..."
        Start-Process -WindowStyle Minimized -FilePath $mysqld
        Start-Sleep 3
        try {
            $testConn = [System.Net.Sockets.TcpClient]::new()
            $testConn.ConnectAsync("127.0.0.1", 3306).Wait(3000)
            if ($testConn.Connected) { $testConn.Close(); $mysqlOk = $true }
            else { $testConn.Close() }
        } catch {}
        if ($mysqlOk) { Write-Host "[DB] MariaDB started!" -ForegroundColor Green }
        else { Write-Host "[DB] Could not start MariaDB - start XAMPP manually" -ForegroundColor Yellow }
    } else {
        Write-Host "[DB] XAMPP not found at C:\xampp - start MariaDB/MySQL manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "[DB] MariaDB is already running" -ForegroundColor Green
}
Write-Host ""

# ---- helper: wait for HTTP ----
function Wait-Http($port, $timeout = 10, $path = "/docs") {
    for ($i = 0; $i -lt $timeout; $i++) {
        Start-Sleep 1
        try { $r = Invoke-WebRequest "http://localhost:$port$path" -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { return $true } } catch {}
    }
    return $false
}

# ---- helper: start tunnel in a visible window + log file ----
function Start-Tunnel($port, $label, $logFile) {
    Write-Host "[TUNNEL] Starting $label tunnel (port $port)..." -ForegroundColor Cyan
    $logPath = Join-Path $rootDir $logFile
    $wrapper = Join-Path $rootDir "_tunnel_wrapper_${label}.ps1"
@"
`$log = "$logPath"
& "$cfPath" tunnel --url http://localhost:$port 2>&1 | ForEach-Object { `$_; `$_ | Out-File `$log -Append }
"@ | Out-File $wrapper -Encoding ascii
    Start-Process -WindowStyle Normal -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$wrapper`""
}

# ---- helper: extract tunnel URL from log ----
function Get-TunnelUrl($logFile, $timeout = 30) {
    $logPath = Join-Path $rootDir $logFile
    for ($i = 0; $i -lt $timeout; $i++) {
        Start-Sleep 1
        if (Test-Path $logPath) {
            $match = Get-Content $logPath -ErrorAction SilentlyContinue | Select-String "https://[-.a-zA-Z0-9]+\.trycloudflare\.com"
            if ($match) { return $match.Matches.Value }
        }
    }
    return $null
}

$beUrl = $null
$feUrl = $null
$streamUrl = $null

if ($useCF) {
    # ========== 1. START BACKEND FIRST ==========
    Write-Host "[1/4] Starting backend on port $bePort..."
    Start-Process -WindowStyle Minimized -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir\backend`" && title Backend && `"$pyExe`" -m uvicorn app.main:app --host 0.0.0.0 --port $bePort --reload --app-dir ."
    Write-Host "[1/4] Waiting for backend (15s)..."
    if (Wait-Http $bePort 15) { Write-Host "[1/4] Backend ready!" -ForegroundColor Green }
    else { Write-Host "[1/4] Backend may still be starting..." -ForegroundColor Yellow }

    # ========== 2. START BACKEND TUNNEL ==========
    Write-Host "[2/4] Starting Backend Cloudflare tunnel..."
    Start-Tunnel $bePort "Backend" "tunnel_be.log"
    Start-Sleep 2

    Write-Host "[2/4] Waiting for Backend tunnel URL (30s)..."
    $beUrl = Get-TunnelUrl "tunnel_be.log" 30
    if ($beUrl) {
        Write-Host "[2/4] Backend tunnel: " -NoNewline -ForegroundColor Green
        Write-Host $beUrl -ForegroundColor Green
        $beUrl | Out-File "tunnel_be_url.txt" -Encoding ascii
        
        # Update Flutter app API URL
        $apiFile = Join-Path $rootDir "frontend\flutter_app\lib\services\api_service.dart"
        if (Test-Path $apiFile) {
            $content = Get-Content $apiFile -Raw
            $newApiUrl = "$beUrl/api"
            $content = $content -replace "(\s*static const String _baseUrl = ').*(')", "`${1}$newApiUrl`${2}"
            Set-Content $apiFile $content -NoNewline
            Write-Host "[2/4] Flutter API URL updated: $newApiUrl" -ForegroundColor Gray
        }
        # Update detector.py WebSocket URL
        $detectorFile = Join-Path $rootDir "detector.py"
        if (Test-Path $detectorFile) {
            $content = Get-Content $detectorFile -Raw
            $wsUrl = $beUrl -replace "^https", "wss"
            $newWsUrl = "$wsUrl/ws"
            $content = $content -replace '(SERVER_URL = ")[^"]*(")', "`${1}$newWsUrl`${2}"
            Set-Content $detectorFile $content -NoNewline
            Write-Host "[2/4] Detector WS URL updated: $newWsUrl" -ForegroundColor Gray
        }
    } else {
        Write-Host "[2/4] Backend tunnel URL not captured - check the window" -ForegroundColor Yellow
    }
    Write-Host ""

    # ========== 3. START FRONTEND + TUNNEL ==========
    $feDir = Join-Path $rootDir "frontend\frontend-react"
    Write-Host "[3/4] Starting frontend dev server on port $fePort..."
    Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$feDir`" && title Frontend && npm run dev"
    Write-Host "[3/4] Waiting for frontend (10s)..."
    if (Wait-Http $fePort 10 "/") { Write-Host "[3/4] Frontend ready!" -ForegroundColor Green }
    else { Write-Host "[3/4] Frontend may still be starting..." -ForegroundColor Yellow }

    Start-Tunnel $fePort "Frontend" "tunnel_fe.log"
    Write-Host "[3/4] Waiting for Frontend tunnel URL (30s)..."
    $feUrl = Get-TunnelUrl "tunnel_fe.log" 30
    if ($feUrl) {
        Write-Host "[3/4] Frontend tunnel: " -NoNewline -ForegroundColor Green
        Write-Host $feUrl -ForegroundColor Green
        $feUrl | Out-File "tunnel_fe_url.txt" -Encoding ascii
    } else {
        Write-Host "[3/4] Frontend tunnel URL not captured - check the window" -ForegroundColor Yellow
    }
    Write-Host ""

    # ========== 4. START DETECTOR & STREAM TUNNEL (Raspberry Pi Dashboard) ==========
    $startDetector = Read-Host "[4/4] Start AI Detector and Raspberry Pi Stream Dashboard? (Y/N)"
    if ($startDetector -eq "Y" -or $startDetector -eq "y" -or $startDetector -eq "") {
        Write-Host "[4/4] Starting detector.py on port $streamPort..."
        Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir`" && title Detector_Stream && `"$pyExe`" detector.py"
        Start-Sleep 3

        Start-Tunnel $streamPort "Stream" "tunnel_stream.log"
        Write-Host "[4/4] Waiting for Pi Stream Dashboard tunnel URL (30s)..."
        $streamUrl = Get-TunnelUrl "tunnel_stream.log" 30
        if ($streamUrl) {
            Write-Host "[4/4] Stream Dashboard tunnel: " -NoNewline -ForegroundColor Green
            Write-Host $streamUrl -ForegroundColor Green
            $streamUrl | Out-File "tunnel_stream_url.txt" -Encoding ascii
        } else {
            Write-Host "[4/4] Stream tunnel URL not captured - check the window" -ForegroundColor Yellow
        }
    }
    Write-Host ""

} else {
    # ========== LOCAL MODE ==========
    Write-Host "[BACKEND] Starting backend on port $bePort..."
    Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir\backend`" && title Backend && `"$pyExe`" -m uvicorn app.main:app --host 0.0.0.0 --port $bePort --reload --app-dir ."
    Write-Host "[BACKEND] Waiting (up to 10s)..."
    if (Wait-Http $bePort 10) { Write-Host "[BACKEND] Ready!" -ForegroundColor Green }
    else { Write-Host "[BACKEND] May still be starting..." -ForegroundColor Yellow }
    Write-Host ""

    $feDir = Join-Path $rootDir "frontend\frontend-react"
    Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$feDir`" && title Frontend && npm run dev"

    $startDet = Read-Host "Start AI Detector and Stream Dashboard? (Y/N)"
    if ($startDet -eq "Y" -or $startDet -eq "y" -or $startDet -eq "") {
        Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir`" && title Detector_Stream && `"$pyExe`" detector.py"
    }
}

# ========== SUMMARY ==========
$pcIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -ne "Loopback" } | Select-Object -First 1).IPAddress
if (-not $pcIp) { $pcIp = "127.0.0.1" }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                   VISION-TRAK SYSTEM SUMMARY               " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($useCF) {
    if (-not $beUrl -and (Test-Path "tunnel_be_url.txt")) { $beUrl = Get-Content "tunnel_be_url.txt" -First 1 }
    if (-not $feUrl -and (Test-Path "tunnel_fe_url.txt")) { $feUrl = Get-Content "tunnel_fe_url.txt" -First 1 }
    if (-not $streamUrl -and (Test-Path "tunnel_stream_url.txt")) { $streamUrl = Get-Content "tunnel_stream_url.txt" -First 1 }

    Write-Host "  [CLOUDFLARE PUBLIC TUNNELS - Access from anywhere]:" -ForegroundColor Yellow
    if ($feUrl) { Write-Host "  Admin and Official Portal   : $feUrl" -ForegroundColor Green }
    if ($beUrl) { Write-Host "  Backend API and Docs       : $beUrl/docs" -ForegroundColor Green }
    if ($streamUrl) { Write-Host "  Raspberry Pi Live Stream   : $streamUrl" -ForegroundColor Green }
    Write-Host ""
    Write-Host "  Keep all tunnel windows open to maintain internet access!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "  [LOCAL NETWORK URLs - Same Wi-Fi / Local PC]:" -ForegroundColor Cyan
Write-Host "  Admin and Official Portal   : http://localhost:$fePort" -ForegroundColor White
Write-Host "  Backend API and Docs       : http://${pcIp}:${bePort}/docs" -ForegroundColor White
Write-Host "  Raspberry Pi Live Stream   : http://${pcIp}:${streamPort}/" -ForegroundColor White
Write-Host "  Flutter App API Base       : http://${pcIp}:${bePort}/api" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
pause
