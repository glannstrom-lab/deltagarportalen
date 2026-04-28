import { Search } from '@/components/ui/icons'

export function SearchBar() {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={20} />
      <input
        type="text"
        placeholder="Sök..."
        className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-none shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  )
}
