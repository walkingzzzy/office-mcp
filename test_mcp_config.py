#!/usr/bin/env python3
"""测试Office MCP服务器配置"""

import json
import os
from pathlib import Path

def test_mcp_config():
    """测试MCP配置文件"""
    config_path = Path.home() / ".claude" / "mcp_servers.json"

    if not config_path.exists():
        print(f"[ERROR] MCP配置文件不存在: {config_path}")
        return False

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        print(f"[OK] MCP配置文件存在: {config_path}")

        if "mcpServers" in config and "office" in config["mcpServers"]:
            office_config = config["mcpServers"]["office"]
            print(f"[OK] Office MCP服务器配置存在")
            print(f"   命令: {office_config.get('command')}")
            print(f"   参数: {office_config.get('args')}")
            print(f"   工作目录: {office_config.get('cwd')}")

            # 检查工作目录是否存在
            cwd = office_config.get('cwd')
            if cwd and os.path.exists(cwd):
                print(f"[OK] 工作目录存在: {cwd}")
            else:
                print(f"[ERROR] 工作目录不存在: {cwd}")
                return False

            return True
        else:
            print("[ERROR] Office MCP服务器配置不存在")
            return False

    except Exception as e:
        print(f"[ERROR] 读取配置文件失败: {e}")
        return False

def test_office_mcp_server():
    """测试Office MCP服务器模块"""
    try:
        import office_mcp_server
        print("[OK] Office MCP Server模块导入成功")

        from office_mcp_server.config import config
        print(f"[OK] 配置加载成功")
        print(f"   服务器名称: {config.server.server_name}")
        print(f"   版本: {config.server.version}")
        print(f"   日志级别: {config.server.log_level}")

        return True
    except Exception as e:
        print(f"[ERROR] Office MCP Server模块导入失败: {e}")
        return False

if __name__ == "__main__":
    print("=== Office MCP服务器配置测试 ===")

    config_ok = test_mcp_config()
    server_ok = test_office_mcp_server()

    if config_ok and server_ok:
        print("\n[SUCCESS] 所有测试通过！Office MCP服务器配置完成。")
        print("\n下一步：重启Claude Code以加载新的MCP服务器配置。")
    else:
        print("\n[FAILED] 配置测试失败，请检查上述错误。")