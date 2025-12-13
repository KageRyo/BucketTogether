interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  isFluid?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isFluid = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
}: ButtonProps) {
  const variantClass = {
    primary: 'is-primary',
    secondary: 'is-secondary',
    outlined: 'is-outlined',
    ghost: 'is-ghost',
  }[variant]

  const sizeClass = {
    small: 'is-small',
    medium: '',
    large: 'is-large',
  }[size]

  const classes = [
    'ts-button',
    variantClass,
    sizeClass,
    isFluid ? 'is-fluid' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && (
        <span className="ts-icon is-spinning is-spinner-icon"></span>
      )}
      {children}
    </button>
  )
}
