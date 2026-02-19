interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Laddar...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4" />
      <p className="text-slate-500">{message}</p>
    </div>
  )
}
