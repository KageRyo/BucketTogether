interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  isLink?: boolean
}

export function Card({ children, className = '', onClick, isLink = false }: CardProps) {
  const classes = [
    'ts-box',
    isLink ? 'is-link' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  isDense?: boolean
  isCenterAligned?: boolean
}

export function CardContent({ children, isDense = false, isCenterAligned = false }: CardContentProps) {
  const classes = [
    'ts-content',
    isDense ? 'is-dense' : '',
    isCenterAligned ? 'is-center-aligned' : '',
  ].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
