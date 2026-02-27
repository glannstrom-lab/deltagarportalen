interface CalendarWidgetProps {
  activeDays?: number[]  // Dagar i månaden med aktivitet (1-31)
}

export function CalendarWidget({ activeDays = [] }: CalendarWidgetProps) {
  const days = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön']
  
  // Hämta aktuellt datum
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const today = now.getDate()
  
  // Formatera månadsnamn på svenska
  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ]
  const monthName = monthNames[currentMonth]
  
  // Beräkna antal dagar i månaden
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  // Beräkna vilken veckodag månaden börjar (0 = Söndag, 1 = Måndag, etc.)
  // Justera så att Måndag är första dagen (0)
  let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  
  // Skapa datum-arrayer för varje vecka
  const dates: (number | null)[][] = []
  let currentWeek: (number | null)[] = []
  
  // Fyll med tomma platser för dagar före månadens start
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null)
  }
  
  // Fyll i dagarna i månaden
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    
    // Om veckan är full (7 dagar), lägg till i dates och starta ny vecka
    if (currentWeek.length === 7) {
      dates.push(currentWeek)
      currentWeek = []
    }
  }
  
  // Fyll ut sista veckan med tomma platser om nödvändigt
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    dates.push(currentWeek)
  }
  
  // Hjälpfunktion för att bestämma CSS-klass för en dag
  const getDayClassName = (date: number | null): string => {
    if (date === null) return ''
    
    const isToday = date === today
    const isActive = activeDays.includes(date)
    
    const baseClasses = 'text-sm py-2 rounded-lg relative'
    
    if (isToday && isActive) {
      // Dagens datum med aktivitet - speciell stil
      return `${baseClasses} bg-primary text-white font-semibold ring-2 ring-primary ring-offset-2`
    }
    
    if (isToday) {
      // Endast dagens datum
      return `${baseClasses} bg-primary text-white font-semibold`
    }
    
    if (isActive) {
      // Aktiv dag (men inte idag)
      return `${baseClasses} text-slate-700 hover:bg-slate-100 cursor-pointer font-medium`
    }
    
    // Vanlig dag
    return `${baseClasses} text-slate-700 hover:bg-slate-100 cursor-pointer`
  }
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">{monthName} {currentYear}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(day => (
          <div key={day} className="text-xs text-slate-400 py-1">{day}</div>
        ))}
        {dates.flat().map((date, i) => (
          <div
            key={i}
            className={getDayClassName(date)}
          >
            {date}
            {date && activeDays.includes(date) && date !== today && (
              <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
