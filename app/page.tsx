import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to a default tenant or show platform homepage
  redirect('/demo/webinar/advanced-react-patterns')
}
