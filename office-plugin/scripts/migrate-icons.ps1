# 图标迁移脚本：lucide-react -> @fluentui/react-icons

$iconMapping = @{
    # 通用操作
    'Plus' = 'AddRegular'
    'Check' = 'CheckmarkRegular'
    'CheckCircle2' = 'CheckmarkCircleRegular'
    'Copy' = 'CopyRegular'
    'Trash2' = 'DeleteRegular'
    'X' = 'DismissRegular'
    'Edit3' = 'EditRegular'
    'PenSquare' = 'EditRegular'
    'Eye' = 'EyeRegular'
    'RefreshCw' = 'ArrowResetRegular'
    'RefreshCcw' = 'ArrowResetRegular'
    'RotateCw' = 'ArrowResetRegular'
    'Search' = 'SearchRegular'
    'Send' = 'SendRegular'
    'Settings' = 'SettingsRegular'
    'Undo2' = 'ArrowUndoRegular'
    'Download' = 'ArrowDownloadRegular'
    
    # 状态指示
    'AlertCircle' = 'ErrorCircleRegular'
    'AlertOctagon' = 'ErrorCircleRegular'
    'AlertTriangle' = 'WarningRegular'
    'Info' = 'InfoRegular'
    'Loader2' = 'SpinnerIosRegular'
    
    # 文档相关
    'FileText' = 'DocumentTextRegular'
    'FileType' = 'DocumentRegular'
    'FolderOpen' = 'FolderRegular'
    'Image' = 'ImageRegular'
    'Table' = 'TableRegular'
    'Code' = 'CodeRegular'
    
    # 聊天相关
    'MessageSquare' = 'ChatRegular'
    'MessageSquarePlus' = 'ChatAddRegular'
    'MessageCircle' = 'CommentRegular'
    'MessageCircleQuestion' = 'CommentRegular'
    
    # 导航
    'ChevronDown' = 'ChevronDownRegular'
    'ChevronUp' = 'ChevronUpRegular'
    'ChevronRight' = 'ChevronRightRegular'
    'Menu' = 'NavigationRegular'
    
    # 其他
    'BookOpen' = 'BookOpenRegular'
    'Brain' = 'BrainCircuitRegular'
    'Clock3' = 'ClockRegular'
    'Globe' = 'GlobeRegular'
    'ExternalLink' = 'LinkRegular'
    'Paperclip' = 'AttachRegular'
    'Sparkles' = 'SparkleRegular'
    'Star' = 'StarRegular'
    'Wand2' = 'WandRegular'
    'Wrench' = 'WrenchRegular'
    'Sun' = 'WeatherSunnyRegular'
    'Moon' = 'WeatherMoonRegular'
    'Bot' = 'BotRegular'
    
    # 额外图标
    'Clock' = 'ClockRegular'
    'ListChecks' = 'TaskListSquareRegular'
    'ListTodo' = 'TaskListSquareRegular'
    'XCircle' = 'DismissCircleRegular'
    'CheckCircle' = 'CheckmarkCircleRegular'
    'Circle' = 'CircleRegular'
    'CircleCheck' = 'CheckmarkCircleRegular'
    'CircleDot' = 'CircleRegular'
    'PlayCircle' = 'PlayCircleRegular'
    'PauseCircle' = 'PauseCircleRegular'
}

Write-Host "开始迁移图标..."

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx" | 
    Select-String -Pattern "from 'lucide-react'" | 
    Select-Object -ExpandProperty Path -Unique

foreach ($file in $files) {
    Write-Host "处理: $file"
    $content = Get-Content $file -Raw
    
    # 提取 lucide-react 导入的图标
    if ($content -match "import \{([^}]+)\} from 'lucide-react'") {
        $importedIcons = $matches[1] -split ',' | ForEach-Object { $_.Trim() -replace ' as \w+', '' }
        
        $fluentIcons = @()
        foreach ($icon in $importedIcons) {
            if ($iconMapping.ContainsKey($icon)) {
                $fluentIcons += $iconMapping[$icon]
            } else {
                Write-Host "  警告: 未找到映射 - $icon"
                $fluentIcons += $icon + "Regular"
            }
        }
        
        $uniqueFluentIcons = $fluentIcons | Sort-Object -Unique
        $newImport = "import {`n  " + ($uniqueFluentIcons -join ",`n  ") + "`n} from '@fluentui/react-icons'"
        
        # 替换导入语句
        $content = $content -replace "import \{[^}]+\} from 'lucide-react'", $newImport
        
        # 替换 JSX 中的图标使用
        foreach ($icon in $importedIcons) {
            $cleanIcon = $icon -replace ' as \w+', ''
            if ($iconMapping.ContainsKey($cleanIcon)) {
                $content = $content -replace "<$cleanIcon ", "<$($iconMapping[$cleanIcon]) "
                $content = $content -replace "<$cleanIcon`n", "<$($iconMapping[$cleanIcon])`n"
            }
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "  完成"
    }
}

Write-Host "迁移完成!"
