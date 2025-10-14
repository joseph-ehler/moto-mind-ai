import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to vehicles page (main app entry)
  redirect('/vehicles')
}
