export function Avatar({ name, small = false }: { name: string, small?: boolean }) {
  return (
    <span className={`avatar ${small ? 'avatar-small' : ''}`} aria-hidden="true">
      {name.replace(/^\+/, '').slice(0, 2).toLocaleUpperCase('ru')}
    </span>
  )
}

const timeFormat = new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' })

export function MessageTime({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp * 1000)
  return <time dateTime={date.toISOString()}>{timeFormat.format(date)}</time>
}
