/**
 * カスタム Slick スワイプ処理（斜めスワイプを横のみ扱う + タップ判定の統一）
 * Copyright (c) 2026 Kodama Totsuka.
 * Licensed under the MIT License. See License.txt in the project root.
 */
// カスタム Slick スワイプ処理
// - jQuery プラグイン $.fn.slick をラップして、初期化時に prototype を差し替える
// - 斜めスワイプでも Y 成分を常に 0 扱い（curY = startY）にして、常に横スワイプとして解釈させる
// - タップ判定: options.touchTapThreshold（px）で「クリック阻止」の閾値を上書き可能にし、
//   この閾値以下を「タップ」として $slider に 'slickTouchTap' を発火（clientX, clientY 付き）。
//   エッジ／中央のめくり・バー表示は comic.js がこのイベントのみで判定する。

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
                // タップ閾値（px）。この値以下＝タップ、超えた＝ドラッグ（クリック阻止）。スワイプ成立は minSwipe で別。
                var tapThresholdDefault = 10;

                // swipeEnd: クリック阻止の閾値を touchTapThreshold にし、タップ時に slickTouchTap を発火
                // タップのみ（touchmove なし）だと swipeLength が未設定なので、離した位置から算出する
                var origSwipeEnd = Ctor.prototype.swipeEnd;
                Ctor.prototype.swipeEnd = function (ev) {
                    var l = this;
                    var tapThreshold = (l.options.touchTapThreshold != null) ? l.options.touchTapThreshold : tapThresholdDefault;
                    var cx, cy, releaseX;
                    if (ev.originalEvent && ev.originalEvent.changedTouches && ev.originalEvent.changedTouches[0]) {
                        var t = ev.originalEvent.changedTouches[0];
                        cx = t.clientX;
                        cy = t.clientY;
                        releaseX = t.pageX != null ? t.pageX : t.clientX;
                    } else if (ev.clientX != null) {
                        cx = ev.clientX;
                        cy = ev.clientY;
                        releaseX = ev.clientX;
                    }
                    if (l.touchObject.swipeLength == null && l.touchObject.startX != null && releaseX != null) {
                        l.touchObject.swipeLength = Math.round(Math.abs(releaseX - l.touchObject.startX));
                    }
                    var swipeLength = l.touchObject.swipeLength;
                    var result = origSwipeEnd.call(l, ev);
                    l.shouldClick = !(swipeLength > tapThreshold);
                    if (swipeLength <= tapThreshold && cx != null && cy != null)
                        l.$slider.trigger('slickTouchTap', { clientX: cx, clientY: cy });
                    return result;
                };

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


