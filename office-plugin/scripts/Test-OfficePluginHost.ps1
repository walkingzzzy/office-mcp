Param(
  [ValidateSet("word", "excel", "powerpoint")]
  [string]$Host = "word",
  [string]$ManifestPath = "../manifest.xml",
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$PluginUrl = "https://localhost:3000/taskpane/index.html"
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
  $resolvedManifest = Resolve-Path $ManifestPath

  Write-Host "1/5 检查主应用 API..." -ForegroundColor Green
  $health = Invoke-RestMethod -Uri "$ApiBaseUrl/v1/office/health" -TimeoutSec 10
  if (-not $health.success) {
    throw "/v1/office/health 返回 success=false"
  }
  Write-Host "Health 检查通过。" -ForegroundColor Green

  Write-Host "2/5 拉取配置..." -ForegroundColor Green
  $config = Invoke-RestMethod -Uri "$ApiBaseUrl/v1/office/config" -TimeoutSec 10
  if (-not $config.success) {
    throw "/v1/office/config 返回 success=false"
  }
  Write-Host ("已加载 {0} 个模型, {1} 个知识库, {2} 个 MCP 服务器。" -f `
    $config.data.models.Count, `
    $config.data.knowledgeBases.Count, `
    $config.data.mcpServers.Count) -ForegroundColor Green

  Write-Host "3/5 验证任务窗格 URL ($PluginUrl) ..." -ForegroundColor Green
  $taskpane = Invoke-WebRequest -Uri $PluginUrl -UseBasicParsing -TimeoutSec 15
  if ($taskpane.StatusCode -ne 200) {
    throw "任务窗格返回 HTTP $($taskpane.StatusCode)"
  }
  Write-Host "任务窗格内容大小：$($taskpane.Content.Length) 字节" -ForegroundColor Green

  Write-Host "4/5 启动 $Host 宿主 (sideload) ..." -ForegroundColor Green
  $startArgs = @("office-addin-debugging", "start", $resolvedManifest, "desktop", "--app", $Host)
  $process = Start-Process -FilePath "npx" -ArgumentList $startArgs -PassThru
  Start-Sleep -Seconds 5

  Write-Host "5/5 轮询 /v1/office/status ..." -ForegroundColor Green
  $status = Invoke-RestMethod -Uri "$ApiBaseUrl/v1/office/status" -TimeoutSec 10
  if (-not $status.success) {
    throw "/v1/office/status 返回 success=false"
  }
  Write-Host ("当前安装状态：{0}, Office 版本：{1}" -f `
    $status.data.officePlugin.installed, `
    $status.data.officePlugin.version) -ForegroundColor Green

  Write-Host "宿主端检查通过。关闭 sideload 会话..." -ForegroundColor Green
  & npx office-addin-debugging stop $resolvedManifest | Write-Host

  if ($process -and -not $process.HasExited) {
    $process.CloseMainWindow() | Out-Null
  }
}
finally {
  Pop-Location
}
