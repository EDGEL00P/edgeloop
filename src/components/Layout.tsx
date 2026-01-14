import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-lg">Edgeloop</h1>
      </header>
      <main className="p-4">{children}</main>
      <footer className="bg-gray-200 text-gray-800 p-4 text-center">
        © {new Date().getFullYear()} Edgeloop
      </footer>
    </>
  )
}