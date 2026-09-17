$ErrorActionPreference = 'Stop'
$modelDir = Join-Path $PSScriptRoot '..\models'
New-Item -ItemType Directory -Force -Path $modelDir | Out-Null
$base = 'https://huggingface.co/Nefflymicn/PlantVillage-plant-disease-detection/resolve/main'
Invoke-WebRequest "$base/plant_disease_efficientnet.keras" -OutFile (Join-Path $modelDir 'plant_disease_efficientnet.keras')
Invoke-WebRequest "$base/class_names.txt" -OutFile (Join-Path $modelDir 'class_names.txt')
Write-Host 'PlantVillage model and labels downloaded successfully.'
