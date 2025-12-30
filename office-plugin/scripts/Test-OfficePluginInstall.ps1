Param(
  [string]$ManifestPath = "../manifest.xml",
  [string]$ApiBaseUrl = "http://localhost:3001",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptRoot "..")
Push-Location $projectRoot

function Invoke-Tool {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  Write-Host ">> $Command $($Arguments -join ' ')" -ForegroundColor Cyan
  & $Command @Arguments | Write-Host
  if ($LASTEXITCODE -ne 0) {
    throw "命令 $Command 执行失败，退出码 $LASTEXITCODE"
  }
}

try {
  if (-not $SkipBuild) {
    Write-Host "1/6 构建 Office 插件..." -ForegroundColor Green
    Invoke-Tool "yarn" @("build")
  } else {
    Write-Host "跳过构建（收到 -SkipBuild 开关）" -ForegroundColor Yellow
  }

  Write-Host "2/6 验证 manifest..." -ForegroundColor Green
  $resolvedManifest = Resolve-Path $ManifestPath
  Invoke-Tool "npx" @("office-addin-manifest", "validate", $resolvedManifest)

  Write-Host "3/6 检查/安装开发证书..." -ForegroundColor Green
  & npx office-addin-dev-certs verify | Write-Host
  if ($LASTEXITCODE -ne 0) {
    Write-Host "证书不存在，正在安装..." -ForegroundColor Yellow
    Invoke-Tool "npx" @("office-addin-dev-certs", "install")
  } else {
    Write-Host "开发证书可用，无需重新安装。" -ForegroundColor Green
  }

  Write-Host "4/6 清理历史 sideload 会话..." -ForegroundColor Green
  & npx office-addin-debugging stop $resolvedManifest | Write-Host

  Write-Host "5/6 开始 sideload..." -ForegroundColor Green
  Invoke-Tool "npx" @("office-addin-debugging", "sideload", $resolvedManifest, "desktop")

  Write-Host "等待主应用回应..." -ForegroundColor Green
  Start-Sleep -Seconds 5

  Write-Host "6/6 调用 /v1/office/status..." -ForegroundColor Green
  $statusUrl = "$ApiBaseUrl/v1/office/status"
  $response = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec 15
  if (-not $response.success) {
    throw "/v1/office/status 返回 success=false"
  }

  Write-Host "安装端到端检查通过。API 返回：" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 5 | Write-Host
}
finally {
  Pop-Location
}
