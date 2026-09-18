$log = "C:\Users\Jebi\Desktop\brgy-133\brgy133_system\RASPY_Files_and_Backend\tunnel_fe.log"
& "C:\Users\Jebi\Desktop\brgy-133\brgy133_system\RASPY_Files_and_Backend\cloudflared.exe" tunnel --url http://localhost:5173 2>&1 | ForEach-Object { $_; $_ | Out-File $log -Append }
