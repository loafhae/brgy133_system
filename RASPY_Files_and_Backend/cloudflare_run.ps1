$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Launcher - Vision-Trak" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
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
    if (Test-Path $cfPath) { Write-Host "[OK] Downloaded" -ForegroundColor Green }
} else {
    Write-Host "[OK] cloudflared.exe found" -ForegroundColor Green
}
Write-Host ""

# ---- choose mode ----
Write-Host "Select mode:"
Write-Host "  [1] Cloudflare Tunnel (accessible from internet)"
Write-Host "  [2] Local Network only (PC IP address)"
$mode = Read-Host "Choice (1 or 2)"
$useCF = ($mode -eq "1")
Write-Host ""

# ---- clean up ----
Get-Process "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process "python*" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "tunnel_be.log", "tunnel_fe.log", "tunnel_be_url.txt", "tunnel_fe_url.txt" -ErrorAction SilentlyContinue
Start-Sleep 2

$bePort = 3000
$fePort = 5173
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
    $wrapper = Join-Path $rootDir "_tunnel_wrapper.ps1"
    # Create a wrapper script that tees output to both console and log
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

if ($useCF) {
    # ========== 1. START BACKEND FIRST (so tunnel has something to proxy) ==========
    Write-Host "[1/3] Starting backend on port $bePort..."
    $venvPython = Join-Path $rootDir "backend\venv\Scripts\python.exe"
    Start-Process -WindowStyle Minimized -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir\backend`" && title Backend && `"$venvPython`" -m uvicorn app.main:app --host 0.0.0.0 --port $bePort --reload --app-dir ."
    Write-Host "[1/3] Waiting for backend (15s)..."
    if (Wait-Http $bePort 15) { Write-Host "[1/3] Backend ready!" -ForegroundColor Green }
    else { Write-Host "[1/3] Backend may still be starting..." -ForegroundColor Yellow }

    # ========== 2. START TUNNEL (backend is already running) ==========
    Write-Host "[2/3] Starting Cloudflare tunnel (window will pop up)..."
    Start-Tunnel $bePort "Backend" "tunnel_be.log"
    Start-Sleep 2

    Write-Host "[2/3] Waiting for Backend tunnel URL (30s)..."
    $beUrl = Get-TunnelUrl "tunnel_be.log" 30
    if ($beUrl) {
        Write-Host "[2/3] Backend tunnel: " -NoNewline -ForegroundColor Green
        Write-Host $beUrl -ForegroundColor Green
        $beUrl | Out-File "tunnel_be_url.txt" -Encoding ascii
        # Update Flutter app's API URL
        $apiFile = Join-Path $rootDir "flutter_app\lib\services\api_service.dart"
        if (Test-Path $apiFile) {
            $content = Get-Content $apiFile -Raw
            $newApiUrl = "$beUrl/api"
            $content = $content -replace "(\s*static const String _baseUrl = ').*(')", "`${1}$newApiUrl`${2}"
            Set-Content $apiFile $content -NoNewline
            Write-Host "[2/3] Flutter API URL: $newApiUrl" -ForegroundColor Gray
        }
        # Update detector.py WebSocket URL
        $detectorFile = Join-Path $rootDir "detector.py"
        if (Test-Path $detectorFile) {
            $content = Get-Content $detectorFile -Raw
            $wsUrl = $beUrl -replace "^https", "wss"
            $newWsUrl = "$wsUrl/ws"
            $content = $content -replace '(SERVER_URL = ")[^"]*(")', "`${1}$newWsUrl`${2}"
            Set-Content $detectorFile $content -NoNewline
            Write-Host "[2/3] Detector WS URL: $newWsUrl" -ForegroundColor Gray
        }
    } else {
        Write-Host "[2/3] Backend tunnel URL not captured - check the window" -ForegroundColor Yellow
    }
    Write-Host ""

    # ========== 3. START FRONTEND + TUNNEL ==========
    $feUrl = $null
    $choice = Read-Host "[3/3] Start Frontend dev server? (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        $feDir = Join-Path $rootDir "frontend-react"

        # Start frontend dev server FIRST
        Write-Host "[3/3] Starting frontend dev server on port $fePort..."
        Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$feDir`" && title Frontend && npm run dev"
        Write-Host "[3/3] Waiting for frontend (10s)..."
        if (Wait-Http $fePort 10 "/") { Write-Host "[3/3] Frontend ready!" -ForegroundColor Green }
        else { Write-Host "[3/3] Frontend may still be starting..." -ForegroundColor Yellow }

        # Now start frontend tunnel (origin is already running)
        $tunChoice = Read-Host "[3/3] Start Frontend Cloudflare tunnel too? (Y/N)"
        if ($tunChoice -eq "Y" -or $tunChoice -eq "y") {
            Start-Tunnel $fePort "Frontend" "tunnel_fe.log"
            Write-Host "[3/3] Waiting for Frontend tunnel URL (30s)..."
            $feUrl = Get-TunnelUrl "tunnel_fe.log" 30
            if ($feUrl) {
                Write-Host "[3/3] Frontend tunnel: " -NoNewline -ForegroundColor Green
                Write-Host $feUrl -ForegroundColor Green
                $feUrl | Out-File "tunnel_fe_url.txt" -Encoding ascii
            } else {
                Write-Host "[3/3] Frontend tunnel URL not captured - check the window" -ForegroundColor Yellow
            }
        }
    }
    Write-Host ""

} else {
    # ========== LOCAL MODE ==========
    Write-Host "[BACKEND] Starting backend on port $bePort..."
    $venvPython = Join-Path $rootDir "backend\venv\Scripts\python.exe"
    Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootDir\backend`" && title Backend && `"$venvPython`" -m uvicorn app.main:app --host 0.0.0.0 --port $bePort --reload --app-dir ."
    Write-Host "[BACKEND] Waiting (up to 10s)..."
    if (Wait-Http $bePort 10) { Write-Host "[BACKEND] Ready!" -ForegroundColor Green }
    else { Write-Host "[BACKEND] May still be starting..." -ForegroundColor Yellow }
    Write-Host ""

    $startFE = Read-Host "Start frontend dev server? (Y/N)"
    if ($startFE -eq "Y" -or $startFE -eq "y") {
        $feDir = Join-Path $rootDir "frontend-react"
        Start-Process -WindowStyle Normal -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$feDir`" && title Frontend && npm run dev"
    }
}

# ========== SUMMARY ==========
$pcIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -ne "Loopback" } | Select-Object -First 1).IPAddress
if (-not $pcIp) { $pcIp = "127.0.0.1" }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($useCF) {
    # Re-check URLs from files if not captured
    if (-not $beUrl -and (Test-Path "tunnel_be_url.txt")) { $beUrl = Get-Content "tunnel_be_url.txt" -First 1 }
    if (-not $feUrl -and (Test-Path "tunnel_fe_url.txt")) { $feUrl = Get-Content "tunnel_fe_url.txt" -First 1 }

    Write-Host "  Cloudflare Tunnels (internet access):" -ForegroundColor White
    if ($beUrl) { Write-Host "  Backend API : $beUrl/api" -ForegroundColor Green }
    else { Write-Host "  Backend API : (check the Backend tunnel window for the URL)" -ForegroundColor Yellow }
    if ($feUrl) { Write-Host "  Admin Panel : $feUrl" -ForegroundColor Green }
    else { Write-Host "  Admin Panel : (check the Frontend tunnel window for the URL)" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "  Two tunnel windows are running - keep them open!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "  Local URLs:" -ForegroundColor White
Write-Host "  Backend API : http://${pcIp}:${bePort}/api" -ForegroundColor White
Write-Host "  API Docs    : http://${pcIp}:${bePort}/docs" -ForegroundColor White
Write-Host "  Admin Panel : http://localhost:${fePort}" -ForegroundColor White
Write-Host "  Flutter app : http://${pcIp}:${bePort}/api" -ForegroundColor White
Write-Host ""
if (-not $useCF) {
    Write-Host "  No tunnels - local network only" -ForegroundColor Gray
}
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
pause
