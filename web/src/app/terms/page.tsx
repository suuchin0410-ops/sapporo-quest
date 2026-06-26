export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gold-light">📜 利用規約</h1>
          <div className="rpg-divider mx-auto mt-3 w-32" />
        </div>

        <div className="rpg-card rounded-2xl p-5">
          <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第1条（適用）</h2>
              <p>
                本規約は、札幌クエスト（以下「本コミュニティ」）が提供するすべてのサービスの利用条件を定めるものです。メンバー登録をもって本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第2条（メンバー登録）</h2>
              <p>
                メンバー登録は、LINE公式アカウントを通じて行います。登録情報は正確かつ最新の内容を入力してください。虚偽の情報による登録が判明した場合、登録を取り消すことがあります。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第3条（禁止事項）</h2>
              <p>メンバーは以下の行為を行ってはなりません。</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-foreground/70">
                <li>他のメンバーへの誹謗中傷・ハラスメント行為</li>
                <li>営利目的の勧誘・宣伝活動</li>
                <li>コミュニティの秩序を乱す行為</li>
                <li>法令または公序良俗に反する行為</li>
                <li>個人情報の不正利用・無断公開</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第4条（ギルド会について）</h2>
              <p>
                ギルド会（イベント）への参加は予約制です。参加をキャンセルする場合は、速やかに手続きを行ってください。無断欠席が続く場合、参加を制限することがあります。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第5条（個人情報の取扱い）</h2>
              <p>
                本コミュニティは、メンバーの個人情報を適切に管理し、コミュニティ運営の目的以外には使用しません。ただし、法令に基づく開示要求があった場合はこの限りではありません。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第6条（退会）</h2>
              <p>
                メンバーは、LINE公式アカウントのブロックまたは運営への連絡により、いつでも退会することができます。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第7条（免責事項）</h2>
              <p>
                本コミュニティは、イベント参加中の事故・トラブル等について一切の責任を負いません。メンバー間のトラブルについても、当事者間での解決をお願いいたします。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-gold-light">第8条（規約の変更）</h2>
              <p>
                本コミュニティは、必要に応じて本規約を変更できるものとします。変更後の規約は、LINE公式アカウントまたはウェブサイトでの通知をもって効力を生じます。
              </p>
            </section>

            <div className="rpg-divider mx-auto mt-4 w-24" />
            <p className="text-center text-xs text-gold-dim/50">
              制定日: 2025年1月1日
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
