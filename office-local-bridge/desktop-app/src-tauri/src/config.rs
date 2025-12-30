//! 配置管理模块
//!
//! 处理应用配置的读取、保存和默认值

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// 获取配置目录
pub fn get_config_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".office-local-bridge")
}

/// 获取配置文件路径
pub fn get_config_path() -> PathBuf {
    get_config_dir().join("config.json")
}

/// 获取提供商配置文件路径
pub fn get_providers_path() -> PathBuf {
    get_config_dir().join("providers.json")
}

/// 获取模型配置文件路径
pub fn get_models_path() -> PathBuf {
    get_config_dir().join("models.json")
}

/// 获取 MCP 服务器配置文件路径
pub fn get_mcp_servers_path() -> PathBuf {
    get_config_dir().join("mcp-servers.json")
}

/// 确保配置目录存在
pub fn ensure_config_dir() -> Result<(), String> {
    let dir = get_config_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    Ok(())
}

/// AI 提供商类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AIProviderType {
    OpenAI,
    Azure,
    Anthropic,
    Ollama,
    Custom,
}

/// 模型类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ModelType {
    Chat,
    Embedding,
    Multimodal,
}

/// 已选择的模型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectedModel {
    pub id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub model_type: ModelType,
    pub context_window: Option<i64>,
    pub supports_vision: Option<bool>,
    pub supports_tools: Option<bool>,
    pub supports_streaming: Option<bool>,
}

/// AI 提供商配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIProviderConfig {
    pub id: String,
    #[serde(rename = "type")]
    pub provider_type: AIProviderType,
    pub name: String,
    pub enabled: bool,
    pub is_default: bool,
    pub api_key: String,
    pub base_url: Option<String>,
    // Azure 特有
    pub azure_endpoint: Option<String>,
    pub azure_deployment: Option<String>,
    pub azure_api_version: Option<String>,
    // 自定义端点
    pub custom_headers: Option<std::collections::HashMap<String, String>>,
    // 已选择的模型列表
    pub selected_models: Option<Vec<SelectedModel>>,
    // 状态
    pub connection_status: Option<String>,
    pub last_tested_at: Option<i64>,
}

/// 模型配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    pub id: String,
    pub provider_id: String,
    pub name: String,
    pub display_name: String,
    pub enabled: bool,
    pub is_default: bool,
    // 参数配置
    pub max_tokens: Option<i32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub frequency_penalty: Option<f32>,
    pub presence_penalty: Option<f32>,
    // 功能支持
    pub supports_vision: Option<bool>,
    pub supports_tools: Option<bool>,
    pub supports_streaming: Option<bool>,
    // 上下文窗口
    pub context_window: Option<i32>,
}

/// MCP 服务器配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerConfig {
    pub id: String,
    pub name: String,
    pub command: String,
    pub args: Option<Vec<String>>,
    pub cwd: Option<String>,
    pub env: Option<std::collections::HashMap<String, String>>,
    pub enabled: bool,
    pub auto_start: bool,
}

/// MCP 服务器状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerStatus {
    pub id: String,
    pub name: String,
    pub status: String,
    pub pid: Option<u32>,
    pub start_time: Option<i64>,
    pub last_error: Option<String>,
    pub tool_count: Option<i32>,
}

/// 主配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeConfig {
    pub version: i32,
    pub port: u16,
    pub host: String,
    pub log_level: String,
    pub default_provider_id: Option<String>,
    pub default_chat_model_id: Option<String>,      // 默认对话模型 (格式: providerId:modelId)
    pub default_embedding_model_id: Option<String>, // 默认嵌入模型 (格式: providerId:modelId)
    pub auto_start: bool,
    pub minimize_to_tray: bool,
}

impl Default for BridgeConfig {
    fn default() -> Self {
        Self {
            version: 1,
            port: 3001,
            host: "localhost".to_string(),
            log_level: "info".to_string(),
            default_provider_id: None,
            default_chat_model_id: None,
            default_embedding_model_id: None,
            auto_start: true,
            minimize_to_tray: true,
        }
    }
}

/// 提供商列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProvidersConfig {
    pub version: i32,
    pub providers: Vec<AIProviderConfig>,
}

impl Default for ProvidersConfig {
    fn default() -> Self {
        Self {
            version: 1,
            providers: vec![],
        }
    }
}

/// 模型列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelsConfig {
    pub version: i32,
    pub models: Vec<ModelConfig>,
}

impl Default for ModelsConfig {
    fn default() -> Self {
        Self {
            version: 1,
            models: vec![],
        }
    }
}

/// MCP 服务器列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServersConfig {
    pub version: i32,
    pub servers: Vec<McpServerConfig>,
}

impl Default for McpServersConfig {
    fn default() -> Self {
        Self {
            version: 1,
            servers: vec![],
        }
    }
}

/// 读取配置文件
pub fn read_config<T: for<'de> Deserialize<'de> + Default>(path: &PathBuf) -> T {
    match fs::read_to_string(path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => T::default(),
    }
}

/// 写入配置文件
pub fn write_config<T: Serialize>(path: &PathBuf, config: &T) -> Result<(), String> {
    ensure_config_dir()?;
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(path, content).map_err(|e| format!("写入配置文件失败: {}", e))?;
    Ok(())
}
