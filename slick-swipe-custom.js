// カスタム Slick スワイプ処理
// - jQuery プラグイン $.fn.slick をラップして、初期化時に prototype を差し替える
// - 斜めスワイプでも Y 成分を常に 0 扱い（curY = startY）にして、常に横スワイプとして解釈させる
//   ※「origSwipeMove を呼ぶ前に curY を書き換える」だけだと、origSwipeMove 内で curY が上書きされて効かないため、
//     swipeMove 自体を差し替える（slick v1.9.0 の実装をベースに縦成分を無視）

(function ($) {
    'use strict';

    if (!$.fn.slick) return;

    var originalSlick = $.fn.slick;

    $.fn.slick = function () {
        var ret = originalSlick.apply(this, arguments);

        this.each(function () {
            var inst = this.slick;
            if (!inst || inst.__swipePatched) return;

            var Ctor = inst.constructor;
            if (!Ctor.__swipePatched) {
                // slick v1.9.0 swipeMove をベースに、縦成分を無視する版へ差し替え
                Ctor.prototype.swipeMove = function (i) {
                    var e, t, o, s, n, r, l = this;
                    n = void 0 !== i.originalEvent ? i.originalEvent.touches : null;

                    // 元実装と同じガード
                    if (!l.dragging || l.scrolling || n && 1 !== n.length) return;

                    e = l.getLeft(l.currentSlide);

                    // X はそのまま取得、Y は startY に固定して「縦方向の移動なし」にする
                    l.touchObject.curX = void 0 !== n ? n[0].pageX : i.clientX;
                    l.touchObject.curY = l.touchObject.startY;

                    // 横方向の移動量だけで swipeLength を計算
                    l.touchObject.swipeLength = Math.round(
                        Math.sqrt(Math.pow(l.touchObject.curX - l.touchObject.startX, 2))
                    );

                    // 縦方向距離は 0 扱い（＝縦4pxでスクロール判定の道を塞ぐ）
                    r = 0;
                    if (l.options.verticalSwiping === !0) {
                        l.touchObject.swipeLength = r;
                    }

                    t = l.swipeDirection();

                    // 元実装どおり：一定以上動いたら preventDefault してブラウザスクロール等を抑止
                    if (void 0 !== i.originalEvent && l.touchObject.swipeLength > 4) {
                        l.swiping = !0;
                        i.preventDefault();
                    }

                    s = (l.options.rtl === !1 ? 1 : -1) *
                        (l.touchObject.curX > l.touchObject.startX ? 1 : -1);
                    if (l.options.verticalSwiping === !0) {
                        s = l.touchObject.curY > l.touchObject.startY ? 1 : -1;
                    }

                    o = l.touchObject.swipeLength;
                    l.touchObject.edgeHit = !1;

                    // edgeFriction は維持
                    if (l.options.infinite === !1 &&
                        (0 === l.currentSlide && 'right' === t ||
                            l.currentSlide >= l.getDotCount() && 'left' === t)) {
                        o = l.touchObject.swipeLength * l.options.edgeFriction;
                        l.touchObject.edgeHit = !0;
                    }

                    if (l.options.vertical === !1) {
                        l.swipeLeft = e + o * s;
                    } else {
                        l.swipeLeft = e + o * (l.$list.height() / l.listWidth) * s;
                    }
                    if (l.options.verticalSwiping === !0) {
                        l.swipeLeft = e + o * s;
                    }

                    if (l.options.fade !== !0 && l.options.touchMove !== !1) {
                        if (l.animating === !0) {
                            l.swipeLeft = null;
                            return !1;
                        }
                        l.setCSS(l.swipeLeft);
                    }
                };

                Ctor.__swipePatched = true;
            }

            inst.__swipePatched = true;
        });

        return ret;
    };

})(jQuery);


