$log = "C:\Users\Jebi\Desktop\brgy__system\RASPY_Files_and_Backend\tunnel_be.log"
& "C:\Users\Jebi\Desktop\brgy__system\RASPY_Files_and_Backend\cloudflared.exe" tunnel --url http://localhost:3000 2>&1 | ForEach-Object { $_; $_ | Out-File $log -Append }
