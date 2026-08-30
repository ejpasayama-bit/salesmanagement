'use client';

import Link from 'next/link';

export default function PartnerResourcesPage() {
  return (
    <div className="p-10 max-w-4xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/partner" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">紹介・営業用 支援ツール</h1>
      <p className="text-gray-600 mb-8 leading-relaxed">
        案件のご紹介にあたり、お客様へご案内いただくためのパンフレットやヒアリングシートをご用意いたしました。<br />
        自由にダウンロード・印刷して営業活動にお役立てください。
      </p>

      <div className="space-y-8">
        {/* セクション1：資料ダウンロード */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="text-blue-600">📄</span> 営業資料ダウンロード
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
              <h3 className="font-bold text-gray-800 mb-1">事業者様向け 提案用スライド</h3>
              <p className="text-xs text-gray-500 mb-4">お客様へ直接見せながら説明できる公式資料です。（PDF形式）</p>
              <button className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded text-sm font-bold w-full hover:bg-blue-100 transition">
                ダウンロード (準備中)
              </button>
            </div>
            
            <div className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition">
              <h3 className="font-bold text-gray-800 mb-1">事前ヒアリングシート</h3>
              <p className="text-xs text-gray-500 mb-4">お客様の現状課題やご要望を簡単にヒアリングするためのシートです。</p>
              <button className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded text-sm font-bold w-full hover:bg-blue-100 transition">
                ダウンロード (準備中)
              </button>
            </div>
          </div>
        </div>

        {/* セクション2：紹介のステップ */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="text-green-600">💡</span> ご紹介の流れとポイント
          </h2>
          <ol className="list-decimal list-inside space-y-4 text-gray-700 text-sm leading-relaxed mt-4">
            <li>
              <strong className="text-gray-900">ヒアリングと課題の発見：</strong><br />
              「今のホームページはスマホで見やすいですか？」「毎日の業務でExcelや紙での作業に時間を取られていませんか？」といった切り口から、お客様の課題をヒアリングしてください。
            </li>
            <li>
              <strong className="text-gray-900">プランの提示：</strong><br />
              提案用スライドを見せながら、「初期費用15万円でHPと業務改善アプリがセットになる竹プランが一番人気です」とご案内いただくとスムーズです。
            </li>
            <li>
              <strong className="text-gray-900">ダッシュボードからの登録：</strong><br />
              お客様の興味を惹けたら、本システムの「新規案件の登録」から会社名や連絡先、ご希望のプランをご入力ください。
            </li>
            <li>
              <strong className="text-gray-900">当社からのアプローチ：</strong><br />
              ご登録いただいた情報を元に、当社からお客様へ自動で見積りメール（またはご挨拶）が送信されます。その後のクロージングや開発はすべて当社が巻き取ります。
            </li>
          </ol>
        </div>

        {/* セクション3：よくある質問 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
            <span className="text-yellow-600">❓</span> よくある質問（想定QA）
          </h2>
          <div className="space-y-4 mt-4">
            <div>
              <p className="font-bold text-sm text-gray-800">Q. 地方の会社でも対応してもらえますか？</p>
              <p className="text-sm text-gray-600 mt-1">A. はい、全国どこでも完全オンライン（Zoom・メール・LINE等）で対応可能です。ご安心ください。</p>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">Q. 契約後の保守（月額）は何をしてくれるの？</p>
              <p className="text-sm text-gray-600 mt-1">A. サーバーやドメインの維持管理、システムのセキュリティアップデート、軽微なテキスト修正やシステム操作に関するITサポートが含まれます。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}