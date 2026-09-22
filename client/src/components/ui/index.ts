// UI Components
export { Logo } from './Logo'
export { Progress } from './Progress'
export { StatCard } from './StatCard'
export { CalendarWidget } from './CalendarWidget'
export { ProgressBars } from './ProgressBars'
export { CircleChart } from './CircleChart'
export { LineChart } from './LineChart'
export { BarChart } from './BarChart'
// export { QuickActions } from './QuickActions'  // Removed - not used
export { SearchBar } from './SearchBar'

// Page Layout Components
export { PageCard, PageCardLink, PageCardGrid } from './PageCard'

// Skeletons
export {
  Skeleton,
  CardSkeleton,
  TextSkeleton,
  DashboardWidgetSkeleton,
  DashboardGridSkeleton,
  ListSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  CVBuilderSkeleton,
  JobSearchSkeleton,
  ArticleSkeleton,
  TableSkeleton,
} from './Skeleton'

// Images
export {
  Image,
  Picture,
  Avatar,
} from './Image'

// New Design System Components
export {
  Button,
  IconButton,
  TouchButton,
  CloseButton,
} from './Button'

export {
  Card,
  CardHeader,
  CardFooter,
  CardSection,
  StatCard as CardStat,
  InfoCard,
  ActionCard,
  SkeletonCard,
} from './Card'

export {
  Input,
  PasswordInput,
  Textarea,
  Select,
  Checkbox,
  Toggle,
} from './Input'

export {
  LoadingState,
  Spinner,
  Skeleton as LoadingSkeleton,
  SkeletonCard as LoadingSkeletonCard,
  SkeletonGrid,
  SkeletonList,
  ErrorState,
  PageLoading,
  InlineLoading,
  ContentPlaceholder,
} from './LoadingState'

export {
  EmptyState,
  EmptyList,
  EmptySearch,
  EmptyWidget,
  IllustratedEmptyState,
} from './EmptyState'

export {
  ConfirmDialogProvider,
  useConfirmDialog,
  confirmDialog,
} from './ConfirmDialog'

// Re-export types
//
// 2026-09-22: `ButtonProps`/`CardProps`/`InputProps` togs bort härifrån —
// interfacen i Button.tsx/Card.tsx/Input.tsx är inte `export`erade (de är
// lokala till varje fil), så de här raderna kunde aldrig typcheckats grönt.
// En sökning gav noll importörer av dem via den här barreln, så de var
// dessutom dödkod: ingen förlitade sig på att kunna importera typerna
// härifrån.
