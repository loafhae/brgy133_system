$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# Setup console window title
$host.UI.RawUI.WindowTitle = "Vision-Trak System Dashboard"

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         Vision-Trak - Unified System Launcher              " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Array to keep track of started processes for clean shutdown
$script:runningProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()

function Stop-AllServices {
    Write-Host ""
    Write-Host "[SHUTDOWN] Stopping all background services..." -ForegroundColor Yellow
    
    # Terminate tracked child processes
    foreach ($proc in $script:runningProcesses) {
        if ($proc -and -not $proc.HasExited) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }
    
    # Terminate cloudflared and child node / python processes cleanly
    Get-Process "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Clean up temporary log files
    Remove-Item "tunnel_*.log", "tunnel_stream_out.log", "tunnel_fe_out.log", "tunnel_be_out.log" -ErrorAction SilentlyContinue
    
    Write-Host "[OK] All services stopped cleanly." -ForegroundColor Green
}

# Register cleanup on exit
$cleanupBlock = { Stop-AllServices }

# ---- 1. Check / Download Cloudflared ----
$cf = "cloudflared.exe"
$cfPath = Join-Path $rootDir $cf
if (-not (Test-Path $cfPath)) {
    Write-Host "[INFO] Downloading cloudflared..." -ForegroundColor Cyan
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

# ---- 2. Resolve Python Executable ----
$pyExe = "python.exe"
$possibleVenvs = @(
    (Join-Path $rootDir "..\..\.venv\Scripts\python.exe"),
    (Join-Path $rootDir "backend\venv\Scripts\python.exe"),
    (Join-Path $rootDir ".venv\Scripts\python.exe")
)
foreach ($venv in $possibleVenvs) {
    if (Test-Path $venv) {
        $pyExe = (Resolve-Path $venv).Path
        break
    }
}
Write-Host "[OK] Python environment: $pyExe" -ForegroundColor Green

# ---- 3. Mode Selection ----
Write-Host ""
Write-Host "Select Startup Mode:" -ForegroundColor Yellow
Write-Host "  [1] Cloudflare Tunnel (Internet / Public access)"
Write-Host "  [2] Local Network Only (PC / Wi-Fi LAN access)"
$mode = Read-Host "Choice (1 or 2, default: 1)"
if (-not $mode) { $mode = "1" }
$useCF = ($mode -eq "1")
Write-Host ""

# ---- 4. Clean up previous lingering processes ----
Get-Process "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item "tunnel_*.log", "tunnel_*.txt" -ErrorAction SilentlyContinue

$bePort = 8000
$fePort = 5173
$streamPort = 8080
$mysqlOk = $false

# ---- 5. Check / Start MariaDB / MySQL ----
try {
    $testConn = [System.Net.Sockets.TcpClient]::new()
    $testConn.ConnectAsync("127.0.0.1", 3306).Wait(1000)
    if ($testConn.Connected) { $testConn.Close(); $mysqlOk = $true }
    else { $testConn.Close() }
} catch {}

if (-not $mysqlOk) {
    Write-Host "[DB] MariaDB not detected - searching XAMPP..." -ForegroundColor Cyan
    $xamppStart = "C:\xampp\mysql_start.bat"
    $mysqld = "C:\xampp\mysql\bin\mysqld.exe"
    $myIni = "C:\xampp\mysql\bin\my.ini"

    if (Test-Path $xamppStart) {
        Write-Host "[DB] Starting MariaDB via XAMPP batch runner..." -ForegroundColor Cyan
        $dbProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$xamppStart`"" -WorkingDirectory "C:\xampp" -WindowStyle Hidden -PassThru
        $script:runningProcesses.Add($dbProc)
    } elseif (Test-Path $mysqld) {
        Write-Host "[DB] Starting MariaDB from $mysqld..." -ForegroundColor Cyan
        $argList = if (Test-Path $myIni) { "--defaults-file=`"$myIni`" --standalone" } else { "--standalone" }
        $dbProc = Start-Process -FilePath $mysqld -ArgumentList $argList -WorkingDirectory "C:\xampp\mysql" -WindowStyle Hidden -PassThru
        $script:runningProcesses.Add($dbProc)
    } else {
        Write-Host "[WARN] XAMPP not found at C:\xampp - please start MySQL manually if needed" -ForegroundColor Yellow
    }

    # Verify MariaDB started and is accepting connections
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep 1
        try {
            $testConn = [System.Net.Sockets.TcpClient]::new()
            $testConn.ConnectAsync("127.0.0.1", 3306).Wait(1000)
            if ($testConn.Connected) {
                $testConn.Close()
                $mysqlOk = $true
                break
            }
            $testConn.Close()
        } catch {}
    }

    if ($mysqlOk) {
        Write-Host "[OK] MariaDB started and connected successfully on port 3306!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Could not auto-start MariaDB - please ensure Apache/MySQL is started in XAMPP" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] MariaDB is already running on port 3306" -ForegroundColor Green
}

# Helper: Wait for HTTP port
function Wait-Http($port, $timeout = 15, $path = "/docs") {
    for ($i = 0; $i -lt $timeout; $i++) {
        Start-Sleep 1
        try {
            $r = Invoke-WebRequest "http://localhost:$port$path" -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -eq 200) { return $true }
        } catch {}
    }
    return $false
}

# Helper: Start hidden tunnel and capture output
function Start-HiddenTunnel($port, $label, $logFile) {
    $logPath = Join-Path $rootDir $logFile
    $proc = Start-Process -FilePath $cfPath `
        -ArgumentList "tunnel --url http://localhost:$port" `
        -RedirectStandardError $logPath `
        -WindowStyle Hidden `
        -PassThru
    $script:runningProcesses.Add($proc)
    return $proc
}

# Helper: Extract Tunnel URL from log
function Get-TunnelUrl($logFile, $timeout = 25) {
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

try {
    # ========== 1. START BACKEND ==========
    Write-Host ""
    Write-Host "[1/4] Starting FastAPI Backend (port $bePort)..." -ForegroundColor Cyan
    $beProc = Start-Process -FilePath $pyExe `
        -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $bePort --reload --app-dir ." `
        -WorkingDirectory (Join-Path $rootDir "backend") `
        -WindowStyle Hidden `
        -PassThru
    $script:runningProcesses.Add($beProc)

    if (Wait-Http $bePort 15) {
        Write-Host "      [OK] Backend is live on http://localhost:$bePort" -ForegroundColor Green
    } else {
        Write-Host "      [WARN] Backend is still initializing..." -ForegroundColor Yellow
    }

    # ========== 2. START FRONTEND ==========
    Write-Host "[2/4] Starting React Frontend (port $fePort)..." -ForegroundColor Cyan
    $feDir = Join-Path $rootDir "frontend\frontend-react"
    $feProc = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c npm run dev" `
        -WorkingDirectory $feDir `
        -WindowStyle Hidden `
        -PassThru
    $script:runningProcesses.Add($feProc)

    if (Wait-Http $fePort 12 "/") {
        Write-Host "      [OK] Frontend is live on http://localhost:$fePort" -ForegroundColor Green
    } else {
        Write-Host "      [WARN] Frontend is still initializing..." -ForegroundColor Yellow
    }

    # ========== 3. AI DETECTOR ==========
    Write-Host "[3/4] AI Detector & Stream Dashboard" -ForegroundColor Cyan
    $startDet = Read-Host "      Start AI Detector now? (Y/N, default: Y)"
    if ($startDet -eq "Y" -or $startDet -eq "y" -or -not $startDet) {
        $detProc = Start-Process -FilePath $pyExe `
            -ArgumentList "detector.py" `
            -WorkingDirectory $rootDir `
            -WindowStyle Hidden `
            -PassThru
        $script:runningProcesses.Add($detProc)
        Write-Host "      [OK] AI Detector stream running on port $streamPort" -ForegroundColor Green
    } else {
        Write-Host "      [SKIP] AI Detector skipped." -ForegroundColor Gray
    }

    # ========== 4. CLOUDFLARE TUNNELS (If Mode 1) ==========
    if ($useCF) {
        Write-Host ""
        Write-Host "[4/4] Establishing Cloudflare Secure Tunnels..." -ForegroundColor Cyan
        
        # Backend Tunnel
        Start-HiddenTunnel $bePort "Backend" "tunnel_be.log"
        Write-Host "      Connecting Backend tunnel..." -NoNewline
        $beUrl = Get-TunnelUrl "tunnel_be.log" 25
        if ($beUrl) {
            Write-Host " [OK]" -ForegroundColor Green
            $beUrl | Out-File "tunnel_be_url.txt" -Encoding ascii

            # Update Flutter app API URL
            $apiFile = Join-Path $rootDir "frontend\flutter_app\lib\services\api_service.dart"
            if (Test-Path $apiFile) {
                $content = Get-Content $apiFile -Raw
                $newApiUrl = "$beUrl/api"
                $content = $content -replace "(\s*static const String _baseUrl = ').*(')", "`${1}$newApiUrl`${2}"
                Set-Content $apiFile $content -NoNewline
            }
            # Update detector.py WebSocket URL
            $detectorFile = Join-Path $rootDir "detector.py"
            if (Test-Path $detectorFile) {
                $content = Get-Content $detectorFile -Raw
                $wsUrl = $beUrl -replace "^https", "wss"
                $newWsUrl = "$wsUrl/ws"
                $content = $content -replace '(SERVER_URL = ")[^"]*(")', "`${1}$newWsUrl`${2}"
                Set-Content $detectorFile $content -NoNewline
            }
        } else {
            Write-Host " [FAILED/TIMEOUT]" -ForegroundColor Yellow
        }

        # Frontend Tunnel
        Start-HiddenTunnel $fePort "Frontend" "tunnel_fe.log"
        Write-Host "      Connecting Frontend tunnel..." -NoNewline
        $feUrl = Get-TunnelUrl "tunnel_fe.log" 25
        if ($feUrl) {
            Write-Host " [OK]" -ForegroundColor Green
            $feUrl | Out-File "tunnel_fe_url.txt" -Encoding ascii
        } else {
            Write-Host " [FAILED/TIMEOUT]" -ForegroundColor Yellow
        }

        # Stream Tunnel (if detector started)
        if ($startDet -eq "Y" -or $startDet -eq "y" -or -not $startDet) {
            Start-HiddenTunnel $streamPort "Stream" "tunnel_stream.log"
            Write-Host "      Connecting Stream tunnel..." -NoNewline
            $streamUrl = Get-TunnelUrl "tunnel_stream.log" 25
            if ($streamUrl) {
                Write-Host " [OK]" -ForegroundColor Green
                $streamUrl | Out-File "tunnel_stream_url.txt" -Encoding ascii
            } else {
                Write-Host " [FAILED/TIMEOUT]" -ForegroundColor Yellow
            }
        }
    }

    # ========== SYSTEM DASHBOARD SUMMARY ==========
    $pcIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -ne "Loopback" } | Select-Object -First 1).IPAddress
    if (-not $pcIp) { $pcIp = "127.0.0.1" }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "               VISION-TRAK SYSTEM IS ACTIVE                 " -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    if ($useCF) {
        Write-Host "  [PUBLIC INTERNET URLS] (Cloudflare Tunnels):" -ForegroundColor Yellow
        if ($feUrl)     { Write-Host "  > Admin & Web Portal   : $feUrl" -ForegroundColor Green }
        if ($beUrl)     { Write-Host "  > Backend API & Docs   : $beUrl/docs" -ForegroundColor Green }
        if ($streamUrl) { Write-Host "  > Live Camera Stream   : $streamUrl" -ForegroundColor Green }
        Write-Host ""
    }

    Write-Host "  [LOCAL NETWORK URLS] (LAN / Localhost):" -ForegroundColor Cyan
    Write-Host "  > Web Portal (Admin)   : http://localhost:$fePort" -ForegroundColor White
    Write-Host "  > Backend API & Docs   : http://${pcIp}:${bePort}/docs" -ForegroundColor White
    Write-Host "  > Live Camera Stream   : http://${pcIp}:${streamPort}/" -ForegroundColor White
    Write-Host "  > Flutter App Base URL : http://${pcIp}:${bePort}/api" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " [INFO] All services running smoothly in the background." -ForegroundColor Gray
    Write-Host " [INFO] Press [Q] or [Ctrl+C] to stop all services and exit." -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    # Keep terminal alive and listen for Q key
    while ($true) {
        if ([System.Console]::KeyAvailable) {
            $key = [System.Console]::ReadKey($true)
            if ($key.Key -eq [System.ConsoleKey]::Q) {
                break
            }
        }
        Start-Sleep -Milliseconds 500
    }

} finally {
    Stop-AllServices
}
