export default async function Home() {
  const data = await fetch('https://api.example.com/user')
  const user = await data.json()

  return <p>Welcome, {user.name}!</p>
}
