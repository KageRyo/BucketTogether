export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="ts-app-layout is-full">
      <main className="ts-content">
        {children}
      </main>
    </div>
  )
}
