# comic.js リファクタ候補メモ

現状の処理のうち、重複や煩雑で整理できる箇所のリスト。

- **保留**: 6（URL パラメータ）, 7（currentSlide 調整）
- **実施済み**: 1, 2, 3, 4, 5, 8, 9, 10, 11, 12

---

## 1. アロー用 HTML の重複

- **箇所**: 197–198行（slickCommonOptions）、246–247行（単ページ用 slick()）、276–277行（見開き用 slick()）
- **内容**: RTL/LTR に応じた `prevArrow` / `nextArrow` の HTML が 3 か所で同じパターン
- **案**: `getArrowOptions(rtl)` のような関数を 1 つ用意し、3 か所ともそこを呼ぶ

---

## 2. ページバー「出し／消し」の二重実装

- **箇所**: 966–982行（タッチ: slickTouchTap）、1030–1060行（PC: document click）
- **内容**: 「非表示なら show」「表示なら hide」「JustShownByTap / JustHiddenByTap の扱い」がほぼ同じ
- **案**: 共通の `handlePageBarTap(zone)` のような関数にまとめ、タッチ・PC の両方から呼ぶ

---

## 3. AdSense スロットを画面外に出す処理の重複

- **箇所**: 612–614行、618–620行、616・620行（catch）、730–732行（adsenseOnBeforeChange）
- **内容**: `slot.style.position = 'fixed'; left = ADSENSE_SLOT_OFFSCREEN; top = ADSENSE_SLOT_OFFSCREEN` が 3 ブロック
- **案**: `moveAdSlotOffscreen(slot)` のような関数にまとめる

---

## 4. AdSense の「ins 高さ取得」ロジックの重複

- **箇所**: 579–582行（positionSlotOverAdSpacer）、643–646行（observeAdsenseDoneThenMove 内 doPosition）
- **内容**: `(ins && ins.offsetHeight > 0) ? ins.offsetHeight : (ins && ins.getBoundingClientRect().height > 0) ? ...` が同一
- **案**: `getAdsenseInsHeight(ins, slot)` のような関数に切り出し、両方から利用

---

## 5. 端末判定の重複

- **箇所**: 6–11行（isMobileDevice / isTouchDevice）、775行（タッチ分岐の条件）
- **内容**: `agent.search(/iPhone/)` 等の並びが 2 回。775行は isTouchDevice と同一条件
- **案**: 775行を `if (isTouchDevice) { ... } else { ... }` にし、条件式は 1 か所に寄せる

---

## 6. URL パラメータの手動パース

- **箇所**: 38–48行
- **内容**: `location.search` を自前で `split('&')` / `split('=')` して解析
- **案**: `URLSearchParams` を使うと短く書ける（対応ブラウザで問題なければ）

---

## 7. sliderSetting 内の currentSlide 調整

- **箇所**: 225–248行（単ページ）、264–271行（見開き）
- **内容**: wasInitialized / wasSinglePage / hadFirstPage / isSpreadPrevPage の組み合わせで currentSlide をいじる分岐が多く追いにくい
- **案**: 「単ページ⇔見開き切り替え時の currentSlide を計算する」関数に切り出し、sliderSetting はその結果だけ使う

---

## 8. ページバー「transition 終了」の扱い

- **箇所**: schedulePageBarHide（385–389行）、showPageBar（404–407行）、hidePageBarImmediate（416–420行）
- **内容**: `pageBarTransitionEndTimer` のセット／クリアと `pageBarTransitioning = false`、`transition-duration` の戻しが似たパターンで 3 回
- **案**: 「フェード終了時に transitioning を解除し、duration を fadeIn に戻す」を 1 つの関数にまとめ、3 か所から呼ぶ

---

## 9. ピンチパンでの transform 指定の重複

- **箇所**: 866–874行、951–954行（スナップバックの step）
- **内容**: `transform` と `transform-origin` を `$slider.css({...})` で渡す同じブロックが 2 回
- **案**: `applyPinchTransform(translateX, translateY, scale)` のような関数にし、touchmove と animate step の両方から呼ぶ

---

## 10. BREAKPOINT_PX と単ページ判定

- **箇所**: 51行（num 計算）、72行（定数）、224行・344行（`(currentWidth <= BREAKPOINT_PX) || isMobileDevice`）、341行（`$(window).width() <= BREAKPOINT_PX`）
- **内容**: 「単ページか」の条件が同じ式で複数回
- **案**: `isSinglePageView()` のような 1 行関数にまとめ、上記すべてで使う（PAGE_BAR_CONFIG.breakpointWidth と BREAKPOINT_PX の関係もここに集約するとよい）

---

## 11. page-bar-overlay の有無チェック

- **箇所**: 419行、1032行などで `if ($pageBarOverlay.length)` のブロック内の処理が長い
- **内容**: ページバー用の初期化・イベントが 1 つの if ブロックにまとまっており、責務が大きい
- **案**: ページバー専用の初期化関数（例: `initPageBar()`）にまとめ、`if ($pageBarOverlay.length) { initPageBar(); }` にするだけにすると、メインの流れが読みやすくなる

---

## 12. 「first_page の有無で index を 0/1 にする」

- **箇所**: 336行（__comicDebugReload）、368行（b_button）、374行（b_button の targetIndex）
- **内容**: `($("#first_page").length > 0) ? 1 : 0` が複数回
- **案**: `getFirstSlideIndex()` のような短い関数にまとめる

---

## 実施しやすいもの（影響範囲が小さい）

- 1（アロー HTML）
- 3（AdSense 画面外）
- 4（ins 高さ）
- 5（端末判定）
- 10（単ページ判定）
- 12（first_page index）

※ 行番号は作成時点の comic.js に基づく。変更後はずれる可能性あり。
