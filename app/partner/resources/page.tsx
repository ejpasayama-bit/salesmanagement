'use client';

import Link from 'next/link';

export default function PartnerResourcesPage() {
  return (
    <div className="p-10 max-w-5xl mx-auto font-sans">
      <div className="mb-6">
        <Link href="/partner" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit transition">
          <span>←</span> ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-800">紹介用素材・ガイドライン</h1>
      <p className="text-gray-600 mb-8 leading-relaxed">
        パートナー様がご紹介活動を行いやすいよう、各種素材やプログラムのルールをご用意しております。<br />
        WebサイトやSNSでのシェア、ご自身のお知り合いへの紹介など、ご自身のスタイルに合わせて自由にご活用ください。
      </p>

      <div className="space-y-8">
        
        {/* システム概要・報酬ルール */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800 flex items-center gap-2">
            <span className="text-blue-600">💰</span> パートナー制度・報酬について
          </h2>
          <div className="text-gray-700 text-sm space-y-3 mt-4">
            <p>当プログラムでは、ご紹介いただいたクライアント様が成約に至った場合、規定の紹介報酬をお支払いいたします。</p>
            <ul className="list-disc list-inside bg-gray-50 p-4 rounded text-gray-600 space-y-2">
              <li><strong>対象条件:</strong> ダッシュボードの「新規案件の登録」からご登録いただき、成約に至った場合。</li>
              <li><strong>成約報酬:</strong> 規定の報酬額（ご登録のプランや契約内容により異なります）</li>
              <li><strong>お支払日:</strong> 毎月末日締め、翌月末日にお振込み</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">※具体的な報酬額につきましては、個別のご契約条件や利用規約をご確認ください。</p>
          </div>
        </section>

        {/* 自由活用素材（ヒアリングシート等） */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800 flex items-center gap-2">
            <span className="text-green-600">📋</span> ヒアリングシート・案内資料
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            見込み客の方から現状の課題やご要望を引き出したり、サービスを簡単に説明するための資料です。対面やオンライン通話などでご活用いただけます。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* チラシ (PDF/PNG) */}
            <div className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">サービス案内チラシ</h3>
                <p className="text-xs text-gray-500 mb-4">お客様へのお渡しや、SNSでのシェアに使える1枚モノのチラシです。</p>
              </div>
              <div className="flex gap-2">
                <a 
                  href="/materials/flyer.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-50 text-green-700 border border-green-200 px-2 py-2 rounded text-xs font-bold text-center block hover:bg-green-100 transition flex-1"
                >
                  PDF版
                </a>
                <a 
                  href="/materials/flyer.png" 
                  download
                  className="bg-green-50 text-green-700 border border-green-200 px-2 py-2 rounded text-xs font-bold text-center block hover:bg-green-100 transition flex-1"
                >
                  画像(PNG)版
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">ヒアリングシート (PDF)</h3>
                <p className="text-xs text-gray-500 mb-4">お客様の課題を整理するためのシンプルなテンプレートです。</p>
              </div>
              <a 
                href="/materials/hearing-sheet.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded text-sm font-bold text-center block hover:bg-green-100 transition"
              >
                PDFをダウンロード
              </a>
            </div>
            
            <div className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">サービス案内スライド (PDF)</h3>
                <p className="text-xs text-gray-500 mb-4">サービスの概要とプラン内容をまとめた公式資料です。</p>
              </div>
              <a 
                href="/materials/service-guide.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded text-sm font-bold text-center block hover:bg-green-100 transition"
              >
                PDFをダウンロード
              </a>
            </div>
          </div>
        </section>

        {/* Web・ブログ用バナー */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800 flex items-center gap-2">
            <span className="text-purple-600">🖼️</span> Web紹介用バナー
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            ご自身のブログやWebサイトに設置いただける公式バナー画像です。画像を保存するか、リンク先としてご利用ください。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-4">
              <p className="text-sm font-bold text-gray-700 mb-2">横長バナー (728 × 90)</p>
              <div className="w-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 rounded overflow-hidden h-24">
                <img src="/materials/banner-728x90.png" alt="728x90 バナー" className="object-contain w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs absolute pointer-events-none">※画像準備中</span>
              </div>
              <a 
                href="/materials/banner-728x90.png" 
                download
                className="text-blue-600 text-xs font-bold hover:underline block text-right"
              >
                画像を保存する
              </a>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm font-bold text-gray-700 mb-2">レクタングル (300 × 250)</p>
              <div className="w-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 rounded overflow-hidden h-40">
                <img src="/materials/banner-300x250.png" alt="300x250 バナー" className="object-contain w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs absolute pointer-events-none">※画像準備中</span>
              </div>
              <a 
                href="/materials/banner-300x250.png" 
                download
                className="text-blue-600 text-xs font-bold hover:underline block text-right"
              >
                画像を保存する
              </a>
            </div>
          </div>
        </section>

        {/* ガイドライン・規約 */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800 flex items-center gap-2">
            <span className="text-gray-600">⚖️</span> ガイドライン・利用規約
          </h2>
          <div className="text-gray-600 text-sm space-y-4 mt-4">
            <p>
              ご紹介活動を行うにあたり、スパム行為の禁止やブランドの正しい使い方など、基本的なルールを設けております。
              お互いに気持ちよく活動できるよう、事前にご一読をお願いいたします。
            </p>
            <div className="bg-gray-50 p-4 rounded border">
              <ul className="list-disc list-inside space-y-2">
                <li>公序良俗に反するサイトや媒体での紹介はご遠慮ください。</li>
                <li>「必ず儲かる」「無料」など、事実と異なる過度な表現はお控えください。</li>
                <li>スパムメールや迷惑行為となるアプローチは禁止しております。</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a href="/materials/terms.pdf" target="_blank" className="text-blue-600 hover:underline font-bold text-sm flex items-center gap-1">
                📄 パートナー利用規約 (PDF)
              </a>
              <a href="/materials/clients_terms.pdf" target="_blank" className="text-blue-600 hover:underline font-bold text-sm flex items-center gap-1">
                📄 クライアント向け利用規約 (PDF)
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}