export function CalendarWidget() {
  const days = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön']
  const dates = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null]
  ]

  const today = 19

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Februari 2026</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(day => (
          <div key={day} className="text-xs text-slate-400 py-1">{day}</div>
        ))}
        {dates.flat().map((date, i) => (
          <div
            key={i}
            className={`text-sm py-2 rounded-lg ${
              date === today 
                ? 'bg-primary text-white' 
                : date 
                  ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' 
                  : ''
            }`}
          >
            {date}
          </div>
        ))}
      </div>
    </div>
  )
}
