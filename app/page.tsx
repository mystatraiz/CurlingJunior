import { redirect } from 'next/navigation';

/** Le middleware redirige vers /login si non authentifié. */
export default function Home() {
  redirect('/dashboard');
}
