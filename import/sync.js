// 求人送付ツール：HRMOS・Talentioのエージェント画面で、ブックマーク「求人を更新」から読み込まれる
// （管理画面の「HRMOS・Talentio更新」で登録するブックマークが、送り先と合言葉を window.__JOBSYNC に入れてからこれを読む）
(async () => {
const JOB_RULES = [
  // 経営層
  [/CFO/, '経営・管理・人事', 'CFO'],
  [/CEO|COO|代表取締役|経営者候補|社長候補/, '経営・管理・人事', '経営者・CEO・COO'],
  [/CTO|CIO|CDO|CISO|VPoE/, '経営・管理・人事', 'CXO（IT関連）'],
  [/CHRO|CMO|CxO|執行役員|取締役/, '経営・管理・人事', 'その他CXO'],
  // 士業
  [/弁護士/, 'その他', '弁護士'],
  [/公認会計士|会計士/, 'コンサルタント・専門職', '公認会計士'],
  [/税理士/, 'コンサルタント・専門職', '税理士'],
  // 金融・投資・M&A
  [/仲介/, '金融', 'M&A（仲介）'],
  [/ベンチャーキャピタル|キャピタリスト|\bVC\b|ＶＣ/, '金融', 'VC業務'],
  [/プライベート・?エクイティ|\bPE\b|バイアウト|投資(担当|プロフェッショナル|チーム|部)|ファンド/, '金融', 'PE業務'],
  [/ストラクチャード|証券化/, '金融', 'ストラクチャードファイナンス'],
  [/プロジェクトファイナンス/, '金融', 'プロジェクトファイナンス'],
  [/M&A|Ｍ＆Ａ|M＆A|ＦＡＳ|\bFAS\b|ディール|バリュエーション|\bPMI\b|事業承継|財務アドバイザリー|トランザクション/, 'コンサルタント・専門職', 'M&A（FA）'],
  // コンサル（種類別）
  [/事業再生|ターンアラウンド|リストラクチャリング/, 'コンサルタント・専門職', '事業再生コンサルタント'],
  [/セキュリティ.*(コンサル|アドバイザ)|サイバー.*コンサル/, 'コンサルタント・専門職', 'セキュリティコンサルタント'],
  [/(財務|会計|経理|IFRS|税務|ファイナンス).*(コンサル|アドバイザ)|(コンサル|アドバイザ).*(財務|会計|IFRS)/, 'コンサルタント・専門職', '財務・会計コンサルタント'],
  [/(組織|人事|人材|チェンジ|HR).*(コンサル|変革)/, 'コンサルタント・専門職', '組織・人事コンサルタント'],
  [/(マーケティング|ブランド|CX|顧客体験).*コンサル/, 'コンサルタント・専門職', 'マーケティングコンサルタント'],
  [/(物流|SCM|サプライチェーン|ロジスティクス).*コンサル/, 'コンサルタント・専門職', '物流コンサルタント'],
  [/リスク.*コンサル|リスクアドバイザ|ガバナンス.*コンサル/, 'コンサルタント・専門職', 'リスクコンサルタント'],
  [/戦略|ストラテジ|Strategy|経営コンサル/, 'コンサルタント・専門職', '戦略コンサルタント', /コンサル|Consult|ファーム|戦略|ストラテジ/],
  [/IT|ＩＴ|DX|ＤＸ|デジタル|テクノロジー|システム|SAP|ERP|クラウド|データ|AI|ＡＩ|Salesforce|テクノロジ/, 'コンサルタント・専門職', 'ITコンサルタント', /コンサル|Consult|アドバイザ/],
  [/業務改革|BPR|業務(改善|変革)|PMO|オペレーション/, 'コンサルタント・専門職', '業務プロセスコンサルタント', /コンサル|Consult|PMO/],
  [/キャリア(アドバイザー|コンサルタント|カウンセラー)|\bCA\b|転職支援|両面/, '営業・サービス', 'キャリアコンサルタント'],
  [/コンサル|Consultant|アドバイザリー/, 'コンサルタント・専門職', 'その他'],
  // IT・エンジニア
  [/PdM|プロダクトマネ[ーー]?ジャ|プロダクトオーナー|Product Manager/i, 'IT・ゲーム・デザイン', 'PdM'],
  [/エンジニアリングマネ|\bEM\b|VPoE/, 'IT・ゲーム・デザイン', 'エンジニアリングマネージャー'],
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
  [/(プロジェクトマネ|\bPM\b|\bPL\b|PJM|プロジェクトリーダー)/, 'IT・ゲーム・デザイン', 'PM・PL(Web・オープン系)', /エンジニア|開発|システム|IT|SI|PM|PL|PJM|プロジェクト/],
  [/組込|組み込み|制御|ファームウェア|汎用機|メインフレーム/, 'IT・ゲーム・デザイン', 'SE(制御・組み込み系・汎用系)'],
  [/エンジニア|(システム|ソフトウェア|アプリ|Web|プロダクト|サービス|ゲーム)開発|開発エンジニア|プログラマ|\bSE\b|フロントエンド|バックエンド|アプリ(ケーション)?エンジニア|ソフトウェア|Engineer|Developer/i, 'IT・ゲーム・デザイン', 'SE(Web・オープン系)'],
  [/ディレクター|プロデューサー|Webディレク/, 'IT・ゲーム・デザイン', 'Webプロデューサー・ディレクター', /Web|ウェブ|サイト|コンテンツ|デジタル|ディレクター/],
  [/編集|ライター|ライティング|コンテンツ/, 'IT・ゲーム・デザイン', 'Webコンテンツ企画・編集・ライティング'],
  // 管理部門
  [/労務|給与/, '経営・管理・人事', '人事（労務）'],
  [/人事制度|制度企画|組織開発|人材開発|人材育成|育成|研修|エンゲージメント/, '経営・管理・人事', '制度企画・組織開発'],
  [/採用(担当|人事|マネ|リーダー|責任者|企画|広報|アシスタント|チーム|オペレーション|コーディネーター)|(新卒|中途|キャリア)採用|リクルーター|HRBP|HRビジネスパートナー|人事(部|担当|責任者|企画|リーダー|マネ|オープン|アシスタント|スペシャリスト|\(|\/|$|\s)|【人事】|^人事|Head of HR|People/i, '経営・管理・人事', '人事（採用）'],
  [/管理会計|予実|FP&A|FP＆A/, '経営・管理・人事', '管理会計'],
  [/税務/, '経営・管理・人事', '税務'],
  [/経理|決算|会計|アカウンティング/, '経営・管理・人事', '経理（財務会計）'],
  [/財務|ファイナンス|資金/, '経営・管理・人事', '財務'],
  [/内部監査|内部統制|監査/, '経営・管理・人事', '内部監査・内部統制'],
  [/法務|コンプライアンス|リーガル|Legal/, '経営・管理・人事', '法務・コンプライアンス'],
  [/知財|知的財産|特許/, '経営・管理・人事', '知的財産・特許'],
  [/\bIR\b|ＩＲ|インベスター/, '経営・管理・人事', 'IR'],
  [/総務|庶務|ファシリティ|秘書/, '経営・管理・人事', '総務'],
  [/購買|調達/, '経営・管理・人事', '購買・資材調達'],
  [/広報|\bPR\b|ＰＲ|宣伝|ブランディング/, 'マーケ・広告', '広報・PR・広告宣伝'],
  [/経営企画|経営戦略|経営管理|社長室/, '経営・管理・人事', '経営企画・経営戦略'],
  [/新規事業|事業開発|BizDev|ビジネスデベロップメント|アライアンス|事業推進/, '経営・管理・人事', '新規事業企画・事業開発'],
  [/事業企画|事業戦略|事業統括|事業責任者|事業部長/, '経営・管理・人事', '事業企画・事業統括'],
  // 営業・CS
  [/インサイドセールス|内勤営業|\bIS\b/, '営業・サービス', 'インサイドセールス・内勤営業'],
  [/カスタマーサクセス|\bCS\b|Customer Success/i, '営業・サービス', 'カスタマーサクセス'],
  [/カスタマーサポート|ヘルプデスク|コールセンター|コンタクトセンター/, '営業・サービス', 'カスタマーサポート・ヘルプデスク'],
  [/営業企画|セールスイネーブルメント|営業推進/, '営業・サービス', '営業企画'],
  [/代理店|パートナーセールス|パートナー営業/, '営業・サービス', '代理店営業・アライアンス'],
  [/海外営業|グローバル営業/, '営業・サービス', '海外営業'],
  [/個人営業|リテール営業|ライフプランナー|FP\b|ファイナンシャルプランナー/, '営業・サービス', '個人営業'],
  [/営業事務|アシスタント|事務/, '営業・サービス', '営業事務・アシスタント'],
  [/リクルーティングアドバイザー|\bRA\b|法人営業|営業|セールス|Sales|アカウントエグゼクティブ|アカウントマネ|\bAE\b|\bFS\b|フィールドセールス/i, '営業・サービス', '法人営業'],
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
  [/アセットマネ|\bAM\b/, '不動産・建設', 'アセットマネジメント'],
  [/プロパティマネ/, '不動産・建設', 'プロパティマネジメント'],
  [/不動産|開発プロジェクト|まちづくり/, '不動産・建設', '不動産企画・不動産開発'],
  [/(機械|電気|回路|半導体|構造|建築|ハードウェア|LSI)設計|設計者/, '機械・電気・電子・半導体', '設計'],
  [/物流|ロジスティクス|SCM/, '経営・管理・人事', '物流企画・物流管理'],
  [/講師|トレーナー/, 'コンサルタント・専門職', '講師・トレーナー'],
  [/店長|店舗/, '営業・サービス', '店舗管理・店舗運営'],
  [/企画/, '経営・管理・人事', '事業企画・事業統括'],
];
  const jobText_ = (title, sub) => [title, sub].filter(Boolean).join(' ').normalize('NFKC')
    .replace(/ビジネスセグメント[_＿]?[^\s】\]]*/g, ' ').replace(/(人事|HR|採用|人材|転職|キャリア|医療|福祉|介護)(労務)?(領域|サービス|事業|テック|Tech|業界|SaaS|プラットフォーム|メディア|ドメイン)/gi, ' ') // 「何を扱う会社か」で職種を誤判定しない
    .replace(/※\s*(経験者|ポテンシャル|中途)採用|\((経験者|ポテンシャル|中途|キャリア)採用\)|(経験者|ポテンシャル)採用|(合わせ|応じ)て?採用/g, ' '); // 募集区分の「採用」
  const classifyJob = (title, sub, company) => {
    const t = jobText_(title, sub);
    for (const [re, type, detail, need] of JOB_RULES) {
      if (re.test(t) && (!need || need.test(t))) return [type === 'IT・ゲーム・データ' ? 'IT・ゲーム・デザイン' : type, detail];
    }
    if (/コンサル|経営研究所|総研|FAS|アドバイザリー|パートナーズ/.test(String(company || '').normalize('NFKC'))) return ['コンサルタント・専門職', 'その他'];
    return ['', ''];
  };

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
  const SRC = /hrmos\.co$/.test(host) && location.pathname.startsWith('/agent') ? 'HRMOS' : /talentio\.com$/.test(host) ? 'TALENTIO' : '';
  if (!SRC) { ui('求人の更新', 'HRMOSかTalentioのエージェント画面（ログイン後）で押してください。', null, true); return; }
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
      const d = first ? await post({ stage: 'append', rows: buf }) : await post({ stage: 'upsert', rows: buf });
      added += d.added || 0; updated += d.updated || 0; buf = [];
    };
    if (first) await post({ stage: 'start', headers: H }).then(() => post({ stage: 'finish', expect: 0 })).catch(() => {});
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
    ui(T, '掲載が終わった求人を整理しています…', 95);
    const pr = await post({ stage: 'prune', keep: live.map(r => 'TL-' + r.id) });
    return `Talentioの求人を更新しました（全${pr.n}件）。\n新規 ${added}件・更新 ${updated}件・掲載終了で削除 ${pr.removed}件\n管理画面で「再読み込み」を押すと反映されます。`;
  }

  try {
    const msg = SRC === 'HRMOS' ? await runHrmos() : await runTalentio();
    ui('更新が終わりました', msg, 100, true);
  } catch (e) {
    ui('更新できませんでした', String(e && e.message || e), null, true);
  } finally {
    window.__jobsyncRunning = false;
  }
})();
