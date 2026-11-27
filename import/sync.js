// 求人送付ツール：HRMOS・Talentioのエージェント画面で、ブックマーク「求人を更新」から読み込まれる
// （管理画面の「HRMOS・Talentio更新」で登録するブックマークが、送り先と合言葉を window.__JOBSYNC に入れてからこれを読む）
(async () => {
const JOB_RULES = [
  // 経営層
  [/CFO(?!室|直下|直轄|直属|配下)|最高財務責任者/, '経営・管理・人事', 'CFO'],
  [/(CEO|COO)(?!室|直下|直轄|直属|配下)|最高(経営|執行)責任者|代表取締役|経営者候補|社長候補/, '経営・管理・人事', '経営者・CEO・COO'],
  [/(CTO|CIO|CDO|CISO|VPoE)(?!室|直下|直轄|直属|配下)|最高(技術|情報|デジタル)責任者/, '経営・管理・人事', 'CXO（IT関連）'],
  [/(CHRO|CMO|CxO|CRO|CSO|CPO)(?!室|直下|直轄|直属|配下)|執行役員|取締役/, '経営・管理・人事', 'その他CXO'],
  // 士業
  [/弁護士/, 'その他', '弁護士'],
  [/公認会計士|会計士/, 'コンサルタント・専門職', '公認会計士'],
  [/税理士/, 'コンサルタント・専門職', '税理士'],
  // 金融・投資・M&A
  [/仲介/, '金融', 'M&A（仲介）'],
  [/ベンチャーキャピタル|キャピタリスト|(?<![A-Za-z])VC(?![A-Za-z])|ＶＣ/, '金融', 'VC業務'],
  [/プライベート・?エクイティ|(?<![A-Za-z])PE(?![A-Za-z])|バイアウト|投資(担当|プロフェッショナル|チーム|部)|ファンド/, '金融', 'PE業務'],
  [/ストラクチャード|証券化/, '金融', 'ストラクチャードファイナンス'],
  [/プロジェクトファイナンス/, '金融', 'プロジェクトファイナンス'],
  [/M&A|Ｍ＆Ａ|M＆A|ＦＡＳ|\bFAS\b|ディール|バリュエーション|\bPMI\b|事業承継|財務アドバイザリー|トランザクション|セルサイド|バイサイド/, 'コンサルタント・専門職', 'M&A（FA）'],
  // コンサル（種類別）。「コンサルティング営業」「導入コンサル」はコンサル職ではないので先に分ける
  [/^(?!.*(インサイドセールス|カスタマーサクセス|キャリア(アドバイザー|コンサルタント))).*(コンサルティング(営業|セールス)|コンサル(型|ティブ)?(営業|セールス)|ソリューション(営業|セールス))/, '営業・サービス', '法人営業'],
  [/導入(支援)?コンサル|オンボーディング/, '営業・サービス', 'カスタマーサクセス'],
  [/事業再生|ターンアラウンド|リストラクチャリング/, 'コンサルタント・専門職', '事業再生コンサルタント'],
  [/セキュリティ.*(コンサル|アドバイザ)|サイバー.*コンサル/, 'コンサルタント・専門職', 'セキュリティコンサルタント'],
  [/(財務|会計|経理|IFRS|税務|ファイナンス).*(コンサル|アドバイザ)|(コンサル|アドバイザ).*(財務|会計|IFRS)/, 'コンサルタント・専門職', '財務・会計コンサルタント'],
  [/(組織|人事|人材|チェンジ|HR).*(コンサル|変革)/, 'コンサルタント・専門職', '組織・人事コンサルタント'],
  [/(マーケティング|ブランド|CX|顧客体験).*コンサル/, 'コンサルタント・専門職', 'マーケティングコンサルタント'],
  [/(物流|SCM|サプライチェーン|ロジスティクス).*コンサル/, 'コンサルタント・専門職', '物流コンサルタント'],
  [/リスク.*コンサル|リスクアドバイザ|ガバナンス.*コンサル/, 'コンサルタント・専門職', 'リスクコンサルタント'],
  [/戦略|ストラテジ|Strategy|経営コンサル/i, 'コンサルタント・専門職', '戦略コンサルタント', /コンサル|Consult|ファーム/i],
  [/IT|ＩＴ|DX|ＤＸ|デジタル|テクノロジー|システム|SAP|ERP|クラウド|データ|AI|ＡＩ|Salesforce|テクノロジ/, 'コンサルタント・専門職', 'ITコンサルタント', /コンサル|Consult|アドバイザ/],
  [/業務改革|BPR|業務(改善|変革)|PMO|オペレーション/, 'コンサルタント・専門職', '業務プロセスコンサルタント', /コンサル|Consult|PMO/],
  [/キャリア(アドバイザー|コンサルタント|カウンセラー)|(?<![A-Za-z])CA(?![A-Za-z])|CA(or|兼|\/|・)RA|転職支援|両面/, '営業・サービス', 'キャリアコンサルタント'],
  [/コンサル|Consultant|アドバイザリー/, 'コンサルタント・専門職', 'その他'],
  // IT・エンジニア
  [/PdM|プロダクトマネ[ーー]?ジャ|プロダクトオーナー|Product Manager/i, 'IT・ゲーム・デザイン', 'PdM'],
  [/エンジニアリングマネ|(?<![A-Za-z])EM(?![A-Za-z])|VPoE/, 'IT・ゲーム・デザイン', 'エンジニアリングマネージャー'],
  [/データサイエンティスト|データサイエンス|Data Scientist/i, 'IT・ゲーム・データ', 'データサイエンティスト'],
  [/機械学習|MLエンジニア|AIエンジニア|ＡＩエンジニア|LLM|生成AI.*(エンジニア|開発)|AI.*(開発|研究)/, 'IT・ゲーム・デザイン', 'AIエンジニア'],
  [/セールスエンジニア|プリセールス|ソリューションアーキテクト|ソリューションエンジニア/, 'IT・ゲーム・デザイン', 'プリセールス・セールスエンジニア'],
  [/セキュリティ/, 'IT・ゲーム・デザイン', 'セキュリティエンジニア', /エンジニア|SOC|CSIRT|セキュリティ/],
  [/ネットワーク/, 'IT・ゲーム・デザイン', 'ネットワークエンジニア'],
  [/インフラ|SRE|サーバ|クラウドエンジニア|基盤エンジニア/, 'IT・ゲーム・デザイン', 'サーバーエンジニア(構築・運用)', /エンジニア|SRE|サーバ|クラウド|基盤|構築|運用|Engineer/i],
  [/データエンジニア|データ基盤|DBA|データベース/, 'IT・ゲーム・デザイン', 'データベースエンジニア'],
  [/社内SE|情報システム|情シス|コーポレートIT|コーポレートエンジニア/, 'IT・ゲーム・デザイン', '情報システム・社内SE'],
  [/QA|品質保証|テストエンジニア/, 'IT・ゲーム・デザイン', 'その他(ローカリゼーション・QA等)'],
  [/デザイナー|UI|UX/, 'IT・ゲーム・デザイン', 'Webデザイナー・UI/UXデザイナー'],
  [/テクニカルサポート|運用保守|保守運用|ヘルプデスク.*エンジニア|監視/, 'IT・ゲーム・デザイン', '運用・保守・監視・テクニカルサポート'],
  [/(プロジェクトマネ|(?<![A-Za-z])PM(?![A-Za-z])|(?<![A-Za-z])PL(?![A-Za-z])(?!責任|管理)|PJM|プロジェクトリーダー)/, 'IT・ゲーム・デザイン', 'PM・PL(Web・オープン系)', /エンジニア|開発|システム|IT|SI|PM|PL|PJM|プロジェクト/],
  [/組込|組み込み|制御|ファームウェア|汎用機|メインフレーム/, 'IT・ゲーム・デザイン', 'SE(制御・組み込み系・汎用系)'],
  [/エンジニア|(システム|ソフトウェア|アプリ|Web|プロダクト|サービス|ゲーム)開発|開発エンジニア|プログラマ|(?<![A-Za-z])SE(?![A-Za-z])|フロントエンド|バックエンド|アプリ(ケーション)?エンジニア|ソフトウェア|Engineer|Developer|テックリード|Tech ?Lead|アーキテクト|Architect/i, 'IT・ゲーム・デザイン', 'SE(Web・オープン系)'],
  [/ディレクター|プロデューサー|Webディレク/, 'IT・ゲーム・デザイン', 'Webプロデューサー・ディレクター', /Web|ウェブ|サイト|コンテンツ|デジタル|ディレクター/],
  [/編集|ライター|ライティング|コンテンツ/, 'IT・ゲーム・デザイン', 'Webコンテンツ企画・編集・ライティング'],
  // 管理部門
  [/労務|給与/, '経営・管理・人事', '人事（労務）'],
  [/人事制度|制度企画|組織開発|人材開発|人材育成|育成|研修|エンゲージメント/, '経営・管理・人事', '制度企画・組織開発'],
  [/採用(担当|人事|マネ|リーダー|責任者|企画|広報|アシスタント|チーム|オペレーション|コーディネーター)|(新卒|中途|キャリア)採用|リクルーター|HRBP|HRビジネスパートナー|人事(部|担当|責任者|企画|リーダー|マネ|オープン|アシスタント|スペシャリスト|\(|\/|$|\s)|【人事】|^人事|Head of HR|People/i, '経営・管理・人事', '人事（採用）'],
  [/管理会計|予実|FP&A|FP＆A/, '経営・管理・人事', '管理会計'],
  [/税務/, '経営・管理・人事', '税務'],
  [/経理|決算(?!賞与)|会計|アカウンティング|Accounting/i, '経営・管理・人事', '経理（財務会計）'],
  [/財務|ファイナンス|資金/, '経営・管理・人事', '財務'],
  [/内部監査|内部統制|監査/, '経営・管理・人事', '内部監査・内部統制'],
  [/法務|コンプライアンス|リーガル|Legal/, '経営・管理・人事', '法務・コンプライアンス'],
  [/知財|知的財産|特許/, '経営・管理・人事', '知的財産・特許'],
  [/(?<![A-Za-z])IR(?![A-Za-z])|ＩＲ|インベスター/, '経営・管理・人事', 'IR'],
  [/(CEO|COO|CFO|社長)室|Chief of Staff|戦略推進室|経営推進/i, '経営・管理・人事', '経営企画・経営戦略'],
  [/Talent Acquisition|リクルーティング(担当|チーム)/i, '経営・管理・人事', '人事（採用）'],
  [/リスク(管理|マネジメント)|コンプライアンス/, '経営・管理・人事', '法務・コンプライアンス'],
  [/総務|庶務|ファシリティ|秘書|Executive Assistant/i, '経営・管理・人事', '総務'],
  [/購買|調達/, '経営・管理・人事', '購買・資材調達'],
  [/広報|(?<![A-Za-z])PR(?![A-Za-z])|ＰＲ|宣伝|ブランディング/, 'マーケ・広告', '広報・PR・広告宣伝'],
  [/経営企画|経営戦略|経営管理|社長室/, '経営・管理・人事', '経営企画・経営戦略'],
  [/新規事業|事業開発|BizDev|Business ?Development|ビジネスデベロップメント|アライアンス|事業推進|Partnership|GTM|(ビジネス|事業|産業共創)プロデューサー|Business Producer/i, '経営・管理・人事', '新規事業企画・事業開発'],
  [/事業企画|事業戦略|事業統括|事業責任者|事業部長/, '経営・管理・人事', '事業企画・事業統括'],
  // 営業・CS
  [/インサイドセールス|内勤営業|(?<![A-Za-z])IS(?![A-Za-z])/, '営業・サービス', 'インサイドセールス・内勤営業'],
  [/カスタマーサクセス|(?<![A-Za-z])CS(?![A-Za-z])|Customer Success/i, '営業・サービス', 'カスタマーサクセス'],
  [/カスタマーサポート|ヘルプデスク|コールセンター|コンタクトセンター/, '営業・サービス', 'カスタマーサポート・ヘルプデスク'],
  [/営業企画|セールスイネーブルメント|営業推進/, '営業・サービス', '営業企画'],
  [/代理店|パートナーセールス|パートナー営業/, '営業・サービス', '代理店営業・アライアンス'],
  [/海外営業|グローバル営業/, '営業・サービス', '海外営業'],
  [/個人営業|リテール営業|ライフプランナー|FP\b|ファイナンシャルプランナー/, '営業・サービス', '個人営業'],
  [/営業事務|アシスタント|事務/, '営業・サービス', '営業事務・アシスタント'],
  [/リクルーティングアドバイザー|(?<![A-Za-z])RA(?![A-Za-z])|法人営業|営業|セールス|Sales(?!force)|アカウントエグゼクティブ|アカウントマネ|(?<![A-Za-z])AE(?![A-Za-z])|(?<![A-Za-z])FS(?![A-Za-z])|フィールドセールス/i, '営業・サービス', '法人営業'],
  // マーケ
  [/SEO|広告運用|Web広告|運用型広告|デジタルマーケ|グロース/, 'マーケ・広告', 'Web広告運用・SEO'],
  [/商品企画|商品開発|プロダクト企画|MD/, 'マーケ・広告', '商品企画・商品開発'],
  [/リサーチ|アナリスト|データ分析|分析/, 'マーケ・広告', 'リサーチ・データ分析'],
  [/マーケ|Marketing|CRM|ブランドマネージャー/i, 'マーケ・広告', 'マーケティング'],
  // 「人事」「採用」「HR」の語だけなら、営業・CS・マーケより後で人事にする（HR領域の営業などを人事にしない）
  [/人事|採用|HR(?![A-Za-z])/, '経営・管理・人事', '人事（採用）'],
  // 不動産・建設
  [/施工管理/, '不動産・建設', '施工管理'],
  [/用地|仕入/, '不動産・建設', '用地仕入れ'],
  [/アセットマネ|(?<![A-Za-z])AM(?![A-Za-z])/, '不動産・建設', 'アセットマネジメント'],
  [/プロパティマネ/, '不動産・建設', 'プロパティマネジメント'],
  [/不動産|開発プロジェクト|まちづくり/, '不動産・建設', '不動産企画・不動産開発'],
  [/(機械|電気|回路|半導体|構造|建築|ハードウェア|LSI)設計|設計者/, '機械・電気・電子・半導体', '設計'],
  [/物流|ロジスティクス|SCM/, '経営・管理・人事', '物流企画・物流管理'],
  [/講師|トレーナー/, 'コンサルタント・専門職', '講師・トレーナー'],
  [/店長|店舗/, '営業・サービス', '店舗管理・店舗運営'],
  [/企画/, '経営・管理・人事', '事業企画・事業統括'],
];
// 第4要素（あれば）は「この語も含むときだけ当てる」条件
const jobText_ = (title, sub) => [title, sub].filter(Boolean).join(' ').normalize('NFKC')
  .replace(/[^\s|｜/／、,・※（）()【】\[\]]{0,12}(出身|経験)者?(歓迎|優遇|尚可|活躍)/g, ' ') // 「戦略コンサル出身者歓迎」などで職種を決めない
  .replace(/ビジネスセグメント[_＿]?[^\s】\]]*/g, ' ').replace(/(人事|HR|採用|人材|転職|キャリア|医療|福祉|介護)(労務)?(領域|サービス|事業|テック|Tech|業界|SaaS|プラットフォーム|メディア|ドメイン)/gi, ' ') // 「何を扱う会社か」で職種を誤判定しない
  .replace(/※\s*(経験者|ポテンシャル|中途)採用|\((経験者|ポテンシャル|中途|キャリア)採用\)|(経験者|ポテンシャル|即戦力|通年|積極)採用|(合わせ|応じ)て?採用|(20\d\d年度?)?新卒採用\s*(ビジネス職|本選考|エントリー)|採用(Meetup|ミートアップ|イベント|説明会|セミナー)/gi, ' '); // 募集区分の「採用」
function classifyJob(title, sub, company) {
  // 求人名だけで決まればそれを使う。決まらないときだけ、ATSの部署・職種欄も足して判定する（部署名に引っぱられないように）
  const hit = t => {
    for (const [re, type, detail, need] of JOB_RULES) {
      if (re.test(t) && (!need || need.test(t))) return [type === 'IT・ゲーム・データ' ? 'IT・ゲーム・デザイン' : type, detail];
    }
    return null;
  };
  // 【会社名・部署名】などの見出し部分を外した求人名 → 求人名全体 → 部署・職種欄も足す、の順に試す
  const core = String(title || '').replace(/[【\[［][^】\]］]*[】\]］]/g, ' ').trim();
  const r = (core && core !== title ? hit(jobText_(core, '')) : null) || hit(jobText_(title, '')) || (sub ? hit(jobText_(title, sub)) : null);
  if (r) return r;
  const c = String(company || '').normalize('NFKC');
  // コンサル会社の求人は、求人名に「コンサル」がなくてもコンサル職として種類を見る（例：「デジタル戦略ユニット」）
  if (/コンサルティング|コンサルタンツ|経営研究所|総研|総合研究所|FAS|アドバイザリー/.test(c)) return hit(jobText_(title, 'コンサル')) || ['コンサルタント・専門職', 'その他'];
  return ['', ''];
}

  // ===== 画面右下の進み具合 =====
  const box = document.getElementById('__jobsync') || document.body.appendChild(Object.assign(document.createElement('div'), { id: '__jobsync' }));
  box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;width:340px;background:#fff;color:#222;border:1px solid #d0d7e2;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.25);font:13px/1.6 -apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;padding:14px 16px';
  const ui = (title, msg, pct, done) => {
    box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">${title}</b>${done ? '<button id="__jsx" style="border:0;background:none;font-size:18px;cursor:pointer;color:#888">×</button>' : ''}</div>
      <div style="margin:6px 0 8px;white-space:pre-wrap">${msg}</div>
      ${pct == null ? '' : `<div style="height:6px;background:#eef1f5;border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.max(2, Math.min(100, pct))}%;background:#1a73e8"></div></div>`}`;
    const x = document.getElementById('__jsx'); if (x) x.onclick = () => box.remove();
  };
  const CFG = window.__JOBSYNC || {};
  if (window.__jobsyncRunning) { ui('求人の更新', 'すでに実行中です。終わるまでお待ちください。', null, false); return; }
  if (!CFG.exec || !CFG.key) { ui('求人の更新', 'ブックマークの設定が正しくありません。管理画面の「HRMOS・Talentio更新」から登録し直してください。', null, true); return; }
  const host = location.host;
  const SRC = /hrmos\.co$/.test(host) && location.pathname.startsWith('/agent') ? 'HRMOS' : /talentio\.com$/.test(host) ? 'TALENTIO' : /^agent\.herp\.cloud$/.test(host) ? 'HERP' : /(^|\.)agent\.persona-ats\.com$/.test(host) ? 'PERSONA' : /^ats\.jobcan\.jp$/.test(host) ? 'JOBCAN' : /^manager\.snar\.jp$/.test(host) && location.pathname.startsWith('/agent') ? 'SONAR' : /^ats\.hrtech\.rikunabi\.com$/.test(host) && location.pathname.startsWith('/agent') ? 'RIKUNABI' : /^partner\.geekly\.jp$/.test(host) ? 'GEEKLY' : /(^|\.)career-cloud\.asia$/.test(host) && location.pathname.startsWith('/mid/employment-agency') ? 'KANRI' : '';
  if (!SRC) { ui('求人の更新', 'HRMOS・Talentio・HERP・PERSONA・ジョブカン・sonar・リクナビHRTech・ギークリー・かんりくんのエージェント画面（ログイン後）で押してください。', null, true); return; }
  window.__jobsyncRunning = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const PREFS = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
  const md = t => String(t || '').replace(/\r/g, '')
    .replace(/^#{1,6}\s*(.+?)\s*$/gm, '【$1】')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1 $2')
    .replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1$2')
    .replace(/^ (?=\S)/gm, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  const fmtDate = s => { if (!s) return ''; const d = new Date(s); const j = new Date(d.getTime() + 9 * 3600e3); return `${j.getUTCFullYear()}/${String(j.getUTCMonth() + 1).padStart(2, '0')}/${String(j.getUTCDate()).padStart(2, '0')}`; };
  const today = fmtDate(new Date().toISOString());
  const post = async body => {
    for (let a = 1; a <= 3; a++) {
      try {
        const r = await fetch(CFG.exec, { method: 'POST', credentials: 'omit', body: JSON.stringify(Object.assign({ action: 'bulkImport', key: CFG.key, source: SRC }, body)) });
        const d = await r.json();
        if (d.error) throw new Error(d.error);
        return d;
      } catch (e) { if (a === 3) throw e; await sleep(3000 * a); }
    }
  };

  // ===== HRMOS：一覧の中身ごと取れるので、全件を作り直す（2〜3分） =====
  async function runHrmos() {
    const T = 'HRMOSの求人を更新中';
    const EMP = { FULL: '正社員', CONT: '契約社員', PART: 'アルバイト・パート', TEMP: '派遣社員', OTSR: '業務委託', INTN: 'インターン', NWGR: '新卒' };
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','Insurance__c','PassiveSmokingPreventionMeasures__c',
      'EmploymentPeriodDetails__c','TrialPeriod__c','SelectionProcess__c','InformationUpdateDate__c',
      'HRMOS_部署・タイトル','HRMOS_公開範囲','HRMOS_求人URL','取込日'];
    const yen = v => { const n = Number(v); return n ? n.toLocaleString('ja-JP') + '円' : ''; };
    const salaryText = s => {
      if (!s) return '';
      const u = { YAR: '年収', MNT: '月給', HOR: '時給' }[s.unit];
      const range = u && (s.amountFrom || s.amountTo) ? `${u} ${yen(s.amountFrom)}${s.amountTo ? ' ～ ' + yen(s.amountTo) : ' ～'}` : s.unit === 'NEG' ? '応相談' : '';
      return [range, String(s.supplement || '').trim()].filter(String).join('\n\n');
    };
    const pick = (descs, re) => descs.filter(d => re.test(d.term)).map(d => (descs.filter(x => re.test(x.term)).length > 1 ? `【${d.term}】\n` : '') + String(d.description || '').trim()).join('\n\n');
    const RE = { time: /勤務時間|就業時間|時間制度|所定時間外|勤務形態/, sel: /選考|面接/, trial: /試用/, hol: /休日|休暇|有給/, wel: /福利厚生|待遇|手当|賞与|昇給|昇格|制度/ };
    const used = d => Object.values(RE).some(r => r.test(d.term));
    const reqSection = text => String(text || '').split(/^(?=#{1,6}\s)/m).filter(p => /^#{1,6}\s*.*(応募|必須|歓迎|求める|要件|資格|スキル|経験)/.test(p)).map(md).join('\n\n');
    const toRow = (c, j) => {
      const ct = j.content || {}, descs = Array.isArray(ct.descriptions) ? ct.descriptions : [];
      const locs = Array.isArray(ct.locations) ? ct.locations : [];
      const addr = locs.map(l => String(l.address || '').trim()).filter(String);
      const prefs = [...new Set(addr.concat(String(ct.locationSupplement || '')).flatMap(a => PREFS.filter(p => a.includes(p))))];
      const s = ct.salary || {}, yearly = s.unit === 'YAR';
      const extra = descs.filter(d => !used(d)).map(d => `【${d.term}】\n${String(d.description || '').trim()}`).join('\n\n');
      const v = {
        Id: 'HR-' + j.jobId, Account_Text__c: c.name, JobName__c: j.jobName || j.positionName, JobSituation__c: '採用中',
        EmploymentStatus__c: EMP[j.jobType] || j.jobType || '', WorkLocation__c: prefs.join(';'),
        Address__c: [addr.join('\n'), String(ct.locationSupplement || '').trim()].filter(String).join('\n\n'),
        AnnualIncomeLowerLimit__c: yearly && s.amountFrom ? s.amountFrom : '', AnnualIncomMaxLimit__c: yearly && s.amountTo ? s.amountTo : '',
        CompensationSystemDetails__c: salaryText(s), BusinessContents__c: [md(ct.markdownFreeText), extra].filter(String).join('\n\n'),
        AdoptionElements__c: reqSection(ct.markdownFreeText),
        WorkingTime__c: [ct.timeShift, pick(descs, RE.time)].filter(String).join('\n\n'),
        HolidayVacation__c: [ct.holiday, pick(descs, RE.hol)].filter(String).join('\n\n'),
        WelfareOfficer__c: [ct.benefits, pick(descs, RE.wel)].filter(String).join('\n\n'),
        Insurance__c: ct.insurance || '', PassiveSmokingPreventionMeasures__c: ct.preventSmoke || '', EmploymentPeriodDetails__c: ct.contractPeriod || '',
        TrialPeriod__c: pick(descs, RE.trial), SelectionProcess__c: pick(descs, RE.sel), InformationUpdateDate__c: fmtDate(j.updatedAt),
        'HRMOS_部署・タイトル': ct.jobAdTitle || j.jobAdTitle || '', 'HRMOS_公開範囲': j.status.accessLevel === 'LMT' ? '限定公開' : '全体公開',
        'HRMOS_求人URL': `https://hrmos.co/agent/corporates/${c.id}/jobs/${j.jobId}/detail`, '取込日': today,
      };
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, v['HRMOS_部署・タイトル'], c.name);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    ui(T, '企業の一覧を読んでいます…', 0);
    const cr = await fetch('/api/other/agent/corporates');
    if (!cr.ok) throw new Error('HRMOSにログインしていないようです。ログインしてからもう一度押してください。');
    const cs = await cr.json();
    const rows = [];
    for (let i = 0; i < cs.length; i++) {
      const r = await fetch('/api/other/agent/corporates/' + cs[i].id + '/jobs');
      if (!r.ok) throw new Error(`${cs[i].name} の求人が読めませんでした（${r.status}）。少し待ってからもう一度押してください。`);
      for (const j of await r.json()) if (j.status && j.status.accessLevel !== 'PRV' && !j.status.isArchived) rows.push(toRow(cs[i], j));
      ui(T, `HRMOSから読み込み中… ${i + 1} / ${cs.length}社（求人 ${rows.length}件）`, (i + 1) / cs.length * 50);
      await sleep(150);
    }
    if (!rows.length) throw new Error('求人が1件も読めませんでした。');
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 50 + d.n / rows.length * 50);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `HRMOSの求人を ${f.n}件 に更新しました（${cs.length}社）。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== Talentio：一覧と見比べて、新しい・変わった求人だけ1件ずつゆっくり読む =====
  async function runTalentio() {
    const T = 'Talentioの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','Insurance__c','PassiveSmokingPreventionMeasures__c',
      'TrialPeriod__c','SelectionProcess__c','RemoteWork__c','CorporateInformation__c','NumberOfEmployees__c',
      'CorporateAccount__r.RepresentativeName__c','CorporateAccount__r.CompanyEstablishedDateFomula__c','InformationUpdateDate__c',
      'Talentio_部署・職種','Talentio_紹介会社向け情報','Talentio_求人URL','取込日'];
    const val = v => Array.isArray(v) ? v.map(String).join('\n') : String(v == null ? '' : v);
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
      let m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)/);
      return m ? [yen(m[1], m[2]), ''] : ['', ''];
    };
    const pick = (arr, re) => arr.filter(x => re.test(x.name) && val(x.value).trim());
    const join = (arr, labels) => arr.map(x => (labels ? `【${x.name}】\n` : '') + md(val(x.value))).join('\n\n');
    const toRow = (r, p) => {
      const rd = (p.requisitionDetails || []).filter(x => x.selected !== false);
      const jd = (p.jobDescriptionDetails || []).filter(x => x.selected !== false);
      const ca = p.requisitionCompanyAttributes || [];
      const one = (arr, re) => join(pick(arr, re), pick(arr, re).length > 1);
      const used = new Set();
      const take = (arr, re, labels) => { const a = pick(arr, re); a.forEach(x => used.add(x)); return join(a, labels === undefined ? a.length > 1 : labels); };
      const wage = take(rd, /賃金|給与|年収/);
      const loc = pick(rd, /勤務地/); loc.forEach(x => used.add(x));
      const addr = loc.map(x => val(x.value)).join('\n');
      const remoteTxt = pick(jd, /働き方|リモート|在宅/).map(x => val(x.value)).join(' ');
      const v = {
        Id: 'TL-' + r.id, Account_Text__c: r.companyName, JobName__c: r.name, JobSituation__c: '採用中',
        EmploymentStatus__c: take(jd, /雇用形態/, false), WorkLocation__c: [...new Set(PREFS.filter(pf => addr.includes(pf)))].join(';'), Address__c: addr,
        CompensationSystemDetails__c: wage, AdoptionElements__c: take(rd, /応募資格|必須|歓迎|求める人物|要件/, true),
        WorkingTime__c: take(jd, /勤務時間|就業時間|勤務形態/), HolidayVacation__c: take(jd, /休日|休暇/),
        WelfareOfficer__c: take(jd, /制度|手当|昇給|賞与|福利厚生|待遇/, true), Insurance__c: take(jd, /保険/, false),
        PassiveSmokingPreventionMeasures__c: take(rd, /受動喫煙/, false), TrialPeriod__c: take(jd, /試用/, false),
        SelectionProcess__c: take(jd.concat(rd), /選考|面接/),
        RemoteWork__c: /フルリモート|完全在宅|フル在宅/.test(remoteTxt) ? 'フルリモート可' : /リモート|在宅/.test(remoteTxt) && !/(リモート|在宅)(不可|なし)/.test(remoteTxt) ? '一部リモート可' : '',
        CorporateInformation__c: one(ca, /事業内容/), NumberOfEmployees__c: one(ca, /従業員数/),
        'CorporateAccount__r.RepresentativeName__c': one(ca, /代表/), 'CorporateAccount__r.CompanyEstablishedDateFomula__c': one(ca, /設立/),
        InformationUpdateDate__c: fmtDate(r.updatedAt), 'Talentio_部署・職種': r.jobTitleName || '',
        'Talentio_紹介会社向け情報': take(rd, /紹介会社|エージェント/, false),
        'Talentio_求人URL': `https://agent.talentio.com/r/ats/requisitions/${r.id}/candidates/new?recruitment_page_id=${r.recruitment_page_id}`, '取込日': today,
      };
      const rest = rd.concat(jd).filter(x => !used.has(x) && !/勤務地|雇用形態/.test(x.name) && val(x.value).trim());
      v.BusinessContents__c = rest.map(x => `【${x.name}】\n${md(val(x.value))}`).join('\n\n');
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(wage);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(r.name, r.jobTitleName, r.companyName);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    ui(T, 'Talentioの求人一覧を読んでいます…', 0);
    const list = [];
    for (let page = 1; ; page++) {
      const res = await fetch(`/api/v2/requisitions?sort=updated_at&desc=true&page=${page}&per_page=100`, { headers: { accept: 'application/json' } });
      if (res.status === 403 || res.status === 429) throw new Error('Talentioが一時的にアクセスを止めています。30分ほど空けてからもう一度押してください。');
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('json')) throw new Error('Talentioにログインしていないようです。ログインしてからもう一度押してください。');
      const d = await res.json();
      list.push(...(d.data || []));
      if (!d.data || !d.data.length || list.length >= d.totalCount) break;
      await sleep(1500);
    }
    const seen = new Set();
    const live = list.filter(r => !seen.has(r.id) && seen.add(r.id));
    if (!live.length) throw new Error('求人が1件も読めませんでした。');
    const have = new Map(((await post({ stage: 'ids' })).ids || []).map(([id, d]) => [id, d]));
    const todo = live.filter(r => { const d = have.get('TL-' + r.id); return d == null || fmtDate(r.updatedAt) > d; });
    const first = !have.size;
    let buf = [], got = 0, added = 0, updated = 0;
    const flush = async () => {
      if (!buf.length) return;
      const d = first ? await post({ stage: 'rows', rows: buf }) : await post({ stage: 'upsert', rows: buf });
      if (first) { sent += buf.length; added = sent; } else { added += d.added || 0; updated += d.updated || 0; }
      buf = [];
    };
    if (first) await post({ stage: 'start', headers: H }); // 初回は作業用シートに書いて、最後にまとめて入れ替える
    let sent = 0;
    for (const r of todo) {
      const left = Math.ceil((todo.length - got) * 3 / 60);
      ui(T, `新しい・変わった求人を読み込み中… ${got} / ${todo.length}件\n（あと約${left}分。タブは開いたままにしてください）`, todo.length ? got / todo.length * 90 : 90);
      let html = null;
      for (let a = 0; a < 3 && html === null; a++) {
        const res = await fetch(`/r/ats/requisitions/${r.id}/candidates/new?recruitment_page_id=${r.recruitment_page_id}`);
        if (res.status === 403 || res.status === 429) { ui(T, `Talentioが混み合っているため、1分半待ってから続けます…（${got} / ${todo.length}件）`, got / todo.length * 90); await sleep(90000); continue; }
        html = await res.text();
      }
      if (html === null) { await flush(); throw new Error(`Talentioが一時的にアクセスを止めています。${got}件まで保存しました。30分ほど空けてからもう一度押すと続きから読みます。`); }
      const el = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-react-class="CandidateForm/index"]');
      if (el) buf.push(toRow(r, JSON.parse(el.getAttribute('data-react-props'))));
      got++;
      if (buf.length >= 30) await flush();
      await sleep(2500);
    }
    await flush();
    if (first) { if (!sent) throw new Error('求人が1件も読めませんでした。'); await post({ stage: 'finish', expect: sent }); }
    ui(T, '掲載が終わった求人を整理しています…', 95);
    const pr = await post({ stage: 'prune', keep: live.map(r => 'TL-' + r.id) });
    return `Talentioの求人を更新しました（全${pr.n}件）。\n新規 ${added}件・更新 ${updated}件・掲載終了で削除 ${pr.removed}件\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== HERP：「ATS取込URL」シートに並べた会社ページを順に読む（新しい求人と、1週間以上前に読んだ求人だけ中身を読み直す） =====
  async function runHerp() {
    const T = 'HERPの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','Insurance__c','PassiveSmokingPreventionMeasures__c',
      'TrialPeriod__c','SelectionProcess__c','RemoteWork__c','CorporateInformation__c','NumberOfEmployees__c',
      'CorporateAccount__r.RepresentativeName__c','CorporateAccount__r.CompanyEstablishedDateFomula__c','InformationUpdateDate__c',
      'HERP_紹介会社向け情報','HERP_求人URL','取込日'];
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
      let m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)/);
      return m ? [yen(m[1], m[2]), ''] : ['', ''];
    };
    const herpData = html => {
      const s = [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('script')].map(x => x.textContent).find(x => x.includes('herpCb(null,'));
      if (!s) return null;
      let t = s.slice(s.indexOf('herpCb(null,') + 12);
      return JSON.parse(t.slice(0, t.lastIndexOf(')')));
    };
    const AGENT_INFO = { background: '募集背景', target: 'ターゲット', fixedNumber: '採用人数', period: '採用期限', treatment: '待遇', priority: '優先度' };
    // p：求人の中身（募集要項）、co：会社情報、ag：紹介会社向け情報
    const toRow = (r, p, co, ag) => {
      const v = {
        Id: r.id, Account_Text__c: r.company, JobName__c: p.name || r.name, JobSituation__c: '採用中',
        EmploymentStatus__c: p.formOfEmployment || '', Address__c: md(p.location),
        WorkLocation__c: [...new Set(PREFS.filter(pf => String(p.location || '').includes(pf)))].join(';'),
        CompensationSystemDetails__c: md(p.salary), BusinessContents__c: [md(p.summary), p.others ? `【その他】\n${md(p.others)}` : ''].filter(String).join('\n\n'),
        AdoptionElements__c: [['必須', p.requiredSkills], ['歓迎', p.preferredSkills], ['求める人物像', p.personality]].filter(([, x]) => String(x || '').trim()).map(([k, x]) => `【${k}】\n${md(x)}`).join('\n\n'),
        WorkingTime__c: md(p.workingConditions), WelfareOfficer__c: md(p.welfare), TrialPeriod__c: p.trial || '',
        SelectionProcess__c: md((ag || {}).selectionFlow),
        CorporateInformation__c: md(co.businessDescription), NumberOfEmployees__c: co.numberOfEmployees || '',
        'CorporateAccount__r.CompanyEstablishedDateFomula__c': co.foundedIn || '',
        InformationUpdateDate__c: fmtDate(r.createdAt),
        'HERP_紹介会社向け情報': Object.keys(AGENT_INFO).filter(k => String((ag || {})[k] || '').trim()).map(k => `【${AGENT_INFO[k]}】\n${md(ag[k])}`).join('\n\n'),
        'HERP_求人URL': r.url, '取込日': today,
      };
      const rt = [p.location, p.workingConditions, p.others, p.welfare].join(' ');
      v.RemoteWork__c = /フルリモート|完全在宅|フル在宅|完全リモート/.test(rt) ? 'フルリモート可' : /リモート|在宅/.test(rt) && !/(リモート|在宅)(勤務)?(不可|なし)/.test(rt) ? '一部リモート可' : '';
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(p.salary);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, '', r.company);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    // 公開の採用ページ（herp.careers）の中身を、エージェント画面と同じ形にそろえる
    const careersJob = doc => {
      const sec = name => { const h = [...doc.querySelectorAll('h2')].find(x => x.textContent.trim() === name); return h ? h.parentElement : null; };
      const text = name => { const s = sec(name); if (!s) return ''; const c = s.querySelector('.with-heading__content') || s; return c.innerText || c.textContent || ''; };
      const kv = {};
      doc.querySelectorAll('table.kv-table tr').forEach(tr => { const th = tr.querySelector('th'), td = tr.querySelector('td'); if (th && td) kv[th.textContent.trim()] = (td.innerText || td.textContent || '').trim(); });
      const name = (doc.querySelector('h1') || {}).textContent || doc.title.replace(/\s-\s[^-]+$/, '');
      return {
        p: { name: String(name).trim(), summary: text('仕事概要'), requiredSkills: text('必須スキル'), preferredSkills: text('歓迎スキル'), personality: text('求める人物像'),
          salary: kv['給与'], location: kv['勤務地'], formOfEmployment: kv['雇用形態'], workingConditions: kv['勤務体系'], trial: kv['試用期間'], welfare: kv['福利厚生'], others: '' },
        co: { businessDescription: kv['事業内容'], numberOfEmployees: kv['従業員数'], foundedIn: kv['設立年月'] },
        company: kv['企業名'] || '',
      };
    };
    const parse = html => new DOMParser().parseFromString(html, 'text/html');

    ui(T, '読み込む会社の一覧を確認しています…', 0);
    const urls = (await post({ stage: 'urls' })).urls || [];
    const toks = [...new Set(urls.map(u => (u.match(/agent\.herp\.cloud\/p\/([\w-]+)/) || [])[1]).filter(Boolean))];
    const careers = [...new Set(urls.map(u => (u.match(/^(https:\/\/herp\.careers\/v1\/[\w-]+)\/?$/) || [])[1]).filter(Boolean))];
    if (!toks.length && !careers.length) throw new Error('「ATS取込URL」シートに、HERPのURLがありません。');

    const live = [], skipped = [];
    let ok = 0;
    for (let k = 0; k < toks.length; k++) {
      ui(T, `会社ごとの求人一覧を読んでいます… ${k + 1} / ${toks.length + careers.length}社（求人 ${live.length}件）`, (k + 1) / (toks.length + careers.length) * 20);
      const res = await fetch('/p/' + toks[k]);
      if (res.status === 429) { await sleep(60000); k--; continue; }
      const d = res.ok ? herpData(await res.text()) : null;
      const list = d && d.listRequisitionsResponse && d.listRequisitionsResponse.requisitions;
      if (!list) { skipped.push(d && d.kind === 'EmailMismatch' ? '別のメールアドレス宛ての招待' : `開けない（${res.status}）`); if (k >= 2 && !ok) throw new Error('HERPにログインしていないようです。ログインしてからもう一度押してください。'); await sleep(400); continue; }
      ok++;
      const company = (d.inviterCompany || {}).name || '';
      list.forEach(q => live.push({ id: 'HP-' + q.id, name: q.name, createdAt: q.createdAt, company, url: `https://agent.herp.cloud/p/${toks[k]}/requisitions/id/${q.id}`, path: `/p/${toks[k]}/requisitions/id/${q.id}` }));
      await sleep(400);
    }
    for (let k = 0; k < careers.length; k++) {
      ui(T, `会社ごとの求人一覧を読んでいます… ${toks.length + k + 1} / ${toks.length + careers.length}社（求人 ${live.length}件）`, (toks.length + k + 1) / (toks.length + careers.length) * 20);
      const r = { status: 0 }; // 公開の採用ページはブラウザから直接読めないため、今は読み込まない（必要になったらサーバー経由で対応）
      if (r.status !== 200) { skipped.push('公開の採用ページ（herp.careers）は今は読み込めません'); continue; }
      const doc = parse(r.html);
      const slug = careers[k].split('/').pop();
      const company = doc.title.replace(/\s*の全ての求人一覧.*$/, '').trim();
      [...new Set([...doc.querySelectorAll('a')].map(a => a.getAttribute('href') || '').filter(h => new RegExp(`^/v1/${slug}/[\\w-]+$`).test(h) && !/requisition-groups/.test(h)))]
        .forEach(h => live.push({ id: 'HP-C-' + h.split('/').pop(), name: '', createdAt: '', company, url: 'https://herp.careers' + h, careers: true }));
    }
    const seen = new Set();
    const jobs = live.filter(r => !seen.has(r.id) && seen.add(r.id));
    if (!jobs.length) throw new Error('求人が1件も読めませんでした。');

    const have = new Map(((await post({ stage: 'ids' })).ids || []).map(([id, d, got]) => [id, got || '']));
    const week = fmtDate(new Date(Date.now() - 7 * 86400e3).toISOString());
    const todo = jobs.filter(r => !have.has(r.id) || !have.get(r.id) || have.get(r.id) <= week);
    const first = !have.size;
    if (first) await post({ stage: 'start', headers: H }); // 初回は作業用シートに書いて、最後にまとめて入れ替える
    let sent = 0;
    let buf = [], got = 0, added = 0, updated = 0, failed = 0;
    const flush = async () => {
      if (!buf.length) return;
      const d = first ? await post({ stage: 'rows', rows: buf }) : await post({ stage: 'upsert', rows: buf });
      if (first) { sent += buf.length; added = sent; } else { added += d.added || 0; updated += d.updated || 0; }
      buf = [];
    };
    for (const r of todo) {
      const left = Math.ceil((todo.length - got) * 0.7 / 60);
      ui(T, `新しい求人・しばらく読んでいない求人を読み込み中… ${got} / ${todo.length}件\n（あと約${left}分。タブは開いたままにしてください）`, 20 + (todo.length ? got / todo.length * 72 : 72));
      try {
        if (r.careers) {
          const x = await post({ stage: 'proxy', url: r.url });
          if (x.status === 200) { const c = careersJob(parse(x.html)); buf.push(toRow(Object.assign({}, r, { company: c.company || r.company }), c.p, c.co, null)); } else failed++;
        } else {
          let res = await fetch(r.path);
          if (res.status === 429) { await sleep(60000); res = await fetch(r.path); }
          const d = res.ok ? herpData(await res.text()) : null;
          const g = d && d.getRequisitionResponse;
          if (g && g.requisition) buf.push(toRow(r, g.requisition.requisitionPublicProperties || {}, g.companyProfile || {}, g.requisition.requisitionInfoForAgent || {}));
          else failed++;
          await sleep(400);
        }
      } catch (e) { failed++; }
      got++;
      if (buf.length >= 40) await flush();
    }
    await flush();
    if (first) { if (!sent) throw new Error('求人が1件も読めませんでした。'); await post({ stage: 'finish', expect: sent }); }
    ui(T, '掲載が終わった求人を整理しています…', 95);
    const pr = await post({ stage: 'prune', keep: jobs.map(r => r.id) });
    const skipNote = skipped.length ? `\n読めなかった会社 ${skipped.length}社（${[...new Set(skipped)].join('・')}）` : '';
    return `HERPの求人を更新しました（${ok}社・全${pr.n}件）。\n新規 ${added}件・読み直し ${updated}件・掲載終了で削除 ${pr.removed}件${failed ? `・読めなかった求人 ${failed}件` : ''}${skipNote}\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== PERSONA：企業ごとの求人一覧を読み、新しい求人・しばらく読んでいない求人だけ1件ずつ読む =====
  async function runPersona() {
    const T = 'PERSONAの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','Insurance__c','PassiveSmokingPreventionMeasures__c',
      'EmploymentPeriodDetails__c','TrialPeriod__c','SelectionProcess__c','RemoteWork__c','CorporateInformation__c','NumberOfEmployees__c',
      'CorporateAccount__r.CompanyEstablishedDateFomula__c','InformationUpdateDate__c',
      'PERSONA_紹介会社向け情報','PERSONA_求人URL','取込日'];
    const API = 'https://api.persona-ats.com/agent-prod/agents/';
    // 画面と同じログイン情報（ブラウザに保存されている分）を使う。パスワードは扱わない
    const auth = () => {
      const ks = Object.keys(localStorage);
      const user = localStorage.getItem(ks.find(k => /^CognitoIdentityServiceProvider\..+\.LastAuthUser$/.test(k)) || '');
      const tok = user && localStorage.getItem(ks.find(k => k.endsWith('.' + user + '.idToken')) || '');
      if (!user || !tok) throw new Error('PERSONAにログインしていないようです。ログインしてからもう一度押してください。');
      return { user, tok };
    };
    const get = async path => {
      for (let a = 1; a <= 3; a++) {
        const { tok } = auth();
        const r = await fetch(API + path, { headers: { Authorization: tok } });
        if (r.status === 401 || r.status === 403) throw new Error('PERSONAのログインが切れています。画面を読み込み直してログインし、もう一度押してください。');
        if (r.status === 429 || r.status >= 500) { await sleep(a === 1 ? 5000 : 60000); continue; }
        if (!r.ok) throw new Error(`PERSONAから読めませんでした（${r.status}）`);
        return r.json();
      }
      throw new Error('PERSONAが込み合っているようです。少し待ってからもう一度押してください。');
    };
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
      let m = t.match(/年収[^\d\n]{0,12}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*[¥\\]?\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,12}([\d,.]+)\s*(万円|万|円)?/);
      return m ? [yen(m[1], m[2]), ''] : ['', ''];
    };
    const tidy = v => String(v || '').replace(/\r/g, '').replace(/[ \t　]{2,}/g, ' ').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    const RE = { req: /応募|必須|歓迎|求める|要件|資格|スキル|募集要項|人物/, sel: /選考|面接/, biz: /業務内容|仕事内容|職務内容|ミッション|ポジション/ };
    // 表示区分：1＝全員向け、2＝紹介会社向け、3＝直接応募の人向け（3は読まない）
    const toRow = (c, q, d) => {
      const p = (d.position || [])[0] || {};
      const co = (d.clients || [])[0] || {};
      const on = k => String(p[k + '_display'] == null ? '1' : p[k + '_display']) !== '3';
      const f = k => on(k) ? tidy(p[k]) : '';
      const items = (d.position_items || []).filter(x => String(x.body || '').trim());
      const pub = items.filter(x => String(x.display) === '1'), ag = items.filter(x => String(x.display) === '2');
      const sec = arr => arr.map(x => `【${tidy(x.title)}】\n${tidy(x.body)}`).join('\n\n');
      const req = pub.filter(x => RE.req.test(x.title) && !RE.biz.test(x.title)), sel = pub.filter(x => RE.sel.test(x.title) && !req.includes(x));
      const rest = pub.filter(x => !req.includes(x) && !sel.includes(x));
      const links = (d.hp_urls || []).filter(x => x.url).map(x => `${tidy(x.title)} ${x.url}`).join('\n');
      const v = {
        Id: 'PS-' + q.position_id, Account_Text__c: co.client_name || c.client_name, JobName__c: tidy(p.title || q.title), JobSituation__c: '採用中',
        EmploymentStatus__c: f('employment_type'), Address__c: f('place'),
        WorkLocation__c: [...new Set(PREFS.filter(pf => (f('place') + ' ' + (p.title || '')).includes(pf) || (p.title || '').includes(pf.replace(/[都府県]$/, '')) && pf !== '京都府'))].join(';'),
        CompensationSystemDetails__c: f('salary'),
        BusinessContents__c: [tidy(p.catch_copy), sec(rest)].filter(String).join('\n\n'),
        AdoptionElements__c: sec(req),
        WorkingTime__c: f('work_schedule'), HolidayVacation__c: f('holiday'), WelfareOfficer__c: f('benefits'), Insurance__c: f('insurance'),
        PassiveSmokingPreventionMeasures__c: f('smoke'), EmploymentPeriodDetails__c: f('contract_period'), TrialPeriod__c: f('probationary_period'),
        SelectionProcess__c: sec(sel),
        CorporateInformation__c: tidy(co.business_detail), NumberOfEmployees__c: tidy(co.member),
        'CorporateAccount__r.CompanyEstablishedDateFomula__c': tidy(co.establish),
        InformationUpdateDate__c: '',
        'PERSONA_紹介会社向け情報': [sec(ag), links ? `【参考URL】\n${links}` : ''].filter(String).join('\n\n'),
        'PERSONA_求人URL': 'https://www.agent.persona-ats.com/', '取込日': today,
      };
      const rt = [p.place, p.work_schedule, p.benefits, sec(rest)].join(' ');
      v.RemoteWork__c = /フルリモート|完全在宅|フル在宅|完全リモート/.test(rt) ? 'フルリモート可' : /リモート|在宅/.test(rt) && !/(リモート|在宅)(勤務)?(不可|なし)/.test(rt) ? '一部リモート可' : '';
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(p.salary);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, '', v.Account_Text__c);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };

    ui(T, '企業の一覧を読んでいます…', 0);
    const { user } = auth();
    const clients = (await get(`search_client_list/${user}/`)).clients || [];
    if (!clients.length) throw new Error('企業が1社も読めませんでした。');
    const jobs = [];
    for (let k = 0; k < clients.length; k++) {
      const c = clients[k];
      const list = (await get(`search_position_list/${user}/?client_id=${encodeURIComponent(c.client_id)}`)).positions || [];
      list.filter(q => String(q.available) === '1').forEach(q => jobs.push({ id: 'PS-' + q.position_id, c, q }));
      ui(T, `企業ごとの求人一覧を読んでいます… ${k + 1} / ${clients.length}社（求人 ${jobs.length}件）`, (k + 1) / clients.length * 15);
      await sleep(300);
    }
    if (!jobs.length) throw new Error('求人が1件も読めませんでした。');

    const have = new Map(((await post({ stage: 'ids' })).ids || []).map(([id, d, got]) => [id, got || '']));
    const week = fmtDate(new Date(Date.now() - 7 * 86400e3).toISOString());
    const first = !have.size || !!CFG.full; // CFG.full：全件を読み直す（項目の割り当てを直したとき用）
    const todo = first ? jobs : jobs.filter(r => !have.has(r.id) || !have.get(r.id) || have.get(r.id) <= week);
    if (first) await post({ stage: 'start', headers: H });
    let buf = [], got = 0, sent = 0, added = 0, updated = 0, failed = 0;
    const flush = async () => {
      if (!buf.length) return;
      const d = first ? await post({ stage: 'rows', rows: buf }) : await post({ stage: 'upsert', rows: buf });
      if (first) { sent += buf.length; added = sent; } else { added += d.added || 0; updated += d.updated || 0; }
      buf = [];
    };
    for (const r of todo) {
      const left = Math.ceil((todo.length - got) * 1.2 / 60);
      ui(T, `新しい求人・しばらく読んでいない求人を読み込み中… ${got} / ${todo.length}件\n（あと約${left}分。タブは開いたままにしてください）`, 15 + (todo.length ? got / todo.length * 77 : 77));
      try {
        const d = await get(`search_position_detail/${user}/?position_id=${encodeURIComponent(r.q.position_id)}&client_id=${encodeURIComponent(r.c.client_id)}`);
        if (d && (d.position || []).length) buf.push(toRow(r.c, r.q, d)); else failed++;
      } catch (e) {
        if (/ログイン/.test(String(e && e.message))) { await flush().catch(() => {}); throw e; }
        failed++;
      }
      got++;
      if (buf.length >= 40) await flush();
      await sleep(600);
    }
    await flush();
    if (first) { if (!sent) throw new Error('求人が1件も読めませんでした。'); await post({ stage: 'finish', expect: sent }); }
    ui(T, '掲載が終わった求人を整理しています…', 95);
    const pr = failed > jobs.length / 2 ? { n: jobs.length, removed: 0 } : await post({ stage: 'prune', keep: jobs.map(r => r.id) });
    return `PERSONAの求人を更新しました（${clients.length}社・全${pr.n}件）。\n新規 ${added}件・読み直し ${updated}件・掲載終了で削除 ${pr.removed}件${failed ? `・読めなかった求人 ${failed}件` : ''}\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== ジョブカン：担当企業を順に切り替えて、全件を作り直す（非公開の求人も入れて「ジョブカン_公開状態」で区別） =====
  async function runJobcan() {
    const T = 'ジョブカンの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','TrialPeriod__c','SelectionProcess__c','RemoteWork__c','InformationUpdateDate__c',
      'ジョブカン_公開状態','ジョブカン_管理用求人名','ジョブカン_募集拠点','ジョブカン_求人URL','取込日'];
    const sel = document.querySelector('#change_agent_client');
    if (!sel || !sel.options.length) throw new Error('ジョブカンのエージェント画面（ログイン後）で押してください。');
    const csrf = (document.querySelector('meta[name=csrf-token]') || {}).content || '';
    const HD = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', 'X-CSRF-Token': csrf };
    const getJson = async path => {
      for (let a = 1; a <= 3; a++) {
        const r = await fetch(path, { headers: HD });
        if (r.status === 401 || r.status === 403) throw new Error('ジョブカンにログインしていないようです。ログインしてからもう一度押してください。');
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) return r.json();
        if (a === 3) throw new Error(`ジョブカンの求人が読めませんでした（${r.status}）。少し待ってからもう一度押してください。`);
        await sleep(2000 * a);
      }
    };
    const switchTo = async id => {
      const r = await fetch('/_/agents/change_client?client_id=' + encodeURIComponent(id), { headers: HD });
      if (!r.ok) throw new Error(`企業の切り替えができませんでした（${r.status}）。`);
    };
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
      let m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)/);
      return m ? [yen(m[1], m[2]), ''] : ['', ''];
    };
    const txt = v => md(String(v == null ? '' : v));
    const toRow = (company, j) => {
      const items = (j.optional_items || []).filter(x => String(x.value == null ? '' : x.value).trim());
      const used = new Set();
      const take = (re, labels) => { const a = items.filter(x => !used.has(x) && re.test(x.name)); a.forEach(x => used.add(x)); return a.map(x => ((labels === undefined ? a.length > 1 : labels) ? `【${x.name}】\n` : '') + txt(x.value)).join('\n\n'); };
      const locs = (j.work_locations || []).map(l => [l.name, l.address, l.full_address].filter(Boolean).join(' ')).filter(String);
      const place = [txt(j.place), locs.join('\n')].filter(String).join('\n\n');
      const prefNames = (j.prefectures || []).map(p => p.name);
      let prefs = PREFS.filter(p => place.includes(p));
      if (!prefs.length && prefNames.length && prefNames.length <= 10) prefs = prefNames;
      const comp = [txt(j.income), take(/給与|年収|賞与|報酬/, true)].filter(String).join('\n\n');
      const remoteTxt = [j.place, j.working_hours, j.abstract].join(' ');
      const v = {
        Id: 'JC-' + j.id, Account_Text__c: company, JobName__c: j.published_name || String(j.name || '').replace(/^[■□◆◇●○【\s]+/, ''),
        JobSituation__c: '採用中', EmploymentStatus__c: (j.employment_types || []).map(e => e.name).join('・'),
        WorkLocation__c: prefs.join(';'), Address__c: place, CompensationSystemDetails__c: comp,
        AdoptionElements__c: take(/必須|歓迎|求める|人物|資格|要件|応募|スキル|経験|言語/, true),
        WorkingTime__c: [txt(j.working_hours), take(/勤務時間|就業時間|勤務形態/)].filter(String).join('\n\n'),
        HolidayVacation__c: [txt(j.holidays), take(/休日|休暇/)].filter(String).join('\n\n'),
        WelfareOfficer__c: take(/福利厚生|待遇|手当|昇給|制度|保険/, true), TrialPeriod__c: take(/試用/, false), SelectionProcess__c: take(/選考|面接/),
        RemoteWork__c: /フルリモート|完全在宅|フル在宅/.test(remoteTxt) ? 'フルリモート可' : /リモート|在宅/.test(remoteTxt) && !/(リモート|在宅)(不可|なし)/.test(remoteTxt) ? '一部リモート可' : '',
        InformationUpdateDate__c: fmtDate(j.updated_at || j.created_at),
        'ジョブカン_公開状態': String(j.publish) === 'true' ? '公開' : '非公開', 'ジョブカン_管理用求人名': j.name || '', 'ジョブカン_募集拠点': (j.branch && j.branch.name) || '',
        'ジョブカン_求人URL': `https://ats.jobcan.jp/job_offers/${j.id}`, '取込日': today,
      };
      v.BusinessContents__c = [txt(j.abstract), items.filter(x => !used.has(x)).map(x => `【${x.name}】\n${txt(x.value)}`).join('\n\n')].filter(String).join('\n\n');
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(comp);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, j.name, v.Account_Text__c);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    const clients = [...sel.options].map(o => ({ id: o.value, name: o.text.trim() }));
    const orig = sel.value;
    const rows = [];
    let failed = 0, hidden = 0;
    try {
      for (let i = 0; i < clients.length; i++) {
        const c = clients[i];
        ui(T, `ジョブカンから読み込み中… ${i + 1} / ${clients.length}社（求人 ${rows.length}件）\n読み終わるまで、ジョブカンの他のタブで企業を切り替えないでください。`, i / clients.length * 80);
        await switchTo(c.id);
        const list = [];
        for (let off = 0; ; off += 100) {
          const l = await getJson(`/_/agent/job_offers?limit=100&offset=${off}`);
          list.push(...l);
          if (l.length < 100) break;
        }
        for (let k = 0; k < list.length; k += 3) {
          const got = await Promise.all(list.slice(k, k + 3).map(q => getJson('/_/agent/job_offers/' + encodeURIComponent(q.id)).catch(() => null)));
          got.forEach(j => { if (!j) { failed++; return; } const r = toRow(c.name, j); if (r[H.indexOf('ジョブカン_公開状態')] === '非公開') hidden++; rows.push(r); });
          await sleep(200);
        }
      }
    } finally {
      await switchTo(orig).catch(() => {});
    }
    if (!rows.length) throw new Error('求人が1件も読めませんでした。');
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 80 + d.n / rows.length * 20);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `ジョブカンの求人を ${f.n}件 に更新しました（${clients.length}社・うち非公開 ${hidden}件${failed ? `・読めなかった求人 ${failed}件` : ''}）。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== sonar ATS：クライアント（案件）を順に切り替えて、全件を作り直す =====
  async function runSonar() {
    const T = 'sonarの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','TrialPeriod__c','SelectionProcess__c','RemoteWork__c','CorporateInformation__c','InformationUpdateDate__c',
      'sonar_職種','sonar_案件名','sonar_紹介会社向け情報','sonar_募集終了日','取込日'];
    if (typeof window.__xsrfToken !== 'string') throw new Error('sonarのエージェント画面（ログイン後）で押してください。');
    const X = { 'X-XSRF-TOKEN': window.__xsrfToken, Accept: 'application/json' };
    let cur = 0;
    const api = async (path, opt) => {
      for (let a = 1; a <= 3; a++) {
        const r = await fetch('/agent/api/' + path, Object.assign({ credentials: 'include' }, opt || {}, { headers: Object.assign({ 'Front-Project-No': String(cur) }, X, opt && opt.body ? { 'Content-Type': 'application/json' } : {}) }));
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) return r.json();
        if (a === 3) throw new Error(`sonarの求人が読めませんでした（${r.status}）。ログインし直してからもう一度押してください。`);
        await sleep(2000 * a);
      }
    };
    const change = async no => {
      const d = await api('Home/ProjectCardSelector/Change', { method: 'POST', body: JSON.stringify(no) });
      if (!(Array.isArray(d) && d[0] === 'OK')) throw new Error('クライアントの切り替えができませんでした。');
      cur = no;
    };
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
      let m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)/);
      if (m) return [yen(m[1], m[2]), ''];
      // 「年収」の語がなくても「800～1,200万円」のように万円の幅があれば年収とみなす（月給は除く）
      m = t.match(/(?:^|[^月時日\d,.])([\d,.]{3,})\s*(万円|万)?\s*[~〜～\-ー－]\s*([\d,.]{3,})\s*(万円|万)/);
      return m && !/月給|月額|時給/.test(t.slice(Math.max(0, m.index - 10), m.index + 2)) && yen(m[1], m[2] || m[4]) >= 2000000 ? [yen(m[1], m[2] || m[4]), yen(m[3], m[4])] : ['', ''];
    };
    // 本文はHTMLなので、改行を残して文字だけにする
    const plain = html => {
      const d = new DOMParser().parseFromString(String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d)>/gi, '$&\n'), 'text/html');
      return md(d.body.textContent.replace(/\u00a0/g, ' '));
    };
    // 「大阪」「名古屋 ＞ 名古屋支社」のような書き方も都道府県に直す（「東京都」の中の「京都」は拾わない）
    const CITY = { 名古屋: '愛知県', 横浜: '神奈川県', 川崎: '神奈川県', 札幌: '北海道', 仙台: '宮城県', 神戸: '兵庫県', 博多: '福岡県', 那覇: '沖縄県', 梅田: '大阪府', 難波: '大阪府' };
    const toPref = names => [...new Set(names.flatMap(n => {
      n = String(n || '');
      const hit = PREFS.filter(p => n.includes(p));
      if (hit.length) return hit;
      const t = n.replace(/東京/g, '〓');
      return PREFS.filter(p => { const b = p.replace(/[都府県]$/, ''); return p === '東京都' ? n.includes('東京') : p === '北海道' ? false : b.length >= 2 && t.includes(b); })
        .concat(Object.keys(CITY).filter(k => n.includes(k)).map(k => CITY[k]));
    }))];
    const toRow = (p, row, d) => {
      const items = (d.jobOfferItems || []).map(x => ({ name: String(x.label || '').trim(), text: plain(x.text) })).filter(x => x.text);
      const used = new Set();
      const take = (re, labels) => { const a = items.filter(x => !used.has(x) && re.test(x.name)); a.forEach(x => used.add(x)); return a.map(x => ((labels === undefined ? a.length > 1 : labels) ? `【${x.name}】\n` : '') + x.text).join('\n\n'); };
      const agentInfo = take(/エージェント|紹介条件|紹介会社/, true);
      const locs = (d.jobLocation || []).map(String);
      const addr = take(/勤務地|就業場所|勤務場所/);
      const comp = take(/給与|年収|賞与|報酬|待遇/, true);
      const v = {
        Id: `SN-${p.ProjectNo}-${row.id}`, Account_Text__c: p.ClientName, JobName__c: d.title || (row.values || [])[0] || '', JobSituation__c: '採用中',
        EmploymentStatus__c: [].concat(d.employmentType || []).join('・') || take(/雇用形態/, false),
        Address__c: [locs.join('・'), addr].filter(String).join('\n\n'),
        CompensationSystemDetails__c: comp,
        AdoptionElements__c: take(/必須|歓迎|求める|人物|資格|要件|応募|スキル|経験|必要条件/, true),
        WorkingTime__c: take(/勤務時間|就業時間|勤務体系|勤務条件|労働条件|勤務形態/, true),
        HolidayVacation__c: take(/休日|休暇/), WelfareOfficer__c: take(/福利厚生|手当|制度|保険/, true),
        TrialPeriod__c: take(/試用/, false), SelectionProcess__c: take(/選考/),
        CorporateInformation__c: take(/会社PR|事業内容|ビジョン|について$|会社概要|当社/, true),
        InformationUpdateDate__c: String((row.values || [])[4] || '').slice(0, 10),
        'sonar_職種': [].concat(d.shokushu || []).join('・'), 'sonar_案件名': p.ProjectName || '',
        'sonar_紹介会社向け情報': agentInfo, 'sonar_募集終了日': String((row.values || [])[3] || ''), '取込日': today,
      };
      v.WorkLocation__c = toPref(locs.concat(addr)).join(';');
      v.BusinessContents__c = items.filter(x => !used.has(x)).map(x => `【${x.name}】\n${x.text}`).join('\n\n');
      const remoteTxt = [v.Address__c, v.WorkingTime__c, v.BusinessContents__c].join(' ');
      v.RemoteWork__c = /フルリモート|完全在宅|フル在宅/.test(remoteTxt) ? 'フルリモート可' : /リモート|在宅/.test(remoteTxt) && !/(リモート|在宅)(不可|なし)/.test(remoteTxt) ? '一部リモート可' : '';
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(comp);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, v['sonar_職種'], v.Account_Text__c);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    ui(T, 'クライアントの一覧を読んでいます…', 0);
    cur = (await api('Account/GetAccountInfo')).projectNo || 0;
    const orig = cur;
    const projects = (await api('Home/ProjectCardSelector/Master')).projectCardDataArray || [];
    if (!projects.length) throw new Error('クライアントが1件も見つかりませんでした。');
    const rows = [];
    let failed = 0;
    try {
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        ui(T, `sonarから読み込み中… ${i + 1} / ${projects.length}社（求人 ${rows.length}件）\n読み終わるまで、sonarの他のタブで操作しないでください。`, i / projects.length * 80);
        await change(p.ProjectNo);
        const first = await api('JobOffer/List/GetItems', { method: 'POST', body: JSON.stringify({ targetItems: ['Title', 'JobLocation', 'EmploymentType', 'AgentOpenEnd', 'EditDT', 'RecommendCount'], sortState: { name: 'EditDT', order: 'desc' }, filterState: {} }) });
        let list = first.values || [], more = first.hasMoreItems;
        while (more) {
          const g = await api(`JobOffer/List/GetItems?id=${encodeURIComponent(first.resultId)}&start=${list.length}&count=100`);
          list = list.concat(g.values || []);
          more = g.hasMoreItems && (g.values || []).length > 0;
        }
        for (const row of list) {
          try { rows.push(toRow(p, row, await api('JobOffer/Detail/Get?jobOfferNo=' + encodeURIComponent(row.id)))); } catch (e) { failed++; }
          await sleep(150);
        }
      }
    } finally {
      if (cur !== orig && orig) await change(orig).catch(() => {});
    }
    if (!rows.length) throw new Error('求人が1件も読めませんでした。');
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 80 + d.n / rows.length * 20);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `sonarの求人を ${f.n}件 に更新しました（${projects.length}社${failed ? `・読めなかった求人 ${failed}件` : ''}）。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== リクナビHRTech：求人の中身はPDFなので、求人名・企業からのメモ・求人票PDFへのリンクだけ取り込む =====
  async function runRikunabi() {
    const T = 'リクナビHRTechの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','BusinessContents__c','InformationUpdateDate__c',
      'リクナビ_求人票PDF','リクナビ_エージェント向けメモ','取込日'];
    ui(T, '契約企業と募集ポジションを読んでいます…', 10);
    const r = await fetch('/api/agent/transaction/client', { headers: { Accept: 'application/json' }, credentials: 'include' });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error('リクナビHRTechにログインしていないようです。ログインしてからもう一度押してください。');
    const clients = await r.json();
    const fileUrl = path => 'https://ats.hrtech.rikunabi.com/agent/file#/agent/' + String(path || '').split('/').map(encodeURIComponent).join('/');
    const rows = [];
    for (const c of clients) {
      const cl = c.client || {}, corp = cl.corporation || {};
      if (cl.active === false) continue;
      const company = corp.fullName || cl.fullName || corp.name || cl.name || '';
      for (const o of c.jobOffers || []) {
        if (o.active === false) continue;
        const v = {
          Id: 'RN-' + o.id, Account_Text__c: company, JobName__c: String(o.title || '').replace(/^[■□◆◇●○\s]+/, ''), JobSituation__c: '採用中',
          BusinessContents__c: md(o.clientMemo), InformationUpdateDate__c: String(o.updatedAt || o.createdAt || '').slice(0, 10),
          'リクナビ_求人票PDF': (o.files || []).map(f => `${f.name}\n${fileUrl(f.path)}`).join('\n\n'),
          'リクナビ_エージェント向けメモ': md(o.agentMemo), '取込日': today,
        };
        [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, '', company);
        rows.push(H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000)));
      }
    }
    if (!rows.length) throw new Error('求人が1件も読めませんでした。');
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 30 + d.n / rows.length * 70);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `リクナビHRTechの求人を ${f.n}件 に更新しました（${clients.length}社）。\n求人の中身はPDFのため、求人名と求人票PDFへのリンクだけです。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== ギークリー（パートナー画面）：求人一覧から詳細ページを1件ずつ読み、全件を作り直す（求人はギークリー自社の募集） =====
  async function runGeekly() {
    const T = 'ギークリーの求人を更新中';
    const COMPANY = '株式会社ギークリー';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','Insurance__c','TrialPeriod__c','RemoteWork__c',
      'CorporateInformation__c','NumberOfEmployees__c','CorporateAccount__r.CompanyEstablishedDateFomula__c',
      'ギークリー_求人の特徴','ギークリー_求人URL','取込日'];
    const base = '/' + location.pathname.split('/').filter(Boolean)[0] + '/s_jobs/';
    const getDoc = async path => {
      for (let a = 1; a <= 3; a++) {
        const r = await fetch(path, { credentials: 'include' });
        if (r.ok) {
          const d = new DOMParser().parseFromString(await r.text(), 'text/html');
          if (d.querySelector('input[type=password]') && !d.querySelector('a[href*="/s_jobs/details/"], .form-group')) throw new Error('ギークリーにログインしていないようです。ログインしてからもう一度押してください。');
          return d;
        }
        if (a === 3) throw new Error(`ギークリーの求人が読めませんでした（${r.status}）。少し待ってからもう一度押してください。`);
        await sleep(2000 * a);
      }
    };
    const clean = t => md(String(t || '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n'));
    const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      let m = t.match(/([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/([\d,.]+)\s*(万円|万)/);
      return m ? [yen(m[1], m[2]), ''] : ['', ''];
    };
    // 一覧（「next」があれば次のページも）から求人IDを集める
    ui(T, '求人の一覧を読んでいます…', 0);
    const ids = [], seen = new Set();
    let path = base;
    for (let pg = 0; pg < 30 && path; pg++) {
      const d = await getDoc(path);
      [...d.querySelectorAll('a[href*="/s_jobs/details/"]')].forEach(a => { const id = (a.getAttribute('href').match(/details\/(\d+)/) || [])[1]; if (id && !seen.has(id)) { seen.add(id); ids.push(id); } });
      const nx = [...d.querySelectorAll('a')].find(a => /^\s*next\s*$/i.test(a.textContent) && a.getAttribute('href') && !/^#|javascript:/i.test(a.getAttribute('href')));
      const nu = nx ? new URL(nx.getAttribute('href'), location.origin + path) : null;
      const np = nu ? nu.pathname + nu.search : '';
      path = np && np !== path ? np : '';
    }
    if (!ids.length) throw new Error('求人が1件も見つかりませんでした。求人一覧の画面で押してください。');
    const rows = [];
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      ui(T, `ギークリーから読み込み中… ${i + 1} / ${ids.length}件`, 5 + i / ids.length * 80);
      try {
        const d = await getDoc(base + 'details/' + ids[i]);
        const f = {};
        d.querySelectorAll('.form-group').forEach(g => { const l = g.querySelector('label'), v = g.querySelector('.col-sm-10'); if (l && v) f[l.textContent.trim()] = clean(v.innerText || v.textContent); });
        const get = k => (f[k] || '').trim();
        const lab = k => { const v = get(k); return v && !/^[-ー\s]*(万|日)?$/.test(v) ? `【${k}】\n${v}` : ''; };
        const title = clean((d.querySelector('.panel-heading') || {}).textContent || '');
        const addr = [get('勤務地'), get('最寄り駅') ? `最寄り駅：${get('最寄り駅')}` : ''].filter(String).join('\n');
        const comp = [get('想定年収') ? `想定年収：${get('想定年収')}` : '', lab('給与形態'), lab('月給'), lab('残業代'), lab('昇給賞与')].filter(String).join('\n\n');
        const remoteTxt = [title, get('仕事内容'), get('勤務地')].join(' ');
        const v = {
          Id: 'GK-' + ids[i], Account_Text__c: COMPANY, JobName__c: title, JobSituation__c: '採用中',
          EmploymentStatus__c: get('雇用形態'), WorkLocation__c: [...new Set(PREFS.filter(p => addr.includes(p)))].join(';'), Address__c: addr,
          CompensationSystemDetails__c: comp, BusinessContents__c: get('仕事内容'), AdoptionElements__c: get('必要業務経験'),
          WorkingTime__c: get('勤務時間'), HolidayVacation__c: [lab('年間休日'), get('休日休暇')].filter(String).join('\n\n'),
          WelfareOfficer__c: [lab('諸手当'), lab('福利厚生')].filter(String).join('\n\n'), Insurance__c: get('各種保険'), TrialPeriod__c: get('試用期間'),
          RemoteWork__c: /フルリモート|完全在宅|フル在宅/.test(remoteTxt) ? 'フルリモート可' : /リモート|在宅/.test(remoteTxt) && !/(リモート|在宅)(不可|なし)/.test(remoteTxt) ? '一部リモート可' : '',
          CorporateInformation__c: [get('事業内容'), lab('会社特徴'), lab('資本金'), lab('売上高')].filter(String).join('\n\n'),
          NumberOfEmployees__c: get('従業員数'), 'CorporateAccount__r.CompanyEstablishedDateFomula__c': get('設立年月'),
          'ギークリー_求人の特徴': get('求人の特徴'), 'ギークリー_求人URL': location.origin + base + 'details/' + ids[i], '取込日': today,
        };
        [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(get('想定年収'));
        [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, '', COMPANY);
        if (v.JobName__c) rows.push(H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000))); else failed++;
      } catch (e) {
        if (/ログイン/.test(String(e && e.message))) throw e;
        failed++;
      }
      await sleep(250);
    }
    if (!rows.length) throw new Error('求人が1件も読めませんでした。');
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 85 + d.n / rows.length * 15);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `ギークリーの求人を ${f.n}件 に更新しました${failed ? `（読めなかった求人 ${failed}件）` : ''}。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  // ===== 採用一括かんりくん（紹介会社画面）：連携済み企業を順に読み、募集中の求人を全件作り直す =====
  async function runKanri() {
    const T = 'かんりくんの求人を更新中';
    const H = ['Id','Account_Text__c','JobName__c','JobType__c','JobTypeDetails__c','JobSituation__c','EmploymentStatus__c','WorkLocation__c','Address__c',
      'AnnualIncomeLowerLimit__c','AnnualIncomMaxLimit__c','CompensationSystemDetails__c','BusinessContents__c','AdoptionElements__c',
      'WorkingTime__c','HolidayVacation__c','WelfareOfficer__c','RemoteWork__c','InformationUpdateDate__c',
      'かんりくん_部署','かんりくん_職種','かんりくん_募集終了日','かんりくん_求人URL','取込日'];
    const API = '/mid/employment-agency/api/';
    const getJson = async path => {
      for (let a = 1; a <= 3; a++) {
        const r = await fetch(API + path, { credentials: 'include', headers: { Accept: 'application/json' } });
        if (r.status === 401 || r.status === 403) throw new Error('かんりくんにログインしていないようです。ログインしてからもう一度押してください。');
        if (r.ok && (r.headers.get('content-type') || '').includes('json')) return r.json();
        if (a === 3) throw new Error(`かんりくんの求人が読めませんでした（${r.status}）。少し待ってからもう一度押してください。`);
        await sleep(2000 * a);
      }
    };
    // 連携済み企業は画面上部の「連携済み企業を選択」から取る
    const sel = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => /連携済み企業/.test(o.textContent)));
    const companies = sel ? [...sel.options].filter(o => /^\d+$/.test(o.value)).map(o => ({ id: o.value, name: o.textContent.trim() })) : [];
    if (!companies.length) throw new Error('連携済み企業が見つかりませんでした。かんりくんの画面（ログイン後、上に「連携済み企業を選択」がある画面）で押してください。');
    const yen = (n, u) => { n = parseFloat(String(n).replace(/,/g, '')); if (!n) return ''; return Math.round(/万/.test(u || '') || n < 10000 ? n * 10000 : n); };
    const salary = txt => {
      const t = String(txt || '').normalize('NFKC');
      let m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)?\s*[~〜～\-ー－]\s*([\d,.]+)\s*(万円|万|円)?/);
      if (m) return [yen(m[1], m[2] || m[4]), yen(m[3], m[4])];
      m = t.match(/年収[^\d\n]{0,8}([\d,.]+)\s*(万円|万|円)/);
      if (m) return [yen(m[1], m[2]), ''];
      m = t.match(/(?:^|[^月時日\d,.])([\d,.]{3,})\s*(万円|万)?\s*[~〜～\-ー－]\s*([\d,.]{3,})\s*(万円|万)/);
      return m && !/月給|月額|時給/.test(t.slice(Math.max(0, m.index - 10), m.index + 2)) && yen(m[1], m[2] || m[4]) >= 2000000 ? [yen(m[1], m[2] || m[4]), yen(m[3], m[4])] : ['', ''];
    };
    const CITY = { 名古屋: '愛知県', 横浜: '神奈川県', 川崎: '神奈川県', 札幌: '北海道', 仙台: '宮城県', 神戸: '兵庫県', 博多: '福岡県', 那覇: '沖縄県', 梅田: '大阪府', 難波: '大阪府' };
    const toPref = t => {
      t = String(t || '');
      const hit = PREFS.filter(p => t.includes(p));
      const u = t.replace(/東京/g, '〓');
      const loose = PREFS.filter(p => { const b = p.replace(/[都府県]$/, ''); return p === '東京都' ? t.includes('東京') : p === '北海道' ? false : b.length >= 2 && u.includes(b); });
      return [...new Set(hit.concat(loose, Object.keys(CITY).filter(k => t.includes(k)).map(k => CITY[k])))];
    };
    const toRow = (job, detail) => {
      const f = {};
      (detail || []).forEach(x => { const k = String(x.label || '').trim(); if (k && !(k in f)) f[k] = md(String(x.value == null ? '' : x.value)); });
      const used = new Set(['会社名', '求人タイトル', '担当者', '募集開始日時', '募集終了日時']);
      const get = k => { used.add(k); return (f[k] || '').trim(); };
      const lab = k => { const v = get(k); return v ? `【${k}】\n${v}` : ''; };
      const join = a => a.filter(String).join('\n\n');
      const area = get('エリア'), loc = get('勤務地'), pay = get('報酬（給与など）');
      const v = {
        Id: 'KR-' + job.id, Account_Text__c: f['会社名'] || job.companyName || '', JobName__c: f['求人タイトル'] || job.jobName || '', JobSituation__c: '採用中',
        EmploymentStatus__c: get('雇用形態'), Address__c: join([area ? `エリア：${area}` : '', loc]),
        CompensationSystemDetails__c: pay,
        AdoptionElements__c: join([lab('応募資格'), lab('必要スキル・経験'), lab('歓迎するスキル・経験'), lab('求める人物像')]),
        WorkingTime__c: get('勤務時間'), HolidayVacation__c: get('休日休暇'), WelfareOfficer__c: join([get('福利厚生'), lab('待遇')]),
        InformationUpdateDate__c: String(f['募集開始日時'] || '').slice(0, 10).replace(/-/g, '/'),
        'かんりくん_部署': get('部署'), 'かんりくん_職種': get('職種'), 'かんりくん_募集終了日': String(f['募集終了日時'] || '').slice(0, 10).replace(/-/g, '/'),
        'かんりくん_求人URL': location.origin + '/mid/employment-agency/jobs/info/' + job.id, '取込日': today,
      };
      v.BusinessContents__c = join([get('仕事内容'), lab('募集要項')].concat(Object.keys(f).filter(k => !used.has(k)).map(lab)));
      v.WorkLocation__c = toPref(area + '\n' + loc).join(';');
      const remoteTxt = [v.JobName__c, v.Address__c, v.WorkingTime__c, v.BusinessContents__c].join(' ');
      v.RemoteWork__c = /フルリモート|完全在宅|フル在宅/.test(remoteTxt) ? 'フルリモート可' : /リモート|在宅/.test(remoteTxt) && !/(リモート|在宅)(不可|なし)/.test(remoteTxt) ? '一部リモート可' : '';
      [v.AnnualIncomeLowerLimit__c, v.AnnualIncomMaxLimit__c] = salary(pay);
      [v.JobType__c, v.JobTypeDetails__c] = classifyJob(v.JobName__c, v['かんりくん_職種'], v.Account_Text__c);
      return H.map(h => String(v[h] == null ? '' : v[h]).slice(0, 45000));
    };
    const enc = encodeURIComponent;
    const rows = [];
    let failed = 0;
    for (let i = 0; i < companies.length; i++) {
      const c = companies[i];
      ui(T, `かんりくんから読み込み中… ${i + 1} / ${companies.length}社（求人 ${rows.length}件）`, i / companies.length * 80);
      const list = (await getJson(`jobs?area=&jobName=&jobCategory=&status=${enc('募集中')}&sortField=${enc('求人タイトル')}&sortOrder=${enc('昇順')}&selectedCompanyId=${enc(c.id)}`)).data || [];
      for (const job of list) {
        try { rows.push(toRow(Object.assign({ companyName: c.name }, job), ((await getJson('jobs/' + enc(job.id))).data || {}).detail)); }
        catch (e) { if (/ログイン/.test(String(e && e.message))) throw e; failed++; }
        await sleep(150);
      }
    }
    if (!rows.length) throw new Error('募集中の求人が1件も読めませんでした。');
    window.__kanriRows = { H, rows }; // 確認用
    if (CFG.dryRun) return `（試運転）かんりくんの求人 ${rows.length}件 を読みました。シートには書き込んでいません。`;
    await post({ stage: 'start', headers: H });
    for (let i = 0; i < rows.length; i += 200) {
      const d = await post({ stage: 'rows', rows: rows.slice(i, i + 200) });
      ui(T, `シートに書き込み中… ${d.n} / ${rows.length}件`, 80 + d.n / rows.length * 20);
    }
    const f = await post({ stage: 'finish', expect: rows.length });
    return `かんりくんの求人を ${f.n}件 に更新しました（${companies.length}社${failed ? `・読めなかった求人 ${failed}件` : ''}）。\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  try {
    const msg = SRC === 'HRMOS' ? await runHrmos() : SRC === 'HERP' ? await runHerp() : SRC === 'PERSONA' ? await runPersona() : SRC === 'JOBCAN' ? await runJobcan() : SRC === 'SONAR' ? await runSonar() : SRC === 'RIKUNABI' ? await runRikunabi() : SRC === 'GEEKLY' ? await runGeekly() : SRC === 'KANRI' ? await runKanri() : await runTalentio();
    ui('更新が終わりました', msg, 100, true);
  } catch (e) {
    ui('更新できませんでした', String(e && e.message || e), null, true);
  } finally {
    window.__jobsyncRunning = false;
  }
})();
