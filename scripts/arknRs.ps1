$ProgressPreference = 'SilentlyContinue'
$ArknRs = "https://github.com/MaaAssistantArknights/MaaRelease/raw/main/MaaAssistantArknights/api/binaries/arknights_rs.exe"

mkdir data -ErrorAction SilentlyContinue > $null
cd data
Invoke-WebRequest -Uri $ArknRs -OutFile "arknRs.exe"
.\arknRs.exe
