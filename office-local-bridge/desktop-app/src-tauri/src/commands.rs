//! Tauri 命令模块
//!
//! 定义前端可调用的 IPC 命令

use crate::config::*;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};

/// 桥接服务状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeStatus {
    pub running: bool,
    pub port: u16,
    pub url: String,
    pub uptime: Option<i64>,
}

/// API 响应格式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}

// ===== 配置管理命令 =====

/// 获取主配置
#[tauri::command]
pub fn get_config() -> ApiResponse<BridgeConfig> {
    let config: BridgeConfig = read_config(&get_config_path());
    ApiResponse::success(config)
}

/// 保存主配置
#[tauri::command]
pub fn save_config(config: BridgeConfig) -> ApiResponse<BridgeConfig> {
    match write_config(&get_config_path(), &config) {
        Ok(_) => ApiResponse::success(config),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 更新主配置（部分更新）
#[tauri::command]
pub fn update_config(config: serde_json::Value) -> ApiResponse<BridgeConfig> {
    let mut current: BridgeConfig = read_config(&get_config_path());
    
    // 合并更新
    if let Some(port) = config.get("port").and_then(|v| v.as_u64()) {
        current.port = port as u16;
    }
    if let Some(host) = config.get("host").and_then(|v| v.as_str()) {
        current.host = host.to_string();
    }
    if let Some(log_level) = config.get("logLevel").and_then(|v| v.as_str()) {
        current.log_level = log_level.to_string();
    }
    if let Some(default_provider_id) = config.get("defaultProviderId") {
        current.default_provider_id = default_provider_id.as_str().map(|s| s.to_string());
    }
    if let Some(default_chat_model_id) = config.get("defaultChatModelId") {
        current.default_chat_model_id = default_chat_model_id.as_str().map(|s| s.to_string());
    }
    if let Some(default_embedding_model_id) = config.get("defaultEmbeddingModelId") {
        current.default_embedding_model_id = default_embedding_model_id.as_str().map(|s| s.to_string());
    }
    if let Some(auto_start) = config.get("autoStart").and_then(|v| v.as_bool()) {
        current.auto_start = auto_start;
    }
    if let Some(minimize_to_tray) = config.get("minimizeToTray").and_then(|v| v.as_bool()) {
        current.minimize_to_tray = minimize_to_tray;
    }
    
    match write_config(&get_config_path(), &current) {
        Ok(_) => ApiResponse::success(current),
        Err(e) => ApiResponse::error(&e),
    }
}

// ===== AI 提供商命令 =====

/// 获取所有提供商
#[tauri::command]
pub fn get_providers() -> ApiResponse<Vec<AIProviderConfig>> {
    let config: ProvidersConfig = read_config(&get_providers_path());
    ApiResponse::success(config.providers)
}

/// 添加提供商
#[tauri::command]
pub fn add_provider(provider: AIProviderConfig) -> ApiResponse<AIProviderConfig> {
    let mut config: ProvidersConfig = read_config(&get_providers_path());

    // 检查 ID 是否已存在
    if config.providers.iter().any(|p| p.id == provider.id) {
        return ApiResponse::error("提供商 ID 已存在");
    }

    config.providers.push(provider.clone());

    match write_config(&get_providers_path(), &config) {
        Ok(_) => ApiResponse::success(provider),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 更新提供商
#[tauri::command]
pub fn update_provider(provider: AIProviderConfig) -> ApiResponse<AIProviderConfig> {
    let mut config: ProvidersConfig = read_config(&get_providers_path());

    if let Some(index) = config.providers.iter().position(|p| p.id == provider.id) {
        config.providers[index] = provider.clone();
        match write_config(&get_providers_path(), &config) {
            Ok(_) => ApiResponse::success(provider),
            Err(e) => ApiResponse::error(&e),
        }
    } else {
        ApiResponse::error("提供商不存在")
    }
}

/// 删除提供商
#[tauri::command]
pub fn delete_provider(id: String) -> ApiResponse<bool> {
    let mut config: ProvidersConfig = read_config(&get_providers_path());
    let original_len = config.providers.len();
    config.providers.retain(|p| p.id != id);

    if config.providers.len() == original_len {
        return ApiResponse::error("提供商不存在");
    }

    match write_config(&get_providers_path(), &config) {
        Ok(_) => ApiResponse::success(true),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 测试提供商连接
#[tauri::command]
pub async fn test_provider_connection(provider: AIProviderConfig) -> ApiResponse<bool> {
    // 根据提供商类型构建测试请求
    let base_url = provider.base_url.clone().unwrap_or_else(|| {
        match provider.provider_type {
            AIProviderType::OpenAI => "https://api.openai.com/v1".to_string(),
            AIProviderType::Anthropic => "https://api.anthropic.com".to_string(),
            AIProviderType::Ollama => "http://localhost:11434".to_string(),
            AIProviderType::Azure => provider.azure_endpoint.clone().unwrap_or_default(),
            AIProviderType::Custom => String::new(),
        }
    });

    if base_url.is_empty() {
        return ApiResponse::error("未配置 API 端点");
    }

    let client = reqwest::Client::new();
    let url = match provider.provider_type {
        AIProviderType::OpenAI => format!("{}/models", base_url),
        AIProviderType::Anthropic => format!("{}/v1/models", base_url),
        AIProviderType::Ollama => format!("{}/api/tags", base_url),
        AIProviderType::Azure => format!(
            "{}/openai/models?api-version={}",
            base_url,
            provider.azure_api_version.unwrap_or_else(|| "2024-02-15-preview".to_string())
        ),
        AIProviderType::Custom => format!("{}/models", base_url),
    };

    let mut request = client.get(&url);

    // 设置认证头
    match provider.provider_type {
        AIProviderType::OpenAI | AIProviderType::Custom => {
            request = request.header("Authorization", format!("Bearer {}", provider.api_key));
        }
        AIProviderType::Anthropic => {
            request = request.header("x-api-key", &provider.api_key);
            request = request.header("anthropic-version", "2023-06-01");
        }
        AIProviderType::Azure => {
            request = request.header("api-key", &provider.api_key);
        }
        AIProviderType::Ollama => {
            // Ollama 通常不需要认证
        }
    }

    match request.send().await {
        Ok(response) => {
            if response.status().is_success() {
                ApiResponse::success(true)
            } else {
                ApiResponse::error(&format!("连接失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("连接失败: {}", e)),
    }
}

// ===== 模型管理命令 =====

/// 获取所有模型
#[tauri::command]
pub fn get_models() -> ApiResponse<Vec<ModelConfig>> {
    let config: ModelsConfig = read_config(&get_models_path());
    ApiResponse::success(config.models)
}

/// 添加模型
#[tauri::command]
pub fn add_model(model: ModelConfig) -> ApiResponse<ModelConfig> {
    let mut config: ModelsConfig = read_config(&get_models_path());

    if config.models.iter().any(|m| m.id == model.id) {
        return ApiResponse::error("模型 ID 已存在");
    }

    config.models.push(model.clone());

    match write_config(&get_models_path(), &config) {
        Ok(_) => ApiResponse::success(model),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 更新模型
#[tauri::command]
pub fn update_model(model: ModelConfig) -> ApiResponse<ModelConfig> {
    let mut config: ModelsConfig = read_config(&get_models_path());

    if let Some(index) = config.models.iter().position(|m| m.id == model.id) {
        config.models[index] = model.clone();
        match write_config(&get_models_path(), &config) {
            Ok(_) => ApiResponse::success(model),
            Err(e) => ApiResponse::error(&e),
        }
    } else {
        ApiResponse::error("模型不存在")
    }
}

/// 删除模型
#[tauri::command]
pub fn delete_model(id: String) -> ApiResponse<bool> {
    let mut config: ModelsConfig = read_config(&get_models_path());
    let original_len = config.models.len();
    config.models.retain(|m| m.id != id);

    if config.models.len() == original_len {
        return ApiResponse::error("模型不存在");
    }

    match write_config(&get_models_path(), &config) {
        Ok(_) => ApiResponse::success(true),
        Err(e) => ApiResponse::error(&e),
    }
}

// ===== MCP 服务器命令 =====

/// 获取所有 MCP 服务器配置
#[tauri::command]
pub fn get_mcp_servers() -> ApiResponse<Vec<McpServerConfig>> {
    let config: McpServersConfig = read_config(&get_mcp_servers_path());
    ApiResponse::success(config.servers)
}

/// 添加 MCP 服务器
#[tauri::command]
pub fn add_mcp_server(server: McpServerConfig) -> ApiResponse<McpServerConfig> {
    let mut config: McpServersConfig = read_config(&get_mcp_servers_path());

    // 检查 ID 是否已存在
    if config.servers.iter().any(|s| s.id == server.id) {
        return ApiResponse::error("MCP 服务器 ID 已存在");
    }

    // 检查名称是否已存在
    if config.servers.iter().any(|s| s.name == server.name) {
        return ApiResponse::error("MCP 服务器名称已存在");
    }

    config.servers.push(server.clone());

    match write_config(&get_mcp_servers_path(), &config) {
        Ok(_) => ApiResponse::success(server),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 更新 MCP 服务器
#[tauri::command]
pub fn update_mcp_server(server: McpServerConfig) -> ApiResponse<McpServerConfig> {
    let mut config: McpServersConfig = read_config(&get_mcp_servers_path());

    if let Some(index) = config.servers.iter().position(|s| s.id == server.id) {
        // 检查名称是否与其他服务器重复
        if config.servers.iter().any(|s| s.id != server.id && s.name == server.name) {
            return ApiResponse::error("MCP 服务器名称已存在");
        }
        
        config.servers[index] = server.clone();
        match write_config(&get_mcp_servers_path(), &config) {
            Ok(_) => ApiResponse::success(server),
            Err(e) => ApiResponse::error(&e),
        }
    } else {
        ApiResponse::error("MCP 服务器不存在")
    }
}

/// 删除 MCP 服务器
#[tauri::command]
pub async fn delete_mcp_server(id: String) -> ApiResponse<bool> {
    // 首先尝试停止服务器（如果正在运行）
    let config_main: BridgeConfig = read_config(&get_config_path());
    let stop_url = format!(
        "http://{}:{}/api/mcp/servers/{}/stop",
        config_main.host, config_main.port, id
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    // 尝试停止服务器，忽略错误（服务器可能未运行）
    let _ = client.post(&stop_url).send().await;

    // 从配置文件中删除
    let mut config: McpServersConfig = read_config(&get_mcp_servers_path());
    let original_len = config.servers.len();
    config.servers.retain(|s| s.id != id);

    if config.servers.len() == original_len {
        return ApiResponse::error("MCP 服务器不存在");
    }

    match write_config(&get_mcp_servers_path(), &config) {
        Ok(_) => ApiResponse::success(true),
        Err(e) => ApiResponse::error(&e),
    }
}

/// 获取 MCP 服务器状态（通过 Bridge 服务 API）
#[tauri::command]
pub async fn get_mcp_server_status() -> ApiResponse<Vec<McpServerStatus>> {
    let config: BridgeConfig = read_config(&get_config_path());
    // 直接使用 /api/mcp/servers 端点获取服务器状态
    let url = format!("http://{}:{}/api/mcp/servers", config.host, config.port);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        // API 返回格式为 { servers: [...] }
                        if let Some(servers) = json.get("servers") {
                            match serde_json::from_value::<Vec<McpServerStatus>>(servers.clone()) {
                                Ok(status) => ApiResponse::success(status),
                                Err(e) => {
                                    eprintln!("解析 MCP 服务器状态失败: {}", e);
                                    ApiResponse::success(vec![])
                                }
                            }
                        } else {
                            // 尝试直接解析为数组
                            match serde_json::from_value::<Vec<McpServerStatus>>(json.clone()) {
                                Ok(status) => ApiResponse::success(status),
                                Err(_) => ApiResponse::success(vec![]),
                            }
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                ApiResponse::error(&format!("服务请求失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("无法连接到服务: {}", e)),
    }
}

/// 启动 MCP 服务器
#[tauri::command]
pub async fn start_mcp_server(id: String) -> ApiResponse<bool> {
    let config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/mcp/servers/{}/start",
        config.host, config.port, id
    );

    let client = reqwest::Client::new();
    match client.post(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                ApiResponse::success(true)
            } else {
                ApiResponse::error(&format!("启动失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// 停止 MCP 服务器
#[tauri::command]
pub async fn stop_mcp_server(id: String) -> ApiResponse<bool> {
    let config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/mcp/servers/{}/stop",
        config.host, config.port, id
    );

    let client = reqwest::Client::new();
    match client.post(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                ApiResponse::success(true)
            } else {
                ApiResponse::error(&format!("停止失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// 重启 MCP 服务器
#[tauri::command]
pub async fn restart_mcp_server(id: String) -> ApiResponse<bool> {
    let config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/mcp/servers/{}/restart",
        config.host, config.port, id
    );

    let client = reqwest::Client::new();
    match client.post(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                ApiResponse::success(true)
            } else {
                ApiResponse::error(&format!("重启失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// MCP 工具信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpTool {
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub input_schema: serde_json::Value,
    pub category: Option<String>,
}

/// 获取 MCP 服务器的工具列表
#[tauri::command]
pub async fn get_mcp_server_tools(id: String) -> ApiResponse<Vec<McpTool>> {
    let config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/mcp/servers/{}/tools",
        config.host, config.port, id
    );

    let client = reqwest::Client::new();
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        if let Some(tools) = json.get("tools") {
                            match serde_json::from_value::<Vec<McpTool>>(tools.clone()) {
                                Ok(tools_list) => ApiResponse::success(tools_list),
                                Err(_) => ApiResponse::success(vec![]),
                            }
                        } else {
                            ApiResponse::success(vec![])
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                ApiResponse::error(&format!("获取工具失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// 日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: i64,
    pub level: String,
    pub module: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

/// 获取系统日志
#[tauri::command]
pub async fn get_logs(limit: Option<u32>, level: Option<String>) -> ApiResponse<Vec<LogEntry>> {
    let config: BridgeConfig = read_config(&get_config_path());
    let mut url = format!("http://{}:{}/api/logs", config.host, config.port);
    
    // 添加查询参数
    let mut params = vec![];
    if let Some(l) = limit {
        params.push(format!("limit={}", l));
    }
    if let Some(lv) = level {
        params.push(format!("level={}", lv));
    }
    if !params.is_empty() {
        url = format!("{}?{}", url, params.join("&"));
    }

    let client = reqwest::Client::new();
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        // 日志在 data.logs 中
                        let logs_value = json.get("data")
                            .and_then(|d| d.get("logs"))
                            .or_else(|| json.get("logs"));
                        
                        if let Some(logs) = logs_value {
                            match serde_json::from_value::<Vec<LogEntry>>(logs.clone()) {
                                Ok(logs_list) => ApiResponse::success(logs_list),
                                Err(_) => ApiResponse::success(vec![]),
                            }
                        } else {
                            ApiResponse::success(vec![])
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                ApiResponse::error(&format!("获取日志失败: HTTP {}", response.status()))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

// ===== 桥接服务命令 =====

/// 桥接服务进程状态
pub struct BridgeProcessState(pub Mutex<Option<std::process::Child>>);

/// 获取桥接服务状态
#[tauri::command]
pub async fn get_bridge_status() -> ApiResponse<BridgeStatus> {
    let config: BridgeConfig = read_config(&get_config_path());
    let url = format!("http://{}:{}/health", config.host, config.port);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
        .unwrap_or_default();

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // 尝试解析响应获取更多信息
                let uptime = response.json::<serde_json::Value>().await
                    .ok()
                    .and_then(|v| v.get("uptime").and_then(|u| u.as_i64()));

                ApiResponse::success(BridgeStatus {
                    running: true,
                    port: config.port,
                    url: format!("http://{}:{}", config.host, config.port),
                    uptime,
                })
            } else {
                ApiResponse::success(BridgeStatus {
                    running: false,
                    port: config.port,
                    url: format!("http://{}:{}", config.host, config.port),
                    uptime: None,
                })
            }
        }
        Err(_) => ApiResponse::success(BridgeStatus {
            running: false,
            port: config.port,
            url: format!("http://{}:{}", config.host, config.port),
            uptime: None,
        }),
    }
}

/// 启动桥接服务
#[tauri::command]
pub async fn start_bridge_service(
    state: State<'_, BridgeProcessState>,
    app_handle: tauri::AppHandle,
) -> Result<ApiResponse<bool>, String> {
    use std::process::{Command, Stdio};

    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    // 检查是否已运行
    if let Some(ref mut child) = *process_guard {
        match child.try_wait() {
            Ok(Some(_)) => {
                // 进程已退出，清理
                *process_guard = None;
            }
            Ok(None) => {
                return Ok(ApiResponse::error("桥接服务已在运行中"));
            }
            Err(e) => {
                return Ok(ApiResponse::error(&format!("检查进程状态失败: {}", e)));
            }
        }
    }

    // 获取服务路径
    let service_path = get_bridge_service_path(&app_handle);

    // 确定启动命令
    let (cmd, args, cwd) = get_bridge_start_command(&service_path);

    // 启动进程
    match Command::new(&cmd)
        .args(&args)
        .current_dir(&cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => {
            *process_guard = Some(child);
            Ok(ApiResponse::success(true))
        }
        Err(e) => Ok(ApiResponse::error(&format!("启动服务失败: {}", e))),
    }
}

/// 停止桥接服务
#[tauri::command]
pub async fn stop_bridge_service(
    state: State<'_, BridgeProcessState>,
) -> Result<ApiResponse<bool>, String> {
    let mut process_guard = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(ref mut child) = *process_guard {
        // Windows 上使用 taskkill
        #[cfg(windows)]
        {
            let pid = child.id();
            let _ = std::process::Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F"])
                .output();
        }

        // Unix 上发送 SIGTERM
        #[cfg(not(windows))]
        {
            let _ = child.kill();
        }

        // 等待进程退出
        let _ = child.wait();
        *process_guard = None;

        Ok(ApiResponse::success(true))
    } else {
        Ok(ApiResponse::error("桥接服务未运行"))
    }
}

/// 获取桥接服务路径
fn get_bridge_service_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    // 优先使用环境变量
    if let Ok(path) = std::env::var("BRIDGE_SERVICE_PATH") {
        return std::path::PathBuf::from(path);
    }

    // 尝试获取应用资源目录
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let service_path = resource_dir.join("bridge-service");
        if service_path.exists() {
            return service_path;
        }
    }

    // 开发模式：使用相对路径
    let dev_path = std::path::PathBuf::from("../..");
    if dev_path.join("src").join("server.ts").exists() {
        return dev_path;
    }

    // 默认当前目录
    std::path::PathBuf::from(".")
}

/// 获取启动命令
fn get_bridge_start_command(service_path: &std::path::Path) -> (String, Vec<String>, std::path::PathBuf) {
    // 优先使用打包后的可执行文件
    #[cfg(windows)]
    let exe_name = "office-local-bridge-win.exe";
    #[cfg(not(windows))]
    let exe_name = "office-local-bridge";

    let exe_path = service_path.join("dist").join(exe_name);
    if exe_path.exists() {
        return (
            exe_path.to_string_lossy().to_string(),
            vec![],
            service_path.to_path_buf(),
        );
    }

    // 否则使用 Node.js 运行编译后的代码
    let script_path = service_path.join("dist").join("server.js");
    if script_path.exists() {
        return (
            "node".to_string(),
            vec![script_path.to_string_lossy().to_string()],
            service_path.to_path_buf(),
        );
    }

    // 开发模式：使用 npm run dev
    (
        "npm".to_string(),
        vec!["run".to_string(), "dev".to_string()],
        service_path.to_path_buf(),
    )
}

// ===== 供应商验证和模型管理命令 =====

/// 模型信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub context_window: Option<i64>,
    pub supports_vision: Option<bool>,
    pub supports_tools: Option<bool>,
    pub supports_streaming: Option<bool>,
}

/// 验证供应商请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateProviderRequest {
    #[serde(rename = "type")]
    pub provider_type: AIProviderType,
    pub api_key: String,
    pub base_url: Option<String>,
    pub azure_endpoint: Option<String>,
    pub azure_deployment: Option<String>,
    pub azure_api_version: Option<String>,
}

/// 验证供应商响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateProviderResponse {
    pub valid: bool,
    pub error: Option<String>,
    pub models: Option<Vec<ModelInfo>>,
}

/// 测试模型请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestModelRequest {
    pub model_id: String,
    pub test_message: Option<String>,
}

/// 测试模型响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestModelResponse {
    pub success: bool,
    pub response: Option<String>,
    pub latency: Option<i64>,
    pub error: Option<String>,
}

/// 验证供应商配置（通过 Bridge 服务 API）
#[tauri::command]
pub async fn validate_provider(config: ValidateProviderRequest) -> ApiResponse<ValidateProviderResponse> {
    let bridge_config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/config/providers/validate",
        bridge_config.host, bridge_config.port
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_default();

    // 构建请求体
    let body = serde_json::json!({
        "type": config.provider_type,
        "apiKey": config.api_key,
        "baseUrl": config.base_url,
        "azureEndpoint": config.azure_endpoint,
        "azureDeployment": config.azure_deployment,
        "azureApiVersion": config.azure_api_version,
    });

    match client.post(&url).json(&body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        // 后端返回格式: { success: true, data: { valid: true, models: [...] } }
                        if let Some(data) = json.get("data") {
                            match serde_json::from_value::<ValidateProviderResponse>(data.clone()) {
                                Ok(result) => ApiResponse::success(result),
                                Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                            }
                        } else {
                            ApiResponse::error("响应格式错误: 缺少 data 字段")
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                ApiResponse::error(&format!("验证失败: HTTP {} - {}", status, error_text))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// 获取供应商可用模型列表（通过 Bridge 服务 API）
#[tauri::command]
pub async fn get_provider_models(provider_id: String) -> ApiResponse<serde_json::Value> {
    let bridge_config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/config/providers/{}/models",
        bridge_config.host, bridge_config.port, provider_id
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_default();

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        // 后端返回格式: { success: true, data: { models: [...] } }
                        if let Some(data) = json.get("data") {
                            ApiResponse::success(data.clone())
                        } else {
                            // 兼容直接返回 { models: [...] } 的格式
                            ApiResponse::success(json)
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                ApiResponse::error(&format!("获取模型列表失败: HTTP {} - {}", status, error_text))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}

/// 测试特定模型（通过 Bridge 服务 API）
#[tauri::command]
pub async fn test_model(provider_id: String, request: TestModelRequest) -> ApiResponse<TestModelResponse> {
    let bridge_config: BridgeConfig = read_config(&get_config_path());
    let url = format!(
        "http://{}:{}/api/config/providers/{}/test-model",
        bridge_config.host, bridge_config.port, provider_id
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .unwrap_or_default();

    let body = serde_json::json!({
        "modelId": request.model_id,
        "testMessage": request.test_message,
    });

    match client.post(&url).json(&body).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json) => {
                        // 后端返回格式: { success: true, data: { success: true, response: "...", latency: 123 } }
                        if let Some(data) = json.get("data") {
                            match serde_json::from_value::<TestModelResponse>(data.clone()) {
                                Ok(result) => ApiResponse::success(result),
                                Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                            }
                        } else {
                            ApiResponse::error("响应格式错误: 缺少 data 字段")
                        }
                    }
                    Err(e) => ApiResponse::error(&format!("解析响应失败: {}", e)),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                ApiResponse::error(&format!("测试模型失败: HTTP {} - {}", status, error_text))
            }
        }
        Err(e) => ApiResponse::error(&format!("请求失败: {}", e)),
    }
}
