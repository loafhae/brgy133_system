# ==============================================================================
# VISION-TRAK 133 - UNIFIED SYSTEM TERMINAL DASHBOARD & CLOUDFLARE LAUNCHER
# ==============================================================================

param(
    [ValidateSet("domain", "local", "quick")]
    [string]$Mode,
    [switch]$LaunchDetector,
    [switch]$NonInteractive
)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir
$env:APP_ENV = "production"

# Set console title
$host.UI.RawUI.WindowTitle = "Vision-Trak 133 - Unified System Dashboard"

# Process tracking list
$script:runningProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$script:serviceProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()
$script:keepRunning = $true

# ---- HELPER: Stop All Started Services ----
function Stop-AllServices {
    Write-Host ""
    Write-Host "[SHUTDOWN] Stopping all system services..." -ForegroundColor Yellow

    # Stop child processes tracked by this launcher
    foreach ($proc in $script:runningProcesses) {
        if ($proc -and -not $proc.HasExited) {
            try {
                & taskkill.exe /PID $proc.Id /T /F 2>$null
            } catch {
                try {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                } catch {}
            }
        }
    }
    $script:runningProcesses.Clear()
    $script:serviceProcesses.Clear()

    # Clean temporary log files
    Remove-Item "tunnel_*.log" -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] All services stopped cleanly." -ForegroundColor Green
}

# ---- HELPER: Refuse To Take Over An Occupied Port ----
function Assert-PortAvailable($port) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) {
        throw "Port $port is already in use by PID $($listener.OwningProcess). Stop the intended service or choose another port."
    }
}

# ---- HELPER: Check TCP Port Connection ----
function Test-TcpPort($ip, $port, $timeoutMs = 1000) {
    try {
        $tcp = [System.Net.Sockets.TcpClient]::new()
        $connect = $tcp.ConnectAsync($ip, $port)
        if ($connect.Wait($timeoutMs)) {
            $tcp.Close()
            return $true
        }
        $tcp.Close()
    } catch {}
    return $false
}

# ---- HELPER: Wait for HTTP Endpoint ----
function Wait-HttpEndpoint($url, $timeoutSec = 20) {
    for ($i = 0; $i -lt $timeoutSec; $i++) {
        Start-Sleep -Milliseconds 1000
        try {
            $req = [System.Net.WebRequest]::Create($url)
            $req.Timeout = 2000
            $req.Method = "GET"
            $resp = $req.GetResponse()
            $code = [int]$resp.StatusCode
            $resp.Close()
            if ($code -eq 200) { return $true }
        } catch {
            if ($_.Exception -is [System.Net.WebException] -and $_.Exception.Response) {
                $code = [int]$_.Exception.Response.StatusCode
                $_.Exception.Response.Close()
                if ($code -eq 200) { return $true }
            }
        }
    }
    return $false
}

# ---- HELPER: Start Cloudflared Tunnel ----
function Start-HiddenTunnel($port, $label, $logFile) {
    $logPath = Join-Path $rootDir $logFile
    if (Test-Path $logPath) { Remove-Item $logPath -Force -ErrorAction SilentlyContinue }

    $argString = "tunnel --url http://127.0.0.1:$port --http-host-header localhost:$port --logfile `"$logPath`""
    $proc = Start-Process -FilePath $script:cfPath `
        -ArgumentList $argString `
        -WindowStyle Hidden `
        -PassThru
    $script:runningProcesses.Add($proc)
    $script:serviceProcesses.Add($proc)
    return $proc
}

# ---- HELPER: Extract Tunnel URL Safely with FileShare.ReadWrite ----
function Get-TunnelUrl($logFile, $timeoutSec = 35) {
    $logPath = Join-Path $rootDir $logFile
    for ($i = 0; $i -lt $timeoutSec; $i++) {
        Start-Sleep -Milliseconds 1000
        if (Test-Path $logPath) {
            try {
                $fs = [System.IO.File]::Open($logPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                $sr = [System.IO.StreamReader]::new($fs)
                $raw = $sr.ReadToEnd()
                $sr.Close()
                $fs.Close()

                if ($raw -match '(https://[a-zA-Z0-9-]+\.trycloudflare\.com)') {
                    return $matches[1].Trim()
                }
            } catch {
                # Transient read collision while cloudflared writes
            }
        }
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    return $null
}

# ---- HELPER: Get Local LAN IP ----
function Get-LanIpAddress {
    try {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
            $_.InterfaceAlias -notmatch "Loopback|vEthernet|Virtual|WSL|Bluetooth" -and $_.IPAddress -notlike "169.254*"
        } | Select-Object -First 1).IPAddress
        if ($ip) { return $ip }
    } catch {}
    return "127.0.0.1"
}

# ==============================================================================
# MAIN SYSTEM LAUNCH LOGIC
# ==============================================================================

try {
    Clear-Host
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "              VISION-TRAK 133 - SYSTEM SETUP & DASHBOARD                       " -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""

    # ---- 1. Cloudflared Binary Verification ----
    $script:cfPath = Join-Path $rootDir "cloudflared.exe"
    if (-not (Test-Path $script:cfPath)) {
        Write-Host "[SETUP] cloudflared.exe missing. Downloading official binary..." -ForegroundColor Yellow
        try {
            $downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
            Invoke-WebRequest -Uri $downloadUrl -OutFile $script:cfPath -UseBasicParsing
            Write-Host "[OK] Downloaded cloudflared.exe successfully." -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Could not download cloudflared.exe: $($_.Exception.Message)" -ForegroundColor Red
            Read-Host "Press Enter to exit..."; exit 1
        }
    } else {
        Write-Host "[OK] Cloudflared engine detected." -ForegroundColor Green
    }

    # ---- 2. Python Environment Resolution ----
    $venvPython = Join-Path $rootDir "backend\venv\Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        throw "Backend virtual environment not found. Run deploy_barangay.bat first."
    }
    $pyExe = (Resolve-Path $venvPython).Path
    Write-Host "[OK] Python runtime: $pyExe" -ForegroundColor Green

    # ---- 3. Production Frontend Check ----
    $feDir = Join-Path $rootDir "frontend\frontend-react"
    if (-not (Test-Path (Join-Path $feDir "dist\index.html"))) {
        throw "Production frontend build is missing. Run deploy_barangay.bat first."
    }
    Write-Host "[OK] Production frontend build verified." -ForegroundColor Green

    # ---- 4. Port Check ----
    Write-Host "[INFO] Checking required local ports..." -ForegroundColor Cyan
    Assert-PortAvailable 8000
    Remove-Item "tunnel_*.log" -Force -ErrorAction SilentlyContinue

    # ---- 5. Network Mode Selection ----
    if ($Mode) {
        $modeChoice = switch ($Mode) {
            "domain" { "1" }
            "local" { "2" }
            "quick" { "3" }
        }
    } else {
        Write-Host ""
        Write-Host "Select Startup Access Mode:" -ForegroundColor Yellow
        Write-Host "  [1] DOMAIN ragetech.dev - visiontrak [RECOMMENDED]" -ForegroundColor Green
        Write-Host "  [2] Localhost Only (No Public Tunnel)" -ForegroundColor White
        Write-Host "  [3] Ephemeral Cloudflare Quick Tunnel (*.trycloudflare.com)" -ForegroundColor Gray
        $modeChoice = Read-Host "Enter choice (1, 2 or 3, default: 1)"
        if (-not $modeChoice) { $modeChoice = "1" }
    }
    $useRagetechDomain = ($modeChoice -eq "1")
    $useQuickTunnel = ($modeChoice -eq "3")
    Write-Host ""

    # ---- 6. Database (MariaDB / MySQL) Service Check ----
    $beDir = Join-Path $rootDir "backend"
    Push-Location $beDir
    try {
        $databasePortText = (& $pyExe -c "from app.config import settings; print(settings.DATABASE_PORT)" | Select-Object -Last 1).Trim()
        if ($LASTEXITCODE -ne 0 -or $databasePortText -notmatch '^\d+$') {
            throw "Could not read DATABASE_PORT from backend\.env."
        }
        $databasePort = [int]$databasePortText
        if ($databasePort -lt 1 -or $databasePort -gt 65535) {
            throw "DATABASE_PORT must be between 1 and 65535."
        }
    } finally {
        Pop-Location
    }

    Write-Host "[DB] Checking MariaDB/MySQL service on port $databasePort..." -ForegroundColor Cyan
    $mysqlRunning = Test-TcpPort "127.0.0.1" $databasePort 1000

    if (-not $mysqlRunning) {
        Write-Host "     MariaDB port $databasePort inactive. Searching for XAMPP..." -ForegroundColor Yellow
        $xamppBatch = "C:\xampp\mysql_start.bat"
        $xamppDaemon = "C:\xampp\mysql\bin\mysqld.exe"
        $xamppIni = "C:\xampp\mysql\bin\my.ini"

        if (Test-Path $xamppBatch) {
            Write-Host "     Starting MariaDB via XAMPP batch runner..." -ForegroundColor Cyan
            $dbProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$xamppBatch`"" -WorkingDirectory "C:\xampp" -WindowStyle Hidden -PassThru
            $script:runningProcesses.Add($dbProc)
        } elseif (Test-Path $xamppDaemon) {
            Write-Host "     Starting MariaDB daemon directly..." -ForegroundColor Cyan
            $dbArgs = if (Test-Path $xamppIni) { "--defaults-file=`"$xamppIni`" --standalone" } else { "--standalone" }
            $dbProc = Start-Process -FilePath $xamppDaemon -ArgumentList $dbArgs -WorkingDirectory "C:\xampp\mysql" -WindowStyle Hidden -PassThru
            $script:runningProcesses.Add($dbProc)
        } else {
            Write-Host "     [WARN] XAMPP not found at C:\xampp. Please ensure MySQL is running manually." -ForegroundColor Yellow
        }

        # Wait for MySQL to open the configured database port.
        for ($i = 0; $i -lt 12; $i++) {
            Start-Sleep -Seconds 1
            if (Test-TcpPort "127.0.0.1" $databasePort 1000) {
                $mysqlRunning = $true
                break
            }
        }

        if ($mysqlRunning) {
            Write-Host "     [OK] MariaDB connected successfully on port $databasePort." -ForegroundColor Green
        } else {
            throw "MariaDB did not respond on port 3306. Backend startup has been stopped."
        }
    } else {
        Write-Host "     [OK] MariaDB is already active on port $databasePort." -ForegroundColor Green
    }

    # Ports
    $bePort = 8000
    $streamPort = 8080

    # ---- 7. Start FastAPI Backend ----
    Write-Host ""
    Write-Host "[1/2] Starting production application on port $bePort..." -ForegroundColor Cyan
    Push-Location $beDir
    try {
        & $pyExe -c "from app.config import validate_deployment_settings; validate_deployment_settings()"
        if ($LASTEXITCODE -ne 0) {
            throw "Production configuration validation failed. Review backend\.env and the errors above."
        }
    } finally {
        Pop-Location
    }

    $beProc = Start-Process -FilePath $pyExe `
        -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port $bePort --proxy-headers --forwarded-allow-ips='*' --app-dir ." `
        -WorkingDirectory $beDir `
        -WindowStyle Hidden `
        -PassThru
    $script:runningProcesses.Add($beProc)
    $script:serviceProcesses.Add($beProc)

    if (Wait-HttpEndpoint "http://127.0.0.1:$bePort/healthz" 30) {
        Write-Host "      [OK] Production application is healthy on http://localhost:$bePort" -ForegroundColor Green
    } else {
        throw "Production application did not become healthy. Check the backend process and logs."
    }

    # ---- 8. AI Detector (Optional / Auto) ----
    Write-Host "[2/2] AI Detector & Video Stream" -ForegroundColor Cyan
    $launchDetector = $LaunchDetector.IsPresent
    if (-not $NonInteractive) {
        $startDetector = Read-Host "      Launch AI Detector & Stream now? (Y/N, default: Y)"
        $launchDetector = ($startDetector -eq "Y" -or $startDetector -eq "y" -or -not $startDetector)
    }
    if ($launchDetector) {
        Assert-PortAvailable $streamPort
        $env:DETECTOR_SERVER_URL = "ws://127.0.0.1:$bePort/api/ws"
        Push-Location $beDir
        try {
            $detectorApiKey = (& $pyExe -c "from app.config import settings; print(settings.DETECTOR_API_KEY)" | Select-Object -Last 1)
            if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($detectorApiKey)) {
                throw "Could not load DETECTOR_API_KEY for the detector process."
            }
            $env:DETECTOR_API_KEY = $detectorApiKey.Trim()
        } finally {
            Pop-Location
        }
        $detProc = Start-Process -FilePath $pyExe `
            -ArgumentList "detector.py" `
            -WorkingDirectory $rootDir `
            -WindowStyle Hidden `
            -PassThru
        $script:runningProcesses.Add($detProc)
        $script:serviceProcesses.Add($detProc)
        Start-Sleep -Seconds 2
        if ($detProc.HasExited -or -not (Test-TcpPort "127.0.0.1" $streamPort 1000)) {
            throw "AI Detector failed to start on port $streamPort."
        }
        Write-Host "      [OK] AI Detector stream running on port $streamPort" -ForegroundColor Green
        $detectorActive = $true
    } else {
        Write-Host "      [SKIP] AI Detector skipped." -ForegroundColor Gray
        $detectorActive = $false
    }

    # ---- 9. Establish Network URLs & Tunnels ----
    $feUrl = $null
    $beUrl = $null
    $streamUrl = $null

    if ($useRagetechDomain) {
        Write-Host ""
        Write-Host "[DOMAIN] Using registered domain ragetech.dev" -ForegroundColor Green
        
        # Check for token in env or file
        $cfToken = $env:CLOUDFLARE_TUNNEL_TOKEN
        if ([string]::IsNullOrWhiteSpace($cfToken) -and (Test-Path (Join-Path $beDir ".env"))) {
            $envLine = Get-Content (Join-Path $beDir ".env") | Where-Object { $_ -match '^CLOUDFLARE_TUNNEL_TOKEN\s*=\s*(.+)$' } | Select-Object -First 1
            if ($envLine) {
                $cfToken = ($envLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
            }
        }
        
        if (-not [string]::IsNullOrWhiteSpace($cfToken) -and $cfToken -ne "PASTE_YOUR_CLOUDFLARE_TOKEN_HERE") {
            Write-Host "      Connecting Official Cloudflare Tunnel using token..." -ForegroundColor White
            $logPath = Join-Path $rootDir "tunnel_official.log"
            $argString = "tunnel --logfile `"$logPath`" run --token $cfToken"
            $proc = Start-Process -FilePath $script:cfPath -ArgumentList $argString -WindowStyle Hidden -PassThru
            $script:runningProcesses.Add($proc)
            $script:serviceProcesses.Add($proc)
            Start-Sleep -Seconds 4
        } else {
            $cfSvc = Get-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
            if ($cfSvc -and $cfSvc.Status -eq 'Running') {
                Write-Host "      [OK] Cloudflared Windows Service is active." -ForegroundColor Green
            } else {
                Write-Host "      [WARN] No tunnel token configured in .env and Cloudflared service is not active." -ForegroundColor Yellow
            }
        }

        $feUrl = "https://visiontrak.ragetech.dev"
        $beUrl = "https://visiontrak.ragetech.dev"
        if ($detectorActive) {
            $streamUrl = "http://127.0.0.1:$streamPort/"
        }
        
        # Test domain reachability
        Write-Host "      Verifying public domain connectivity..." -NoNewline -ForegroundColor White
        if (Wait-HttpEndpoint "https://visiontrak.ragetech.dev/healthz" 5) {
            Write-Host " [ONLINE]" -ForegroundColor Green
        } else {
            Write-Host " [ATTENTION: 502 / Unreachable]" -ForegroundColor Yellow
            Write-Host "      Notice: visiontrak.ragetech.dev returned 502 or timed out." -ForegroundColor Yellow
            Write-Host "      Verify Cloudflare Zero Trust: Public Hostname route must point to http://127.0.0.1:8000" -ForegroundColor Gray
        }
        
        Write-Host "      Unified Portal : $feUrl" -ForegroundColor Cyan
        Write-Host "      Backend API    : $beUrl/api" -ForegroundColor Cyan
    } elseif ($useQuickTunnel) {
        Write-Host ""
        Write-Host "[CLOUDFLARE] Connecting Temporary Quick Tunnels..." -ForegroundColor Cyan

        # Backend Tunnel (Port 8000)
        Start-HiddenTunnel $bePort "Backend" "tunnel_be.log"
        Write-Host "      Connecting Backend Tunnel (8000)" -NoNewline -ForegroundColor White
        $beUrl = Get-TunnelUrl "tunnel_be.log" 35
        if ($beUrl) {
            Write-Host " [ONLINE]" -ForegroundColor Green
            $beUrl | Out-File "tunnel_be_url.txt" -Encoding ascii -Force
            $feUrl = $beUrl
            if (-not (Wait-HttpEndpoint "$beUrl/healthz" 20)) {
                throw "The Cloudflare Quick Tunnel URL did not pass the health check."
            }
        } else {
            throw "Cloudflare Quick Tunnel did not start; public service startup has failed."
        }
    }

    # ==============================================================================
    # RENDER UNIFIED SYSTEM TERMINAL DASHBOARD
    # ==============================================================================
    Clear-Host
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "                   VISION-TRAK 133 - SYSTEM TERMINAL DASHBOARD                  " -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [SERVICES STATUS]" -ForegroundColor White
    Write-Host "  > Database (MariaDB/MySQL) : " -NoNewline; if ($mysqlRunning) { Write-Host "ONLINE (Port $databasePort)" -ForegroundColor Green } else { Write-Host "CHECK REQUIRED" -ForegroundColor Yellow }
    Write-Host "  > Production Web/API       : " -NoNewline; Write-Host "ONLINE (Port 8000)" -ForegroundColor Green
    Write-Host "  > AI Detector & Stream     : " -NoNewline; if ($detectorActive) { Write-Host "ONLINE (Port 8080)" -ForegroundColor Green } else { Write-Host "DISABLED" -ForegroundColor Gray }
    Write-Host "  > Public Domain / Tunnel   : " -NoNewline
    if ($useRagetechDomain) {
        Write-Host "ragetech.dev (Active)" -ForegroundColor Green
    } elseif ($useQuickTunnel -and $feUrl) {
        Write-Host "Quick Tunnel (Connected)" -ForegroundColor Green
    } else {
        Write-Host "LOCAL MODE" -ForegroundColor Yellow
    }
    Write-Host ""

    if ($feUrl) {
        $sectionTitle = if ($useRagetechDomain) { "[PUBLIC DOMAIN - RAGETECH.DEV]" } else { "[PUBLIC INTERNET ACCESS - CLOUDFLARE]" }
        Write-Host "  $sectionTitle" -ForegroundColor Yellow
        Write-Host "  * Web Admin Dashboard     : " -NoNewline; Write-Host "$feUrl" -ForegroundColor Cyan
        Write-Host "  * Backend API             : " -NoNewline; Write-Host "$beUrl/api" -ForegroundColor Cyan
        if ($streamUrl) {
            Write-Host "  * Live Camera Stream      : " -NoNewline; Write-Host "$streamUrl" -ForegroundColor Cyan
        }
        Write-Host "  * Mobile Flutter App URL  : " -NoNewline; Write-Host "$beUrl/api" -ForegroundColor DarkCyan
        Write-Host ""
    }

    Write-Host "  [LOCAL NETWORK ACCESS]" -ForegroundColor White
    Write-Host "  * Local Web Portal        : " -NoNewline; Write-Host "http://127.0.0.1:$bePort" -ForegroundColor Green
    Write-Host "  * Local Backend Health    : " -NoNewline; Write-Host "http://127.0.0.1:$bePort/healthz" -ForegroundColor White
    if ($detectorActive) {
        Write-Host "  * Local Camera Stream     : " -NoNewline; Write-Host "http://127.0.0.1:$streamPort/" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host "  [HOTKEYS & CONTROLS]" -ForegroundColor White
    Write-Host "   [O] Open Web App in Browser       [B] Open Backend Health Check" -ForegroundColor Gray
    Write-Host "   [S] Open Live Camera Stream       [C] Copy Web Dashboard URL to Clipboard" -ForegroundColor Gray
    Write-Host "   [Q] Stop All Services & Exit" -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Cyan
    Write-Host ""

    # Primary Web URL for quick launch
    $targetWebUrl = if ($feUrl) { $feUrl } else { "http://127.0.0.1:$bePort" }

    # Interactive keypress loop
    $script:keepRunning = $true
    while ($script:keepRunning) {
        if ($NonInteractive) {
            Start-Sleep -Seconds 5
            $failedServices = @($script:serviceProcesses | Where-Object { $_.HasExited })
            if ($failedServices.Count -gt 0) {
                throw "A required application service exited unexpectedly."
            }
            if (-not (Wait-HttpEndpoint "http://127.0.0.1:$bePort/healthz" 5)) {
                throw "The application health check failed."
            }
            continue
        }

        if ([System.Console]::KeyAvailable) {
            $key = [System.Console]::ReadKey($true)
            $k = $key.Key
            $c = [char]::ToUpper($key.KeyChar)

            if ($k -eq [System.ConsoleKey]::Q -or $c -eq 'Q') {
                Write-Host "[EXIT] Quitting..." -ForegroundColor Yellow
                $script:keepRunning = $false
                break
            }
            elseif ($k -eq [System.ConsoleKey]::O -or $c -eq 'O') {
                Write-Host "[ACTION] Opening Web Dashboard: $targetWebUrl" -ForegroundColor Green
                Start-Process $targetWebUrl
            }
            elseif ($k -eq [System.ConsoleKey]::B -or $c -eq 'B') {
                $healthUrl = if ($beUrl) { "$beUrl/healthz" } else { "http://127.0.0.1:$bePort/healthz" }
                Write-Host "[ACTION] Opening application health check: $healthUrl" -ForegroundColor Green
                Start-Process $healthUrl
            }
            elseif ($k -eq [System.ConsoleKey]::S -or $c -eq 'S') {
                $camUrl = if ($streamUrl) { $streamUrl } else { "http://127.0.0.1:$streamPort/" }
                Write-Host "[ACTION] Opening Camera Stream: $camUrl" -ForegroundColor Green
                Start-Process $camUrl
            }
            elseif ($k -eq [System.ConsoleKey]::C -or $c -eq 'C') {
                try {
                    Set-Clipboard -Value $targetWebUrl
                    Write-Host "[COPIED] Dashboard URL copied to clipboard: $targetWebUrl" -ForegroundColor Yellow
                } catch {
                    $targetWebUrl | clip.exe
                    Write-Host "[COPIED] Dashboard URL copied to clipboard: $targetWebUrl" -ForegroundColor Yellow
                }
            }
        }
        if (-not $script:keepRunning) {
            break
        }
        Start-Sleep -Milliseconds 250
    }

} finally {
    Stop-AllServices
    exit 0
}