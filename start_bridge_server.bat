@echo off
echo ==========================================
echo Bridge Server 启动脚本
echo ==========================================
echo.

cd bridge-server

if not exist node_modules (
    echo 正在安装依赖...
    call npm install
)

echo.
echo 启动Bridge Server...
call npm run dev
