# comic_viewer_tune

**[なんかいい感じのマンガビューア～slick-custom～](https://guardian.bona.jp/st/cv/)**（G-ra 氏・ver2.1）を自分用に改変したものです。
単ページ表示・見開き表示の動的な切り替えと、スマホ字の操作性向上が中心です。

---

## 背景

- 商業サイトの漫画ビューアが普及して、あまり説明しなくても分かるようになった
- 反面、普及しているのと違う仕様（拡大モードなど）では引っかかる

---

## 主な変更点

| 項目 | 元 | 改変 |
|------|-----------------------------|------------------------|
| **拡大モード** | ダブルタップか上部メニューから拡大モードに入る | ピンチで拡大 |
| **上部メニュー** | メニュー内に操作説明、拡大モード、他ボタンを設置可能 | ページャーのみ。読み込み時や上部タップ、中央タップで表示 |
| **スワイプ** | 縦成分が多いと横スワイプできない | 縦成分を無視する→全て横スワイプ扱い（`slick-swipe-custom.js` で Slick の `swipeMove` を差し替え） |
| **画面端** | タップでめくる用の領域で、スワイプできない | タップとスワイプどちらも可 |
| **単ページ表示・見開き表示の動的な切り替え** | 非対応（読み込み時にのみ切り替える） | 読み込み後のサイズ変更に対応 |

---

## git管理外のファイル

- **moto/** は改変元の参照用
- **content/** 配下は **test** と **comi_style.css / comic.js** のみ管理

---

## 使い方（改変元と同様）

1. 各作品用に **content** 以下に任意の名前のフォルダを用意し、連番画像（1.png, 2.png, …）と **index.html** を置く。
2. index.html の冒頭で `page`, `imgtype`, `title`, `site`, `copy`, `display` を設定。
3. パスに合わせて `../comi_style.css`, `../comic.js` およびルートの `slick.css`, `jquery-3.6.0.min.js`, `slick.min.mjs`, `slick-swipe-custom.js` を読み込む。

---

## ライセンス
- **改変元**: [なんかいい感じのマンガビューア～slick-custom～](https://guardian.bona.jp/st/cv/)（MIT）
- **jQuery**: [jQuery](https://jquery.com/)（MIT）
- **Slick**: [kenwheeler/slick](https://github.com/kenwheeler/slick)（MIT）

本リポジトリの改変部分もMITライセンスとします。詳細はLicense.txtを参照してください。