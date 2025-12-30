/**
 * 统一图标导出
 * 
 * 将 lucide-react 图标映射到 @fluentui/react-icons
 * 便于后续统一迁移
 * 
 * @created 2025-12-30
 */

import {
  // 通用操作
  AddRegular,
  ArrowUndoRegular,
  ArrowResetRegular,
  ArrowDownloadRegular,
  CheckmarkRegular,
  CheckmarkCircleRegular,
  ClipboardRegular,
  CopyRegular,
  DeleteRegular,
  DismissRegular,
  EditRegular,
  EyeRegular,
  MoreHorizontalRegular,
  SearchRegular,
  SendRegular,
  SettingsRegular,
  
  // 状态指示
  ErrorCircleRegular,
  InfoRegular,
  WarningRegular,
  SpinnerIosRegular,
  
  // 文档相关
  DocumentRegular,
  DocumentTextRegular,
  FolderRegular,
  ImageRegular,
  TableRegular,
  CodeRegular,
  
  // 聊天相关
  ChatRegular,
  ChatAddRegular,
  CommentRegular,
  
  // 导航
  ChevronDownRegular,
  ChevronUpRegular,
  ChevronRightRegular,
  NavigationRegular,
  
  // 其他
  BookOpenRegular,
  BrainCircuitRegular,
  ClockRegular,
  GlobeRegular,
  LinkRegular,
  AttachRegular,
  SparkleRegular,
  StarRegular,
  WandRegular,
  WrenchRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  BotRegular,
} from '@fluentui/react-icons'

/**
 * 图标映射表：lucide-react 名称 → Fluent UI 图标
 */
export const Icons = {
  // 通用操作
  Plus: AddRegular,
  Check: CheckmarkRegular,
  CheckCircle2: CheckmarkCircleRegular,
  Copy: CopyRegular,
  Clipboard: ClipboardRegular,
  Trash2: DeleteRegular,
  X: DismissRegular,
  Edit3: EditRegular,
  PenSquare: EditRegular,
  Eye: EyeRegular,
  MoreHorizontal: MoreHorizontalRegular,
  RefreshCw: ArrowResetRegular,
  RefreshCcw: ArrowResetRegular,
  RotateCw: ArrowResetRegular,
  Search: SearchRegular,
  Send: SendRegular,
  Settings: SettingsRegular,
  Undo2: ArrowUndoRegular,
  Download: ArrowDownloadRegular,
  
  // 状态指示
  AlertCircle: ErrorCircleRegular,
  AlertOctagon: ErrorCircleRegular,
  AlertTriangle: WarningRegular,
  Info: InfoRegular,
  Loader2: SpinnerIosRegular,
  
  // 文档相关
  FileText: DocumentTextRegular,
  FileType: DocumentRegular,
  FolderOpen: FolderRegular,
  Image: ImageRegular,
  ImageIcon: ImageRegular,
  Table: TableRegular,
  Code: CodeRegular,
  
  // 聊天相关
  MessageSquare: ChatRegular,
  MessageSquarePlus: ChatAddRegular,
  MessageCircle: CommentRegular,
  MessageCircleQuestion: CommentRegular,
  
  // 导航
  ChevronDown: ChevronDownRegular,
  ChevronUp: ChevronUpRegular,
  ChevronRight: ChevronRightRegular,
  ChevronRightIcon: ChevronRightRegular,
  CheckIcon: CheckmarkRegular,
  CircleIcon: CheckmarkCircleRegular,
  Menu: NavigationRegular,
  MenuIcon: NavigationRegular,
  
  // 其他
  BookOpen: BookOpenRegular,
  Brain: BrainCircuitRegular,
  Clock3: ClockRegular,
  Globe: GlobeRegular,
  ExternalLink: LinkRegular,
  Paperclip: AttachRegular,
  Sparkles: SparkleRegular,
  Star: StarRegular,
  Wand2: WandRegular,
  Wrench: WrenchRegular,
  Sun: WeatherSunnyRegular,
  Moon: WeatherMoonRegular,
  Bot: BotRegular,
}

// 直接导出常用图标（便于逐步迁移）
export {
  AddRegular as PlusIcon,
  CheckmarkRegular as CheckIcon,
  CheckmarkCircleRegular as CheckCircle2Icon,
  CopyRegular as CopyIcon,
  DeleteRegular as Trash2Icon,
  DismissRegular as XIcon,
  EditRegular as Edit3Icon,
  ArrowResetRegular as RefreshCwIcon,
  SendRegular as SendIcon,
  SettingsRegular as SettingsIcon,
  ErrorCircleRegular as AlertCircleIcon,
  WarningRegular as AlertTriangleIcon,
  InfoRegular as InfoIcon,
  SpinnerIosRegular as Loader2Icon,
  DocumentTextRegular as FileTextIcon,
  ImageRegular as ImageIconFluent,
  ChatRegular as MessageSquareIcon,
  ChatAddRegular as MessageSquarePlusIcon,
  ChevronDownRegular as ChevronDownIcon,
  ChevronUpRegular as ChevronUpIcon,
  SparkleRegular as SparklesIcon,
  StarRegular as StarIcon,
  AttachRegular as PaperclipIcon,
  GlobeRegular as GlobeIcon,
}

export default Icons
