@echo off
echo Bridge Server详细测试运行器
echo ================================
echo.

:menu
echo 请选择测试类型:
echo 1. 单元测试 (Unit Tests)
echo 2. 集成测试 (Integration Tests)
echo 3. 端到端测试 (E2E Tests)
echo 4. 所有测试 + 覆盖率
echo 5. 监视模式 (Watch Mode)
echo 6. CI模式 (持续集成)
echo 0. 退出
echo.
set /p choice=请输入选择 (0-6):

if "%choice%"=="1" goto unit_tests
if "%choice%"=="2" goto integration_tests
if "%choice%"=="3" goto e2e_tests
if "%choice%"=="4" goto all_tests
if "%choice%"=="5" goto watch_mode
if "%choice%"=="6" goto ci_mode
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:unit_tests
echo.
echo 运行单元测试...
call npm run test:unit
goto menu

:integration_tests
echo.
echo 运行集成测试...
call npm run test:integration
goto menu

:e2e_tests
echo.
echo 运行端到端测试...
call npm run test:e2e
goto menu

:all_tests
echo.
echo 运行所有测试并生成覆盖率报告...
call npm run test:coverage
echo.
echo 覆盖率报告已生成到 coverage/ 目录
start coverage\lcov-report\index.html
goto menu

:watch_mode
echo.
echo 启动监视模式...
call npm run test:watch
goto menu

:ci_mode
echo.
echo 运行CI模式测试...
call npm run test:ci
goto menu

:exit
echo 退出测试运行器
pause