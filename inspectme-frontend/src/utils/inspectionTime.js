export function derivePeriodFromTime(timeValue) {
  const [hoursRaw, minutesRaw] = String(timeValue || '').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  const totalMinutes = hours * 60 + minutes

  if (totalMinutes >= 360 && totalMinutes <= 720) {
    return 'Morning'
  }

  if (totalMinutes >= 721 && totalMinutes <= 1080) {
    return 'Afternoon'
  }

  return null
}

export function todayAsIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
