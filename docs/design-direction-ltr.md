# めくり方向 LTR 対応の設計メモ（一部実施済み）

## 目的
コンフィグでフラグを ON にすると、現在の「右→左」（RTL）のページ送りを「左→右」（LTR）に切り替えられるようにする。

- **アロー・キー**: 矢印の見た目を入れ替えるのではなく、**どのゾーン／どのキーで Next を発火させ、どれで Prev を発火させるか**を方向で入れ替える（LTR 時は右ゾーン／右キー→Next、左→Prev）。
- **スワイプ**: Slick の `rtl` を false にするだけでよい。slick-swipe-custom.js は触らない。
- **first_page**: 子要素の並び順なので、あるときは常に「最初のスライド」(index 0)。RTL/LTR で変わらない。一方で **first_page を prepend するかどうかは、RTL と LTR で display の扱いが丸ごと入れ替わる**ので、内部的に「見開きまたぎ始まり」か「見開きをまたがない」で整理する（下記）。

## 現状の整理（RTL）

- **Slick**: `rtl: true`。スライドは DOM 順で [first_page?, 1, 2, …, last_page]。表示は右から左に並び、index 0 が画面右。
- **「次」**: 読む順で次 = 視覚的に左 = index が増える = `slickNext`。
- **「前」**: 読む順で前 = 視覚的に右 = `slickPrev`。
- **HTML**: `.slider` に `dir="rtl"`（index.html で指定）。
- **first_page**: RTL では「見開きまたぎ始まり」(display===0) のときだけ prepend。1 見開き目を [空, 1p] にして 1p を左側に合わせている。「見開きをまたがない」(display===1) のときは first_page なし。
- **isSpreadPrevPage(pageNum)**（旧 isRightPage）: 見開きの**Prev 側のページ**か。RTL では結果的に右側、LTR では結果的に左側に表示される。`display` と奇偶で決まり、単ページ⇔見開き切り替え時の `initialSlide` 計算に使用。Single の対義語は Spread。
- **操作と実装**:
  - 画面左タップ → `slickNext`、右タップ → `slickPrev`
  - キー: 左 37 → `slickNext`、右 39 → `slickPrev`
  - ホイール下 → `slickNext`、上 → `slickPrev`
  - 矢印: `.next-arrow` が左、`.prev-arrow` が右（CSS）。ホバーも left→next, right→prev。

## 方針：変更を少なくする

- **Slick の rtl だけ切替える**: `rtl: false` にすると、同じ DOM 順 [0,1,2,…] が左から右に並び、`slickNext`＝右へ進む・`slickPrev`＝左へ戻る、になる。**「次／前」の意味は Slick に任せ、私たちは「画面の左右」と「次／前」の対応だけを方向フラグで反転する**のが最小変更。
- **スライド順の並び替えはしない**: 「右へ右へ」とスライドを並べ直す方式は、first_page・last_page・initialSlide・total_minus などがすべて index 前提で書かれているため影響が大きい。**DOM/index はそのままで、rtl と操作の対応だけ反転する**形を推奨。

---

## Slick の仕組みとこのビューアでの使われ方

### スライドの「渡し方」：配列ではなく DOM の子要素

- **Slick は配列を渡す API ではない**。`.slider` という 1 つの要素に対して `$('.slider').slick({ ... })` を呼ぶと、**その時点で .slider の直下にある子要素が、そのまま 1 枚 1 枚のスライド**になる。
- このビューアでは:
  1. **index.html** の `<script>` で、`$('#last_page').before('<div class="c_i">...</div>')` をページ数だけループし、**漫画画像用の div を #last_page の直前に挿入**している。
  2. 初期マークアップでは `.slider` の直下は `#first_page`（空）と `#last_page` だけ。上記のループで「1 ページ用 div, 2 ページ用 div, …, N ページ用 div」が #last_page の前に入る。
  3. **comic.js** の `sliderSetting()` で、見開きかつ左始まり(display===0)のときだけ `$slider.prepend(firstPageHtml)` して、先頭に空の `#first_page` を足す（ないときは足さない）。
- 結果として **.slider の直下の並び（＝スライドの並び）** は次のどちらかになる:
  - `[#first_page, 1p用div, 2p用div, …, Np用div, #last_page]`（見開きまたぎ始まりのとき）
  - `[1p用div, 2p用div, …, Np用div, #last_page]`（見開きをまたがないとき or 単ページ）
- つまり「画像群を配列で渡す」のではなく、**あらかじめ DOM で並べた子要素を、Slick が「スライド 0, 1, 2, …」として認識する**形。
- **#first_page は、あるときは常に子要素の先頭＝スライド index 0**。RTL でも LTR でも「最初のスライド」であることは変わらない。

### rtl / ltr で変わること：並び方と「次／前」の向き

- Slick は **`rtl: true`** のとき:
  - スライドを**視覚的に右から左**に並べる（index 0 が画面右端、index が増えるほど左へ並ぶ）。
  - **slickNext()** = 「次の index へ」= 表示が**左方向に**ずれる（＝ページを左にめくる）。
  - **slickPrev()** = 「前の index へ」= 表示が**右方向に**ずれる（＝ページを右に戻す）。
- **`rtl: false`**（LTR）のとき:
  - スライドを**左から右**に並べる（index 0 が画面左端、index が増えるほど右へ並ぶ）。
  - **slickNext()** = 表示が**右方向に**ずれる。
  - **slickPrev()** = 表示が**左方向に**ずれる。
- スワイプも Slick が rtl に合わせて解釈する（RTL なら「左スワイプ＝次」など）。**LTR にするときは rtl: false に変えるだけでよく、slick-swipe-custom.js は触らなくてよい**。

### 初期表示とその後の操作

- **初期ページ**: `initialSlide: currentSlide` で、表示開始時の「どの index を表示するか」を渡している。`currentSlide` は URL の `?p=n` や display・単ページ/見開きなどから計算した 0 始まりの index。
- **そのあと**:
  - **矢印**は Slick が描画するが、このビューアでは矢印は `pointer-events: none` で、**画面の左右のタップ/クリック**を comic.js が getTapZone で拾い、**左→slickNext、右→slickPrev**（RTL のとき）で発火させている。
  - **スワイプ**は Slick 内部のドラッグ処理。rtl に応じて「左スワイプ＝次」などになる。
  - **キー**は comic.js の keydown で 37/39 を拾い、slickPrev / slickNext を呼んでいる。
- まとめると、「**DOM で並んだスライドを Slick が rtl/ltr で左右に並べ、initialSlide で最初の位置を指定し、以降はアロー（実装は左右タップ）やスワイプで slickNext / slickPrev が発火して左右に動く**」という流れで、今の挙動になっている。

---

## 関係個所のリスト（変更候補）

### 1. コンフィグ・入力（test/index.html で実施済み）

| 変数 | 意味 |
|------|------|
| **right_to_left** | 1 = RTL（右→左、デフォルト）, 0 = LTR（左→右）。 |
| **leftstart** | RTL 時: 1 = 見開きまたぎ, 0 = またがず。LTR 時: 1 = またがず, 0 = 見開きまたぎ。 |

- 旧 `display` を `right_to_left` と `leftstart` に置き換えた。他 index はまだ `display` のまま。comic.js は `right_to_left` / `leftstart` が未定義なら `display` から `spreadCrossingStart` を算出して互換。

---

### 2. Slick 初期化（実施済み）

| 場所 | 内容 |
|------|------|
| comic.js の `slickCommonOptions` | `rtl: directionRtl`。comic.js 冒頭で `directionRtl` を `right_to_left === 1` から算出。 |
| comic.js の `sliderSetting()` 先頭 | `.slider` の `dir` を `directionRtl ? 'rtl' : 'ltr'` で設定。 |

- スワイプの左右の意味も Slick の rtl に連動するので、**slick-swipe-custom.js は触らなくてよい**。

---

### 3. HTML の dir（実施済み）

| 場所 | 内容 |
|------|------|
| 各 index.html の `.slider` | HTML には `dir` を書かない。 |

- **実施内容**: JS の `sliderSetting()` 先頭で `$slider.attr('dir', config.directionRtl ? 'rtl' : 'ltr')` を設定する。HTML 側では `.slider` に `dir` 属性を指定しない（test/index.html では削除済み）。他 index も同様に HTML から `dir` を削除し、JS のみで制御する方針。

---

### 4. めくり領域タップ・クリック（左右と next/prev の対応）

| 場所 | 内容 |
|------|------|
| comic.js のエッジタップ（タッチ） | `edgeZone === 'left'` → slickNext、`'right'` → slickPrev。LTR 時は逆にしたい。 |
| comic.js のエッジクリック（PC） | 同様に `z === 'left'` → slickNext、`z === 'right'` → slickPrev。LTR 時は逆。 |

- **重要**: **位置の入れ替えではなく、発火関数の入れ替え**である。つまり「左ゾーンに別の UI を出す」のではなく、「左ゾーンを押したときに Next を発火させるか Prev を発火させるか」を方向で入れ替える。LTR 時は「右ゾーン→Next」「左ゾーン→Prev」になる。
- **方針**: 矢印の見た目（left-arrow / right-arrow の配置）は変えず、**どのゾーンで goNext を呼び、どのゾーンで goPrev を呼ぶか**だけを方向フラグで決める。
- **実装**: 共通の goNext / goPrev を使う前提で、`(zone === 'left' && config.directionRtl) || (zone === 'right' && !config.directionRtl)` なら goNext、そうでなければ goPrev、のように「ゾーン→発火」の対応を 1 か所で書く。
- 該当コード: タッチ側 892–893 行付近、PC 側 1007–1008 行付近。

---

#### NEXT/PREV の共通化（揃えてから発火の入れ替え）

**現状**: 「読む順の次／前」に相当する Slick の `slickNext` / `slickPrev` が、次の 4 箇所で**直接**呼ばれており、共通の関数名や変数は使っていない。

| 捲り方式 | 場所（comic.js 行付近） | 現状の呼び出し |
|----------|-------------------------|----------------|
| キー 37/39 | 399–404 | 39→slickPrev、37→slickNext |
| ホイール | 431–433 | forward→slickNext、else→slickPrev |
| エッジタップ（タッチ） | 892–893 | left→slickNext、right→slickPrev |
| エッジクリック（PC） | 1007–1008 | left→slickNext、right→slickPrev |

**方針**:  
1. **まず名前を揃える**: 「読む順の次」を `goNext()`、「読む順の前」を `goPrev()` のように共通の関数（または `$slider.slick('slickNext')` / `slick('slickPrev')` を包むラッパー）を 1 か所で定義し、上記 4 箇所すべてで `goNext` / `goPrev` を経由するようにする。  
2. **そのうえで発火の入れ替え**: 方向フラグに応じて「どのゾーン／どのキーで goNext を呼ぶか／goPrev を呼ぶか」だけを入れ替える。  
これにより「位置の入れ替え」ではなく「発火関数の入れ替え」であることがコード上も明確になり、矢印・エッジ・キーで一貫した扱いになる。

---

### 5. キーボード

| 場所 | 内容 |
|------|------|
| comic.js の keydown（37 / 39） | 現状: 39（右）= slickPrev、37（左）= slickNext。LTR では 39=Next、37=Prev が自然なので、**矢印・エッジと同様に「どのキーで goNext / goPrev を発火させるか」を方向で入れ替える**（発火関数の入れ替え）。 |

---

### 6. マウスホイール

| 場所 | 内容 |
|------|------|
| comic.js の wheel ハンドラ | 現状: forward（下）= slickNext、そうでない = slickPrev。「下＝次」は方向に依存しないとみなしてよいなら変更不要。必要なら「下＝次」の定義を方向に合わせて反転可能。 |

- 推奨: そのまま（下＝次）でよい。

---

### 7. 矢印のホバー表示

| 場所 | 内容 |
|------|------|
| comic.js の mousemove.arrowHover | 左ゾーン → .left-arrow に hover、右ゾーン → .right-arrow に hover（**位置で決める**ので、方向で入れ替えない）。 |

- 矢印は **位置名**（.left-arrow / .right-arrow）にリネーム済み。ホバーは「左ゾーン＝左矢印・右ゾーン＝右矢印」のまま。**発火だけ**が方向で入れ替わる（左ゾーンで goNext か goPrev かは LTR で逆になる）。見た目の左右を入れ替える必要はない。

---

### 8. ページバー（ドット・カウンタ）

| 場所 | 内容 |
|------|------|
| comic.js の setPosition.zone 内 | `.current` = `slick.currentSlide + 1`、`.total` は `display` で分岐。スライド index はそのままなので、「何ページ目か」の数値は方向に依存しない。 |
| Slick の appendDots | ドットの並びは Slick が rtl に合わせて並べる。`rtl: false` にすれば LTR で左から 1,2,3… になる。 |

- **結論**: ページバーは **rtl の切り替えだけでよい**可能性が高い。もし「ドットの並び順」だけ別制御したければ、後から CSS や Slick のオプションで調整する程度でよい。

---

### 9. first_page の有無・initialSlide（単ページ⇔見開き）と用語「見開きまたぎ」

| 場所 | 内容 |
|------|------|
| comic.js の `sliderSetting()` 内 | `display === 1`（見開きをまたがない）で first_page を remove、`display === 0`（見開きまたぎ）で prepend。見開き時の initialSlide は `isSpreadPrevPage(page)` で調整。 |

**用語の整理（内部的に「見開きまたぎ」で考える）**  
現在の「左始まり」「右始まり」は、方向によって first_page の要否が丸ごと入れ替わる。混乱を減らすため、**内部的には「見開きまたぎ始まり」か「見開きをまたがない」** という層で理解して書くのがよい。

- **意味**:
  - **見開きまたぎ**: 単ページ表示で「1 ページ目→2 ページ目」に進む動きが、見開き表示では**見開きの境界をまたいで**遷移する（左の見開きから右の見開きへ、またはその逆）。
  - **見開きをまたがない**: 同じ「1→2」の動きでも、見開きでは**同じ見開き内**で収まる（境界をまたがない）。

- **RTL での対応**:
  - 現在の「左始まり」(display===0) → **見開きまたぎ始まり**。1→2 で見開きをまたぐ。first_page を prepend して [空, 1p] にし、1p が左側に来るようにしている。
  - 現在の「右始まり」(display===1) → **見開きをまたがない**。1→2 で見開きをまたがない。first_page なし。

- **LTR での対応**:
  - 「左始まり」→ **見開きをまたがない**。first_page なしで [1p, 2p] からでよい。
  - 「右始まり」→ **見開きまたぎ始まり**。first_page を prepend して [空, 1p] にし、1p が右側に来るようにする。

つまり **RTL と LTR では first_page の要否が display に対して逆**になる。実装では、**「見開きまたぎ始まりか」を 1 変数にまとめる**とよい。例:  
`var spreadCrossingStart = directionRtl ? (display === 0) : (display === 1);`  
この `spreadCrossingStart` が true のときだけ first_page を prepend、false のときは remove（または prepend しない）。

- **isSpreadPrevPage**: 見開きの「Prev 側のページ」の定義（旧 isRightPage）。display と奇偶で決まっており、方向(rtl)は直接使っていない。Slick の rtl で左右が入れ替わるので、LTR 対応時もこの中身の変更は不要で、名前だけ「Right/Left」をやめておくと混乱しにくい。first_page の prepend/remove 条件を上記の `spreadCrossingStart` に差し替えればよい。

**first_page の要否の整理**  
見開きまたぎ × 表示モードで 4 通り:

| 見開きまたぎ | 表示 | first_page |
|-------------|------|------------|
| またぎ | 見開き | **必要** |
| またがない | 単ページ | 不要 |
| またぎ | 単ページ | 不要 |
| またがない | 見開き | 不要 |

→ **見開きまたぎかつ見開き表示のときだけ** first_page が必要。

**変更案**:
- `sliderSetting()` 内で `spreadCrossingStart`（または同等の名前）を `directionRtl` と `display` から算出する。
- first_page の prepend/remove 条件を、上記テーブルに合わせる（spreadCrossingStart && 見開き表示のときだけ prepend）。
  - 現状は「見開きかつ spreadCrossingStart」で prepend しているので、ロジックは同じ。名前を `spreadCrossingStart` にそろえる。

---

### 10. 初期の num（URL パラメータ ?p=n）の補正

| 場所 | 内容 |
|------|------|
| comic.js 冒頭（37–52 行付近） | 見開き時、`display` と奇偶で `num` を ±1 している。これは「表示すべきスライド index」を決めるため。 |

- この補正は「左始まり／右始まり」に依存しており、読む方向（RTL/LTR）とは別。**まずは変更しない**で、first_page と initialSlide の切り替えだけで様子を見るのが安全。不整合が出たら、ここも「directionRtl で分岐」を検討。

---

### 11. CSS（矢印：LeftArrow / RightArrow にリネーム済み）

| 場所 | 内容 |
|------|------|
| comi_style.css | 矢印は**位置**でクラス名を付ける: **.left-arrow**（左側）、**.right-arrow**（右側）。配置は変えない（left-arrow { left: 0 }, right-arrow { right: 0 }）。 |

- **発火は JS で「発火関数の入れ替え」**（どのゾーンで goNext / goPrev を呼ぶかを方向で決める）。**矢印の見た目の位置は RTL/LTR で変えない**。LTR 用に CSS で左右を入れ替える記述は不要（かつ混乱の元なので書かない）。

---

### 12. last_page / Adsense

- last_page は常に DOM の最後。スライド index は変えないので、**direction の影響は受けず、変更不要**でよい。

---

### 13. 「もう一度読む」ボタン（slickGoTo）

- 先頭 = first_page があるとき index 1、なければ 0。first_page の有無が方向で変わるので、**ロジックは現状のままでよい**（first_page の有無と一致する）。

---

## まとめ：最小変更でやる場合のチェックリスト

1. **コンフィグ**: index.html に `right_to_left` / `leftstart`（test では実施済み）。他 index は `display` のままでも comic.js で互換。
2. **comic.js**  
   - Slick の `rtl: config.directionRtl`。  
   - `.slider` の `dir` を JS で設定（**3 は実施済み**：HTML には書かない）。  
   - **NEXT/PREV の共通化**: キー・ホイール・エッジタップ・エッジクリックの 4 箇所で、いったん `goNext()` / `goPrev()` に揃えてから、**発火関数の入れ替え**（どのゾーン／どのキーで goNext か goPrev かを方向で決める）を実装する。位置の入れ替えではない。  
   - エッジタップ・エッジクリック：左/右ゾーン → goNext / goPrev の対応を方向で反転。  
   - キー 37/39：どのキーで goNext / goPrev を呼ぶかを方向で反転。  
   - 矢印は位置名（.left-arrow / .right-arrow）のまま。ホバーは左ゾーン＝左矢印・右ゾーン＝右矢印で変更なし。発火だけ上記の共通ロジックで方向に応じて入れ替わる。  
   - `sliderSetting()` の first_page の prepend/remove 条件を `spreadCrossingStart` で分岐（実施済み）。
3. **HTML の dir**: 実施済み。HTML には `dir` を書かず、JS の `sliderSetting()` で `.slider` に設定する。
4. **comi_style.css**: 矢印の**左右の位置は入れ替えない**。LTR 用に「左右を入れ替え」する記述は書かない（発火は JS で発火関数の入れ替えのみ）。
5. **slick-swipe-custom.js**: 触らない（Slick の rtl に任せる）。
6. **ページバー**: 特になし（rtl に連動する想定）。
7. **初期 num 補正**: まずはそのまま。不具合が出たら検討。

この範囲で、「フラグ 1 つで RTL/LTR を切り替える」設計にできる。

---

## 用語整理（リネームのみ・挙動は変えない）

実装は**まず用語・名前の整理から**行う。挙動は一切変えず、関数名・変数名・コメントだけを次のようにする。

- **RightPage → Spread の Prev 側**  
  「見開きの右側」は、より普遍的に**「見開きの Prev 側のページ」**。RTL では結果的に右側、LTR では結果的に左側に表示される。  
  - `isRightPage` → **`isSpreadPrevPage`** にリネーム。  
  - コメントの「右ページ」も「見開きの Prev 側」にそろえると混乱しにくい。

- **Single の対義語**  
  単ページ表示の対義語は **Spread**（見開き表示）でよい。

- **first_page の要否**（上記テーブル）  
  見開きまたぎかつ見開き表示のときだけ必要。またぎ＋単ページ／またがない＋見開き／またがない＋単ページのときは不要。

- **矢印：Next/Prev ではなく LeftArrow / RightArrow（位置で呼ぶ）**  
  矢印の**位置は変えず**、発火する関数だけを方向で入れ替える。そのため、next/prev ではなく**画面上的な位置**で名前を付けると混乱しにくい。  
  - **LeftArrow** = 左側の矢印（現在の .next-arrow。CSS で left: 0）。  
  - **RightArrow** = 右側の矢印（現在の .prev-arrow。CSS で right: 0）。  
  - 発火: **RTL** では LeftArrow→Next、RightArrow→Prev。**LTR** では LeftArrow→Prev、RightArrow→Next。  
  - 実装: クラス名を `.next-arrow` / `.prev-arrow` から **`.left-arrow`** / **`.right-arrow`** にリネームする。Slick の prevArrow/nextArrow オプションに渡す HTML 内のクラス名だけを left-arrow / right-arrow にすればよい。
