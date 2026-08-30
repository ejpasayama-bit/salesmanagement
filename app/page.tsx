import { redirect } from 'next/navigation';

export default function Home() {
  // トップページにアクセスされたら、強制的にログイン画面へ飛ばす
  redirect('/login');
}