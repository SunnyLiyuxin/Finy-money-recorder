import {
  UtensilsCrossed, Coffee, Bus, ShoppingBag, ShoppingCart, Home,
  Gamepad2, HeartPulse, BookOpen, Users, FileText, PawPrint, MoreHorizontal,
  Wallet, Gift, Briefcase, TrendingUp, RotateCcw, Package,
  MessageCircle, Banknote, CreditCard, Plus, ListChecks, BarChart3,
  PiggyBank, Settings as SettingsIcon, Camera, X, ChevronLeft, ChevronRight,
  ChevronDown, Check, Trash2, Download, Upload, ArrowLeftRight, Clock,
  Calendar, TrendingDown, TrendingUp as TrendingUpIcon, Target, Info,
} from 'lucide-react'

// 分类图标
export const CATEGORY_ICONS = {
  food: UtensilsCrossed,
  coffee: Coffee,
  transport: Bus,
  shopping: ShoppingBag,
  grocery: ShoppingCart,
  housing: Home,
  entertainment: Gamepad2,
  medical: HeartPulse,
  education: BookOpen,
  social: Users,
  bills: FileText,
  pets: PawPrint,
  other: MoreHorizontal,
  salary: Wallet,
  bonus: Gift,
  parttime: Briefcase,
  investment: TrendingUp,
  refund: RotateCcw,
  redpacket: Package,
  other_income: MoreHorizontal,
}

// 账户图标
export const ACCOUNT_ICONS = {
  wechat: MessageCircle,
  alipay: Wallet,
  cash: Banknote,
  debit: CreditCard,
  credit: CreditCard,
  other_account: Wallet,
}

// 通用 UI 图标
export const UI_ICONS = {
  add: Plus,
  close: X,
  back: ChevronLeft,
  forward: ChevronRight,
  down: ChevronDown,
  check: Check,
  trash: Trash2,
  download: Download,
  upload: Upload,
  transfer: ArrowLeftRight,
  clock: Clock,
  calendar: Calendar,
  trendingDown: TrendingDown,
  trendingUp: TrendingUpIcon,
  target: Target,
  info: Info,
  camera: Camera,
  settings: SettingsIcon,
}

// 底部 Tab 图标
export const TAB_ICONS = {
  'tab-record': Plus,
  'tab-records': ListChecks,
  'tab-stats': BarChart3,
  'tab-accounts': Wallet,
  'tab-budget': PiggyBank,
}

export function CategoryIcon({ icon, size = 22, strokeWidth = 2, ...rest }) {
  const Cmp = CATEGORY_ICONS[icon] || MoreHorizontal
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />
}

export function AccountIcon({ icon, size = 22, strokeWidth = 2, ...rest }) {
  const Cmp = ACCOUNT_ICONS[icon] || Wallet
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />
}

export function TabIcon({ icon, size = 22, strokeWidth = 2, ...rest }) {
  const Cmp = TAB_ICONS[icon] || Plus
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />
}
