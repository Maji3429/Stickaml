import { redirect } from 'next/navigation';

/**
 * トップページからYAMLビジュアライザーへの自動リダイレクト
 * ユーザーがルートパス（/）にアクセスすると自動的にYAMLビジュアライザーページに移動します
 */
export default function Home() {
  // ルートパスへのアクセスをYAMLビジュアライザーにリダイレクト
  redirect('/yamlvisualizer');
}
