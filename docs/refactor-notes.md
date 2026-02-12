# リファクタ検討メモ（問題点の洗い出し）

## 0. 反応領域の設計（タップ／クリック判定）

**方針**  
「上部」「めくり（左右）」「中央」の三つを **排他的** に定義し、判定は **一箇所**（`getTapZone(clientX, clientY)`）に集約する。

- **上部**: 横＝画面幅、縦＝バー縦幅（`getTopZoneHeight()`）。バックドロップと同じ。
- **めくり**: 縦＝画面高さからバー縦幅を引いた残り。横＝左右とも幅の割合（Narrow＝単ページ／Wide＝見開き、`getEdgeZoneForBar()`）。アローのクリック・ホバー・タップで同じ領域。
- **中央**: 横＝画面幅から左右めくりを引いた残り、縦＝めくりと同じ。

`comic.js` では `$slider` 直後のブロックで `PAGE_BAR_CONFIG`・`getEdgeZoneForBar`・`getTopZoneHeight`・`getTapZone` を定義し、タッチ端タップ・バー表示タップ・PC クリックなどはすべて `getTapZone` の戻り値（`'top'|'left'|'right'|'center'`）で分岐する。同じ数値の重複定義は避ける。

---

## 1. 重複している処理

### 1.1 ページバー「表示」処理（✅ 対応済み）

**対応**  
`showPageBar()` を定義し、タッチ（上部・中央）・PC（画面上部 document click・上部・中央）の各分岐から呼ぶようにした。

---

### 1.2 ページバー「非表示」（即閉じる）処理（✅ 対応済み）

**対応**  
`hidePageBarImmediate()` を定義し、バックドロップ・タッチ中央タップ・PC 中央クリックの3箇所から呼ぶようにした。`pageBarJustHiddenByTap` の設定は呼び出し元で実施。

---

### 1.3 Slick 初期化オプション（✅ 対応済み）

**対応**  
`slickCommonOptions` を定義し、単ページは `$.extend({}, slickCommonOptions, { accessibility: false, slidesToShow: 1, slidesToScroll: 1, initialSlide })`、見開きは `slidesToShow: 2, slidesToScroll: 2, initialSlide` で渡すようにした。

---

### 1.4 「右ページか」の判定（✅ 対応済み）

**対応**  
`function isRightPage(pageNum)` を定義し、見開き→単ページ・単ページ→見開きの補正の両方で使用。比較は `if (isRightPage(page))` / `if (!isRightPage(page))` に統一（2.1 も同時に解消）。

---

### 1.5 端タップ領域の判定（✅ 対応済み）

**対応**  
端タップ＝めくり領域であることをコメントで明示（`getTapZone` の JSDoc、端タップ用変数・touchend のコメント）。判定は既に `getTapZone` に集約済みのため、別ヘルパーは追加していない。

---

### 矢印の非表示（先頭の戻る・末尾の進む）（✅ 対応済み）

**対応**  
`setPosition` 内で `.slide-arrow` に width/top/height を設定したあと、`.slide-arrow.slick-disabled` の `style` を `removeAttr('style')` で外すようにした。先頭では戻る矢印、末尾では進む矢印が Slick により `slick-disabled` になるため、CSS の `display: none` が効く。

---

## 2. 分かりにくい・直した方がよい点

### 2.1 `isRightPage` の比較が `=== 1` / `=== 0` と `=== true` / `=== false` 混在（✅ 対応済み）

**対応**  
1.4 で `isRightPage(page)` 関数にした際に、呼び出し側を `if (isRightPage(page))` / `if (!isRightPage(page))` に統一した。

---

### 2.2 パラメータ解析の `paramArray` と `for` の `i` がグローバル（✅ 対応済み）

**対応**  
`for (var i = 0; ...)` に変更。`paramArray` を `urlParams` に改名し、`parseInt(urlParams['p'], 10)` で取得。`NaN` 時は `num = 1` にフォールバック。

---

### 2.3 `$slider` がグローバル（✅ 確認済み）

**対応**  
`$slider` は `var $slider = $('.slider')` で ready 内に宣言済み（他ファイルから参照なし）。コメントで「他ファイルから参照されず本 ready 内のスコープのみで使用」と明記した。

---

### 2.4 デッドコード・未使用 UI（✅ 対応済み）

**対応**  
拡大モード・メニュー表示・全画面のコードを削除（zoomSetting, enableZoomMode, z_button, g_button, menu_show / menu_box / menu_sizeup / menu_button 関連、キー 38/40）。元ファイルが別途あるため必要時は復活可とコメントで記載。

---

### 2.5 マジックナンバー（✅ 対応済み）

**対応**  
ブレークポイントは `BREAKPOINT_PX`、その他は `PAGE_BAR_CONFIG` に集約。`400`（タップフラグリセット）は `PAGE_BAR_CONFIG.tapFlagResetMs` に追加して使用。設定は冒頭コメントで「BREAKPOINT_PX と PAGE_BAR_CONFIG に集約」と明記。

---

### 2.6 `setPosition` 内の `getEdgeZoneForBar` / `getTopZoneHeight` のフォールバック（✅ 対応済み）

**対応**  
フォールバックは既に削除済み。setPosition の直前に「setPosition は Slick 初期化後に必ず呼ばれるため、getEdgeZoneForBar / getTopZoneHeight は本ファイルの定義順で常に利用可能（フォールバック不要）」とコメントを追加した。

---

## 3. 優先度の目安

| 優先度 | 項目 | 効果 |
|--------|------|------|
| 高 | 1.1 ページバー表示の関数化 | 重複が多く、修正時の抜け漏れを防げる |
| 高 | 1.2 ページバー非表示の関数化 | 同上 |
| 中 | 1.3 Slick オプション共通化 | 見通しが良くなり、変更が1箇所で済む |
| 中 | 1.4 isRightPage ヘルパー | 同じ式の重複解消と意図の明確化 |
| 低 | 1.5 端タップ領域ヘルパー | 可読性向上 |
| 低 | 2.1 isRightPage の true/false 統一 | 一貫性 |
| 低 | 2.2–2.3 変数スコープ・パラメータ | バグ予防・可読性 |
| 要判断 | 2.4 未使用 UI | 削るか残すか方針次第 |
| 低 | 2.5–2.6 定数化・コメント | 可読性・保守性 |

---

## 4. このメモの扱い

- 修正するかは任意。必要に応じてこのメモを元にチケットや TODO に落とし込むとよい。
- リファクタ時は、**まず 1.1 と 1.2 の関数化**から入ると、その後の変更が楽になる。
