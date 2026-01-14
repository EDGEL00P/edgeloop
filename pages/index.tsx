import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Edgeloop Next.js</title>
        <meta name="description" content="Greenfield Next.js project" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-4">
        <h1 className="text-2xl font-bold">Welcome to Edgeloop</h1>
        {/* ...existing code... */}
      </main>
    </>
  )
}

export default Home