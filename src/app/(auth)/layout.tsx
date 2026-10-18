export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ts-app-layout is-full">
      <div className="ts-content">{children}</div>
    </div>
  )
}
