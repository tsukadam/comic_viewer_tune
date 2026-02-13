$(function(){
//*** 設定：ブレークポイント・ページバー・タップフラグなどはここと PAGE_BAR_CONFIG に集約 ***
    var BREAKPOINT_PX = 768;

//***ブラウザ幅取得***
    var width = $(window).width();

//***端末フラグ（iPhone/iPod/Androidのとき常に単ページ扱い。iPad・Macは除外）***
    var agent = navigator.userAgent;
    var isMobileDevice =
        (agent.search(/iPhone/) != -1) ||
        (agent.search(/iPod/) != -1) ||
        (agent.search(/Android/) != -1);
    var isTouchDevice = (agent.search(/iPhone/) != -1) || (agent.search(/iPad/) != -1) || (agent.search(/iPod/) != -1) || (agent.search(/Android/) != -1) || (agent.search(/Macintosh/) != -1 && 'ontouchend' in document);
    
//***first_page定数宣言***
    var firstPageHtml = '<div id="first_page"></div>';
    
//***パラメータ指定***
    var num = 1;
    
    // URLのパラメータを取得（?p=n）
    var urlParam = location.search.substring(1);
    if (urlParam) {
        var param = urlParam.split('&');
        var urlParams = {};
        for (var i = 0; i < param.length; i++) {
            var paramItem = param[i].split('=');
            urlParams[paramItem[0]] = paramItem[1];
        }
        num = parseInt(urlParams['p'], 10);
        if (isNaN(num)) num = 1;
    }
    
    num = num - 1;
    if(width <= BREAKPOINT_PX){
    } else {
        if(display === 1){ //右ページ始まりの時
            if (num % 2 == 0) {// 偶数の処理
            }
            else {// 奇数の処理
                num = num - 1;
            }
        }else { //左ページ始まりの時
            if (num % 2 == 0) {// 偶数の処理
            }
            else {// 奇数の処理
                num = num + 1;	
            }
        }
    }
    
//***slick設定***（$slider は他ファイルから参照されず、本 ready 内のスコープのみで使用）
    var $slider = $('.slider');
    var total_minus = 0;

    // タップ/クリック反応領域の定義（排他）。数値はここだけ。上部・めくり左右・中央。
    var PAGE_BAR_CONFIG = {
        topZoneY: 100,               // 上部バーの縦幅。表示時に実測で上書き
        breakpointWidth: BREAKPOINT_PX, // この幅以下で単ページ表示、超えたら見開き表示
        edgeZoneNarrow: 0.35,        // めくりタップ領域の左右幅（割合）。単ページ時
        edgeZoneWide: 0.35,          // めくりタップ領域の左右幅（割合）。見開き時
        initialShowMs: 1200,         // 初回表示後、この時間でバーを非表示にする（ms）
        idleHideMs: 4000,            // バー表示中の無操作で非表示にするまでの時間（ms）
        afterNavHideMs: 1800,        // ドットでページ遷移後にバーを非表示にするまでの時間。続けて操作するかもしれないので少しだけ待つ（ms）
        swipeCheckDelayMs: 150,      // タッチがこの秒数以下ならタップ、超えたらスワイプと判定（ms）
        fadeInDurationMs: 350,       // バーのフェードイン時間（ms）
        fadeOutDurationMs: 800,      // バーのフェードアウト時間（ms）
        initialFadeOutDurationMs: 1000,  // バーの初回フェードアウト時間（ms）
        tapFlagResetMs: 400          // 表示/非表示タップ直後のフラグリセット待ち（ms）
    };
    // ピンチ拡大時に外にはみ出ないようにするクランプ挙動（遊び量・抵抗・スナップ復帰）
    var PINCH_PAN_CONFIG = {
        clampMaxOverPx: 80,          // クランプ範囲外に許容する遊び幅（px）
        clampResistance: 0.3,        // 範囲外に出るほど抵抗をかける係数（0〜1）
        snapBackDurationMs: 200      // 指を離した後に範囲内へ戻す時間（ms）
    };
    // 矢印表示位置（端からの距離）
    var ARROW_VISUAL_CONFIG = {
        edgePaddingSinglePx: 20,     // 単ページ時：画面端からの距離（px）
        edgePaddingWidePx: 30        // 見開き時：画面端からの距離（px）
    };
    // マウスホイール（クリックによるドラッグ/スワイプとは別）のページ送り調整
    var WHEEL_NAV_CONFIG = {
        thresholdY: 40,             // この量（累積）を超えたらページ送り
        cooldownMs: 250             // 連続送り抑止（ms）
    };
    // AdSense（最終ページ）表示制御：push は「最終ページが表示されたタイミング」で1回だけ。幅0なら短くリトライ。
    var ADSENSE_CONFIG = {
        enabled: true,
        debug: true,                // デバッグ用ログ（本番では false 推奨）
        minContainerWidthPx: 10,    // これ未満なら width0 相当としてリトライ
        retryDelayMs: 250,
        maxAttempts: 12
    };
    var $pageBarOverlay = $('#page-bar-overlay');
    var $body = $('body');
    var pageBarHideTimer = null;
    var pageBarTouchStartSlide = null;
    var pageBarCachedHeight = 0;
    var adsenseRetryTimer = null;
    var adsenseResizeTimer = null;  // リサイズ debounce 用。
    var adsenseRetryCount = 0;
    var adsenseLastSlideIndex = -1;  // 実際にスライドが変わった時だけ schedule するための前回インデックス
    var adsensePositionedOnce = false; // 初回位置合わせを rAF でやり直したか
    var adsenseStagingWidthBeforePush = 0; // push 前に ensureStagingSize で設定した幅（x-2a）。push 後再適用。表示判定はコンテナ幅 >= この値で行う
    var ADSENSE_STAGING_WIDTH_BUFFER_PX = 10; // 左右5px。アドセンスに渡す幅だけ x-2a にし、それ以下の広告が来るので閾値は不要

    function clearAdsenseRetry() {
        if (adsenseRetryTimer) { clearTimeout(adsenseRetryTimer); adsenseRetryTimer = null; }
        adsenseRetryCount = 0;
    }
    /** ins はまず #adsense-staging にあり、表示完了後に #last_page .ad-container へ移動する。staging 優先で取得。 */
    function getAdsenseIns() {
        var staging = document.getElementById('adsense-staging');
        if (staging) {
            var ins = staging.querySelector('ins.adsbygoogle');
            if (ins) return ins;
        }
        return document.querySelector('#last_page ins.adsbygoogle');
    }
    /** 仮置き用 staging の幅を .last_page_in の横幅から左右5pxバッファを引いた値にする。push 前に呼ぶ。 */
    function ensureStagingSize() {
        var staging = document.getElementById('adsense-staging');
        if (!staging) return;
        var lastPage = document.getElementById('last_page');
        var lastPageIn = document.querySelector('#last_page .last_page_in');
        var w = lastPageIn ? lastPageIn.getBoundingClientRect().width : 0;
        var lastPageW = lastPage ? lastPage.getBoundingClientRect().width : 0;
        // 読み込み時：参照元の値
        console.log('[adsense-width] 読み込み時', { lastPageInW: w, lastPageW: lastPageW });
        if (lastPageW && w && Math.abs(w - lastPageW) < 2) w = Math.round(lastPageW * 0.8);
        if (w && w > 0) w = Math.max(320, Math.round(w) - ADSENSE_STAGING_WIDTH_BUFFER_PX);
        else w = 320;
        staging.style.width = w + 'px';
        staging.style.height = '280px';
        adsenseStagingWidthBeforePush = w;
        // アドセンスに渡す時：staging に設定した幅
        console.log('[adsense-width] アドセンスに渡す時', { stagingWidth: w });
    }
    /** 画面外の座標（子が visible だと親の visibility が効かないため、非表示は位置で行う）。 */
    var ADSENSE_STAGING_OFFSCREEN = '9999px';
    /** staging の縦幅を ad-container に転写してレイアウトを確保してから、ad-container の位置に staging を重ねる。staging 内はセンタリング。
     * staging の親は body だが、left/top/width/height を ad-container.getBoundingClientRect() で与えているだけなので、
     * 「左ページのパディングに合わせて見える」のは親の overflow ではなく、その rect がすでに last_page_in の margin 等を含んだ領域だから。 */
    function positionStagingOverAdContainer() {
        var container = document.querySelector('#last_page .ad-container');
        var staging = document.getElementById('adsense-staging');
        if (!container || !staging) return;
        var stagingH = staging.offsetHeight || staging.getBoundingClientRect().height || 280;
        container.style.minHeight = stagingH + 'px';
        var rect = container.getBoundingClientRect();
        staging.style.position = 'fixed';
        staging.style.left = rect.left + 'px';
        staging.style.top = rect.top + 'px';
        staging.style.width = rect.width + 'px';
        staging.style.height = rect.height + 'px';
        staging.style.zIndex = '10';
        staging.style.display = 'flex';
        staging.style.justifyContent = 'center';
        staging.style.alignItems = 'center';
        adsenseDebugLog('staging positioned over ad-container');
    }
    /** 最終ページがアクティブかつ コンテナ幅 >= staging幅 なら表示。渡す幅を x-2a にしているのでそれ以下の広告が来る。それ以外は画面外に移す。 */
    function updateStagingVisibility() {
        var staging = document.getElementById('adsense-staging');
        if (!staging) return;
        var container = document.querySelector('#last_page .ad-container');
        try {
            var slick = $slider.slick('getSlick');
            var ins = getAdsenseIns();
            var onLast = isLastPageVisible(slick);
            var adReady = ins && isAdsenseRendered(ins) && ins.closest('#adsense-staging');
            var containerW = container ? container.getBoundingClientRect().width : 0;
            var stagingW = adsenseStagingWidthBeforePush > 0 ? adsenseStagingWidthBeforePush : (staging.getBoundingClientRect().width || 200);
            var wideEnough = containerW >= stagingW;
            console.log('[adsense-width] 幅の比較', { containerW: containerW, stagingW: stagingW, wideEnough: wideEnough });
            var showOnContainer = onLast && adReady && wideEnough;
            console.log('[adsense-width] 広告表示判定', { onLast: onLast, adReady: adReady, wideEnough: wideEnough, containerW: containerW, stagingW: stagingW, 表示する: showOnContainer });
            if (showOnContainer) {
                positionStagingOverAdContainer();
            } else {
                staging.style.position = 'fixed';
                staging.style.left = ADSENSE_STAGING_OFFSCREEN;
                staging.style.top = ADSENSE_STAGING_OFFSCREEN;
                // 広告未読込時は minHeight を 0 に。読込済みで最終ページだが幅不足で非表示にした時も 0 に（コンテナを小さくする）
                if (container && (!adReady || (onLast && !wideEnough))) container.style.minHeight = '0';
            }
        } catch (e) {
            staging.style.position = 'fixed';
            staging.style.left = ADSENSE_STAGING_OFFSCREEN;
            staging.style.top = ADSENSE_STAGING_OFFSCREEN;
            if (container) container.style.minHeight = '0';
        }
    }
    /** ins の data-adsbygoogle-status が "done" になったら広告幅を記録し、表示は updateStagingVisibility（最終ページのときだけ ad-container 位置に出す）。初回は rAF で位置をやり直す。 */
    function observeAdsenseDoneThenMove(ins) {
        if (!ins) return;
        var staging = document.getElementById('adsense-staging');
        function doPosition() {
            if (!staging) return;
            // push 前に設定した幅を再適用（AdSense が staging の幅を変えることがあるため）
            if (adsenseStagingWidthBeforePush > 0) {
                staging.style.width = adsenseStagingWidthBeforePush + 'px';
                staging.style.height = '280px';
            }
            // push 完了時点で ad-container の高さを入れておく（最終ページを開いた時に一瞬サイズ0が見えないように）
            var container = document.querySelector('#last_page .ad-container');
            if (container) {
                var stagingH = staging.offsetHeight || staging.getBoundingClientRect().height || 280;
                container.style.minHeight = stagingH + 'px';
            }
            updateStagingVisibility();
            if (!adsensePositionedOnce) {
                adsensePositionedOnce = true;
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        updateStagingVisibility();
                    });
                });
            }
        }
        if (ins.getAttribute('data-adsbygoogle-status') === 'done') {
            doPosition();
            return;
        }
        var observer = new MutationObserver(function(mutations) {
            if (ins.getAttribute('data-adsbygoogle-status') === 'done') {
                observer.disconnect();
                doPosition();
            }
        });
        observer.observe(ins, { attributes: true, attributeFilter: ['data-adsbygoogle-status'] });
    }
    function isAdsenseRendered(ins) {
        return !!(ins && ins.getAttribute('data-adsbygoogle-status') === 'done');
    }
    function adsenseDebugLog(msg, obj) {
        if (!ADSENSE_CONFIG.debug) return;
        if (obj !== undefined) console.log('[adsense]', msg, obj);
        else console.log('[adsense]', msg);
    }
    function isLastPageVisible(slick) {
        // #last_page を含む slick-slide が表示中かで判定する
        // 見開きでは最終頁がcurrentにならないかもしれないので、activeも見る
        if (!slick) return false;
        var $lastSlide = $('#last_page').closest('.slick-slide');
        return ($lastSlide.length > 0) && ($lastSlide.hasClass('slick-active') || $lastSlide.hasClass('slick-current'));
    }
    function canRenderAdsenseNow(ins) {
        if (!ADSENSE_CONFIG.enabled) return false;
        if (!ins || !ins.isConnected) return false;
        if (isAdsenseRendered(ins)) return false;
        if (!window.__adsenseScriptLoaded) return false;
        var container = ins.parentElement;
        if (!container) return false;
        if ($slider[0] && $slider[0].offsetWidth <= 0) return false;
        var cW = container.getBoundingClientRect().width;
        if (cW < ADSENSE_CONFIG.minContainerWidthPx) return false;
        return true;
    }
    function attemptRenderAdsense() {
        var ins = getAdsenseIns();
        if (!ins) return;
        // すでに描画済み: staging にあれば表示状態だけ更新（位置は最終ページのとき updateStagingVisibility で行う）。
        if (isAdsenseRendered(ins)) {
            if (ins.closest('#adsense-staging')) updateStagingVisibility();
            else adsenseDebugLog('skip (already done)');
            return;
        }
        ensureStagingSize();
        if (ADSENSE_CONFIG.debug && adsenseRetryCount === 0) {
            var container = ins.parentElement;
            var sliderEl = $slider[0];
            var listEl = sliderEl && sliderEl.querySelector && sliderEl.querySelector('.slick-list');
            var trackEl = sliderEl && sliderEl.querySelector && sliderEl.querySelector('.slick-track');
            var lastPageInEl = sliderEl && sliderEl.querySelector && sliderEl.querySelector('#last_page .last_page_in');
            adsenseDebugLog('attempt', {
                scriptLoaded: !!window.__adsenseScriptLoaded,
                hasAdsbygoogleArray: !!window.adsbygoogle,
                inStaging: !!ins.closest('#adsense-staging'),
                insStatus: ins.getAttribute('data-adsbygoogle-status'),
                containerDisplay: container ? getComputedStyle(container).display : null,
                containerWidth: container ? container.getBoundingClientRect().width : null,
                sliderWidth: (sliderEl ? sliderEl.offsetWidth : null),
                sliderHeight: (sliderEl ? sliderEl.getBoundingClientRect().height : null),
                listHeight: (listEl ? listEl.getBoundingClientRect().height : null),
                trackHeight: (trackEl ? trackEl.getBoundingClientRect().height : null),
                lastPageInHeight: (lastPageInEl ? lastPageInEl.getBoundingClientRect().height : null)
            });
        }
        if (canRenderAdsenseNow(ins)) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adsenseDebugLog('push ok (staging)');
                observeAdsenseDoneThenMove(ins);
            } catch (e) {
                adsenseDebugLog('push error', e);
            }
            return;
        }
        if (adsenseRetryCount++ >= ADSENSE_CONFIG.maxAttempts) {
            adsenseDebugLog('give up (maxAttempts reached)');
            return;
        }
        adsenseRetryTimer = setTimeout(attemptRenderAdsense, ADSENSE_CONFIG.retryDelayMs);
    }
    function scheduleRenderAdsense() {
        clearAdsenseRetry();
        adsenseDebugLog('schedule');
        attemptRenderAdsense();
    }
    function getEdgeZoneForBar() {
        try {
            if ($slider.hasClass('slick-initialized')) {
                var n = $slider.slick('getSlick').options.slidesToShow;
                return n === 1 ? PAGE_BAR_CONFIG.edgeZoneNarrow : PAGE_BAR_CONFIG.edgeZoneWide;
            }
        } catch (e) {}
        var r = $slider[0] && $slider[0].getBoundingClientRect();
        var w = (r && r.width) ? r.width : $(window).width();
        return w <= PAGE_BAR_CONFIG.breakpointWidth ? PAGE_BAR_CONFIG.edgeZoneNarrow : PAGE_BAR_CONFIG.edgeZoneWide;
    }
    function getTopZoneHeight() { return pageBarCachedHeight || PAGE_BAR_CONFIG.topZoneY; }
    /** 反応領域を排他に判定。'top'|'left'|'right'|'center'。矢印・ホバー・タップで同じ領域。'left'/'right'＝めくり領域 */
    function getTapZone(clientX, clientY) {
        if (clientY < getTopZoneHeight()) return 'top';
        var rect = $slider[0] && $slider[0].getBoundingClientRect();
        if (!rect || !rect.width) return 'center';
        var localX = clientX - rect.left;
        var zone = getEdgeZoneForBar();
        if (localX < rect.width * zone) return 'left';
        if (localX > rect.width * (1 - zone)) return 'right';
        return 'center';
    }
    
    /** 見開き時の「右ページ」か（display: 0=左始まり, 1=右始まり。pageNum は 1 始まりのページ番号） */
    function isRightPage(pageNum) {
        return (display === 0 && pageNum % 2 === 0) || (display === 1 && pageNum % 2 === 1);
    }

    var slickCommonOptions = {
        // accessibility=true だと Slick が slide の id を slick-slideXX に書き換えるため、
        // #last_page 等の固定 id を維持したいこのビューアでは常に false にする
        accessibility: false,
        dots: true,
        appendDots: $('.dots'),
        prevArrow: '<div class="slide-arrow prev-arrow"><span></span></div>',
        nextArrow: '<div class="slide-arrow next-arrow"><span></span></div>',
        touchThreshold: 10,
        lazyLoad: 'progressive',
        infinite: false,
        rtl: true
    };

    function sliderSetting(){
        var currentSlide = num;
        var wasInitialized = $slider.hasClass('slick-initialized');
        var wasSinglePage = false;
        var hadFirstPage = false;
        
        if (wasInitialized) {
            var currentSlidesToShow = $slider.slick('getSlick').options.slidesToShow;
            wasSinglePage = (currentSlidesToShow === 1);
            hadFirstPage = ($("#first_page").length > 0);
            currentSlide = $slider.slick('slickCurrentSlide');
            $slider.slick('unslick');
        }

        var currentWidth = $(window).width();
        var isSinglePage = (currentWidth <= BREAKPOINT_PX) || isMobileDevice;

        if(isSinglePage){
            if($("#first_page").length > 0){
                $("#first_page").remove();
                if (hadFirstPage) {
                    currentSlide = Math.max(0, currentSlide - 1);
                }
            }
            if (wasInitialized && !wasSinglePage) {
                var page = currentSlide + 1;
                if(hadFirstPage && currentSlide === 0){
                    currentSlide = currentSlide;
                } else {
                    if (isRightPage(page) && currentSlide > 0) {
                        currentSlide = currentSlide;
                    }
                }
            }

            $slider.slick($.extend({}, slickCommonOptions, {
                slidesToShow: 1,
                slidesToScroll: 1,
                initialSlide: currentSlide
            }));
            total_minus = 1;
            $('body').addClass('single-page-view');
        } else{ 
            if(display === 1 && $("#first_page").length > 0){
                $("#first_page").remove();
                currentSlide = Math.max(0, currentSlide - 1);
            }
            if(display === 0 && $("#first_page").length === 0){
                $slider.prepend(firstPageHtml);
                currentSlide = currentSlide + 1;
            }

            if (wasInitialized && wasSinglePage) {
                var hasFirst = ($("#first_page").length > 0);
                var page = hasFirst ? currentSlide : currentSlide + 1;
                if (isRightPage(page) && currentSlide > 0) {
                    currentSlide = currentSlide;
                } else if (!isRightPage(page) && currentSlide > 0) {
                    currentSlide = currentSlide - 1;
                }
            }         
            
            $slider.slick($.extend({}, slickCommonOptions, {
                slidesToShow: 2,
                slidesToScroll: 2,
                initialSlide: currentSlide
            }));
            total_minus = 2;
            $('body').removeClass('single-page-view');
        }

        // めくり領域＝矢印の幅・位置。setPosition は Slick 初期化後に必ず呼ばれるため、getEdgeZoneForBar / getTopZoneHeight は本ファイルの定義順で常に利用可能（フォールバック不要）
        $slider.off('setPosition.zone').on('setPosition.zone', function(event, slick) {
            var zonePct = getEdgeZoneForBar() * 100;
            var topH = getTopZoneHeight();
            $('.slide-arrow').css({ width: zonePct + '%', top: topH + 'px', height: 'calc(100% - ' + topH + 'px)' });
            $('.slide-arrow.slick-disabled').css({ visibility: 'hidden', pointerEvents: 'none' });
            $('.slide-arrow:not(.slick-disabled)').css('visibility', 'visible');
            // 矢印は常に pointer-events: none(イベントはここに書かない)
            $('.slide-arrow').css('pointer-events', 'none');
            var rect = $slider[0] && $slider[0].getBoundingClientRect();
            var arrowAreaH = (rect && rect.height > 0) ? Math.max(0, rect.height - topH) : 0;
            var edgePad = $body.hasClass('single-page-view') ? ARROW_VISUAL_CONFIG.edgePaddingSinglePx : ARROW_VISUAL_CONFIG.edgePaddingWidePx;
            $('body').css({
                '--arrow-zone-pct': zonePct,
                '--top-zone-height': topH + 'px',
                '--arrow-area-height': (arrowAreaH > 0 ? arrowAreaH + 'px' : 'calc(100vh - var(--top-zone-height, 0px))'),
                '--arrow-visual-edge-padding': edgePad + 'px'
            });
            $('.current').text(slick.currentSlide + 1);
            if(display === 1){ //右ページ始まりの時
                $('.total').text(slick.slideCount - total_minus + 1);
            } else { //左ページ始まりの時
                $('.total').text(slick.slideCount - total_minus);
            }
            updateStagingVisibility();
        });
        $slider.off('beforeChange.zone').on('beforeChange.zone', function(event, slick, currentSlide, nextSlide) {
            $('.current').text(nextSlide + 1);
        });
        // 最終ページから離れるめくりの直前に staging を画面外へ（見開きでは currentSlide が「左側」なので、表示範囲に last が含まれるかで判定）
        $slider.off('beforeChange.adsenseStaging').on('beforeChange.adsenseStaging', function(event, slick, currentSlide, nextSlide) {
            if (currentSlide === nextSlide) return;
            var $lastSlide = $('#last_page').closest('.slick-slide');
            var lastSlideIndex = $lastSlide.length ? parseInt($lastSlide.attr('data-slick-index'), 10) : -1;
            if (lastSlideIndex < 0) return;
            var n = slick.options.slidesToShow || 1;
            var lastPageVisibleNow = lastSlideIndex >= currentSlide && lastSlideIndex < currentSlide + n;
            var lastPageVisibleAfter = lastSlideIndex >= nextSlide && lastSlideIndex < nextSlide + n;
            if (lastPageVisibleNow && !lastPageVisibleAfter) {
                var staging = document.getElementById('adsense-staging');
                if (staging) {
                    staging.style.position = 'fixed';
                    staging.style.left = ADSENSE_STAGING_OFFSCREEN;
                    staging.style.top = ADSENSE_STAGING_OFFSCREEN;
                }
            }
        });

        // AdSense: push は初回ロードで 1 回だけ。ad-container 位置への表示は最終ページに来た時（updateStagingVisibility）で行う。
        adsenseLastSlideIndex = -1;
        $slider.off('afterChange.adsense').on('afterChange.adsense', function(event, slick, currentSlide) {
            if (slick.currentSlide === adsenseLastSlideIndex) return;
            adsenseLastSlideIndex = slick.currentSlide;
            if (ADSENSE_CONFIG.debug && !window.__adsenseAfterChangeSeen) {
                window.__adsenseAfterChangeSeen = true;
                var el = slick && slick.$slides ? slick.$slides.get(slick.currentSlide) : null;
                adsenseDebugLog('afterChange handler active', { currentSlide: slick ? slick.currentSlide : null, currentId: el ? el.id : null });
            }
            if (!isLastPageVisible(slick)) clearAdsenseRetry();
            updateStagingVisibility();
        });
        // 初回ロードで push。広告は staging で読み込み、最終ページに来たときに ad-container 位置に表示する。
        setTimeout(function() {
            scheduleRenderAdsense();
            try {
                var slick = $slider.slick('getSlick');
                if (slick && isLastPageVisible(slick)) adsenseLastSlideIndex = slick.currentSlide;
            } catch (e) {}
        }, 0);
    }
 
    sliderSetting();
    
    // リサイズ時は「単ページ⇔見開き」が切り替わる時だけ再初期化。それ以外は変化終了 0.5 秒後に再位置合わせ（push はしないので随時発火でもよいが、連続リサイズ時の負荷を抑えるため debounce）。
    var lastIsSinglePage = (($(window).width() <= BREAKPOINT_PX) || isMobileDevice);
    $(window).on('resize', function() {
        var nowIsSinglePage = (($(window).width() <= BREAKPOINT_PX) || isMobileDevice);
        if (nowIsSinglePage !== lastIsSinglePage) {
            lastIsSinglePage = nowIsSinglePage;
            if (adsenseResizeTimer) { clearTimeout(adsenseResizeTimer); adsenseResizeTimer = null; }
            sliderSetting();
        } else {
            if (adsenseResizeTimer) clearTimeout(adsenseResizeTimer);
            adsenseResizeTimer = setTimeout(function() {
                adsenseResizeTimer = null;
                if (!window.__comicDisableRelayout) {
                    try { $slider.slick('setPosition'); } catch (err) {}
                }
                try {
                    if ($slider.slick('getSlick') && isLastPageVisible($slider.slick('getSlick'))) {
                        positionStagingOverAdContainer();
                    }
                    updateStagingVisibility();
                } catch (e) {}
            }, 0);
        }
    });

    // 矢印ホバー：矢印は pointer-events: none のため、document の mousemove で getTapZone から .hover を付ける（PC のみ）
    if (!isTouchDevice) {
        $(document).on('mousemove.arrowHover', function(e) {
            var z = getTapZone(e.clientX, e.clientY);
            $('.slide-arrow').removeClass('hover');
            if (z === 'left') $('.slide-arrow.next-arrow').addClass('hover');
            else if (z === 'right') $('.slide-arrow.prev-arrow').addClass('hover');
        });
    }

    function isLastPageInteractive(el) { return el && $(el).closest('#last_page').length && $(el).closest('a, button, input').length; }
    var pageBarJustShownByTap = false;  // 表示させるタップで出した直後は、そのタップがバーに届いても遷移させない
    var pageBarJustHiddenByTap = false; // 消すタップ直後のタップが表示させるタップに奪われないようにする
    var pageBarTransitioning = false;   // フェード中に操作をロックする用
    function schedulePageBarHide(delayMs) {
        if (pageBarHideTimer) clearTimeout(pageBarHideTimer);
        var delay = (delayMs === undefined) ? PAGE_BAR_CONFIG.idleHideMs : delayMs;
        pageBarHideTimer = setTimeout(function() {
            if (pageBarTransitioning) return;
            pageBarTransitioning = true;
            // 消えるとき用のフェード時間に切り替え
            $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeOutDurationMs / 1000) + 's');
            $pageBarOverlay.removeClass('page-bar-visible');
            $body.removeClass('page-bar-open');
            pageBarHideTimer = null;
            setTimeout(function() {
                pageBarTransitioning = false;
                // 次に出すときのためにフェード時間を fadeIn に戻す
                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
            }, PAGE_BAR_CONFIG.fadeOutDurationMs);
        }, delay);
    }
    function showPageBar() {
        pageBarTransitioning = true;
        $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
        $pageBarOverlay.addClass('page-bar-visible');
        $body.addClass('page-bar-open');
        setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
        pageBarJustShownByTap = true;
        setTimeout(function() { pageBarJustShownByTap = false; }, PAGE_BAR_CONFIG.tapFlagResetMs);
        schedulePageBarHide();
        setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
    }
    function hidePageBarImmediate() {
        pageBarTransitioning = true;
        $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeOutDurationMs / 1000) + 's');
        $pageBarOverlay.removeClass('page-bar-visible');
        $body.removeClass('page-bar-open');
        if (pageBarHideTimer) { clearTimeout(pageBarHideTimer); pageBarHideTimer = null; }
        setTimeout(function() {
            pageBarTransitioning = false;
            $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
        }, PAGE_BAR_CONFIG.fadeOutDurationMs);
    }
    if ($pageBarOverlay.length) {
        // 通常は「出るとき」のフェード時間を設定しておき、消えるときに fadeOutDurationMs に切り替える
        $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
        setTimeout(function() {
            if (pageBarTransitioning) return;
            pageBarTransitioning = true;
            pageBarCachedHeight = $pageBarOverlay.outerHeight(); 
            $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.initialFadeOutDurationMs / 1000) + 's');
            $pageBarOverlay.removeClass('page-bar-visible');
            $body.removeClass('page-bar-open');
            setTimeout(function() {
                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                pageBarTransitioning = false;
            }, PAGE_BAR_CONFIG.initialFadeOutDurationMs);
        }, PAGE_BAR_CONFIG.initialShowMs);
        $pageBarOverlay.find('.page-bar-backdrop').on('click touchend', function(e) {
            e.preventDefault();
            if (pageBarJustShownByTap) return;
            if (pageBarTransitioning) return;
            pageBarJustHiddenByTap = true;
            setTimeout(function() { pageBarJustHiddenByTap = false; }, PAGE_BAR_CONFIG.tapFlagResetMs);
            hidePageBarImmediate();
        });
        $pageBarOverlay.find('.page-bar-box').on('click touchend', function(e) {
            e.stopPropagation();
            schedulePageBarHide();
        });
        // 表示させるタップで出した直後は、そのタップがバー内に届いても遷移しないよう吸収する
        $pageBarOverlay[0].addEventListener('click', function(e) {
            if (pageBarJustShownByTap && $(e.target).closest('.page-bar-box').length) {
                e.preventDefault();
                e.stopPropagation();
                pageBarJustShownByTap = false;
            }
        }, true);
        $pageBarOverlay[0].addEventListener('touchend', function(e) {
            if (pageBarJustShownByTap && e.target && $(e.target).closest('.page-bar-box').length) {
                e.preventDefault();
                e.stopPropagation();
                pageBarJustShownByTap = false;
            }
        }, true);
        $slider.on('afterChange.pageBar', function(event, slick, currentSlide) {
            if ($pageBarOverlay.hasClass('page-bar-visible')) {
                schedulePageBarHide(PAGE_BAR_CONFIG.afterNavHideMs);
            }
            // 遷移後にホバーを外す（タッチで「最後にタップした位置にカーソル」のように mouseover が残り mouseleave が来ないことがあるため）
            $('.slide-arrow').removeClass('hover');
        });
    }

//***動作設定***
    //もう一度読むボタン
    $(".b_button").on('click', function(e){
        e.preventDefault();
        // 見開き表示で first_page（空の調整ページ）がある場合、実際の1ページ目は index 1
        var targetIndex = ($("#first_page").length > 0) ? 1 : 0;
        try { $slider.slick('slickGoTo', targetIndex); } catch(err) {}
    });

//***キーボード操作***
    $(document).keydown(function(e) {
        if (e.keyCode === 39) {
            $slider.slick('slickPrev');
        } else if (e.keyCode === 37) {
            $slider.slick('slickNext');
        }
    });

//***マウスホイール操作（ページ送り）***
    // 判定領域（getTapZone）とは独立。ホイールは PC 操作補助として、一定量以上で1ページだけ送る。
    if (!isTouchDevice) {
        var wheelNavLocked = false;
        var wheelNavAccY = 0;
        document.addEventListener('wheel', function(e) {
            if (wheelNavLocked) return;
            if (!e.target) return;
            if (!$(e.target).closest('.slider').length) return;
            if ($(e.target).closest('.page-bar-overlay').length) return;
            if (isLastPageInteractive(e.target)) return;

            // 横スクロール（トラックパッド）っぽい場合は無視
            if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

            wheelNavAccY += e.deltaY;
            if (Math.abs(wheelNavAccY) < WHEEL_NAV_CONFIG.thresholdY) return;

            e.preventDefault();
            var forward = wheelNavAccY > 0;
            wheelNavAccY = 0;
            wheelNavLocked = true;
            setTimeout(function() { wheelNavLocked = false; }, WHEEL_NAV_CONFIG.cooldownMs);

            // 下方向スクロール＝次ページ（進む）に統一
            if (forward) $slider.slick('slickNext');
            else $slider.slick('slickPrev');
        }, { passive: false });
    }

//***端末別処理***
    if(agent.search(/iPhone/) != -1 || agent.search(/iPad/) != -1 || agent.search(/iPod/) != -1 || agent.search(/Android/) != -1 || (agent.search(/Macintosh/) != -1 && 'ontouchend' in document)){
        //***スマホ・タブレット時***
        $(".sp_none").hide();
        var edgeTapStartX = 0, edgeTapStartY = 0;
        var pinchActive = false;
        var pinchStartDist = 0;
        var pinchScale = 1;
        var pinchStartScale = 1;
        var pinchMinScale = 1;
        var pinchMaxScale = 3;
        var pinchTranslateX = 0;
        var pinchTranslateY = 0;
        var panStartX = 0;
        var panStartY = 0;
        var panStartTX = 0;
        var panStartTY = 0;
        var pinchOriginXPercent = 0;
        var pinchOriginYPercent = 0;
        var pinchZoomMode = false; // ズーム中かどうか（スワイプ無効化用）

        // 拡大時に余白が出ないよう translate の範囲を計算（transform-origin と scale から）
        function getPinchTranslateBounds() {
            if (pinchScale <= 1) return { txMin: 0, txMax: 0, tyMin: 0, tyMax: 0 };
            var el = $slider[0];
            var W = el.offsetWidth || 1;
            var H = el.offsetHeight || 1;
            var ox = pinchOriginXPercent / 100;
            var oy = pinchOriginYPercent / 100;
            var s = pinchScale;
            var oneMinusS = 1 - s;
            return {
                txMin: W * oneMinusS * (1 - ox),
                txMax: -ox * W * oneMinusS,
                tyMin: H * oneMinusS * (1 - oy),
                tyMax: -oy * H * oneMinusS
            };
        }
        function clampPinchTranslate() {
            var b = getPinchTranslateBounds();
            pinchTranslateX = Math.max(b.txMin, Math.min(b.txMax, pinchTranslateX));
            pinchTranslateY = Math.max(b.tyMin, Math.min(b.tyMax, pinchTranslateY));
        }

        // 単指：端タップ判定、複数指：ピンチ開始
        $(".slider").on("touchstart.edgeTapPinch", function(e) {
            var touches = e.originalEvent.touches;
            if (!touches || touches.length === 0) return;

            if (touches.length === 1) {
                // 端タップ用に記録
                edgeTapStartX = touches[0].clientX;
                edgeTapStartY = touches[0].clientY;
                // 拡大中のパン開始位置も記録
                panStartX = touches[0].clientX;
                panStartY = touches[0].clientY;
                panStartTX = pinchTranslateX;
                panStartTY = pinchTranslateY;
            } else if (touches.length === 2) {
                // ピンチ開始
                var dx = touches[0].clientX - touches[1].clientX;
                var dy = touches[0].clientY - touches[1].clientY;
                pinchStartDist = Math.sqrt(dx * dx + dy * dy);
                pinchStartScale = pinchScale;
                pinchActive = true;

                // ピンチ開始時の中心点を transform-origin として固定する
                var cx0 = (touches[0].clientX + touches[1].clientX) / 2;
                var cy0 = (touches[0].clientY + touches[1].clientY) / 2;
                var rect0 = $slider[0].getBoundingClientRect();
                if (rect0.width > 0 && rect0.height > 0) {
                    pinchOriginXPercent = ((cx0 - rect0.left) / rect0.width) * 100;
                    pinchOriginYPercent = ((cy0 - rect0.top) / rect0.height) * 100;
                } else {
                    pinchOriginXPercent = 0;
                    pinchOriginYPercent = 0;
                }
            }
        });

        // ピンチ中：距離からスケールを計算して transform だけ変更（レイアウトは変えない）
        $(".slider").on("touchmove.pinch", function(e) {
            var touches = e.originalEvent.touches;
            if (!pinchActive || !touches || touches.length !== 2) return;

            var dx = touches[0].clientX - touches[1].clientX;
            var dy = touches[0].clientY - touches[1].clientY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (pinchStartDist <= 0) return;

            var factor = dist / pinchStartDist;
            pinchScale = Math.max(pinchMinScale, Math.min(pinchStartScale * factor, pinchMaxScale));
            clampPinchTranslate();

            // ピンチ開始時の中心を transform-origin として固定して拡大縮小

            // スライダー全体を transform で拡大縮小（レイアウトはそのまま）
            var transformValue = (pinchScale === 1 && pinchTranslateX === 0 && pinchTranslateY === 0)
                ? ""
                : "translate(" + pinchTranslateX + "px," + pinchTranslateY + "px) scale(" + pinchScale + ")";
            $slider.css({
                transform: transformValue,
                "transform-origin": pinchOriginXPercent + "% " + pinchOriginYPercent + "%"
            });

            // ズームに入ったタイミングで Slick のスワイプを無効化
            if (!pinchZoomMode && pinchScale > 1.01) {
                pinchZoomMode = true;
                try {
                    $slider.slick('slickSetOption', 'swipe', false, false);
                    $slider.slick('slickSetOption', 'draggable', false, false);
                } catch (err) {
                    // slickSetOption が失敗しても致命的ではないので握りつぶす
                }
            }
        });

        // 指が離れたらピンチフラグをリセットし、単指タップなら端タップ処理
        $(".slider").on("touchend.edgeTapPinch touchcancel.edgeTapPinch", function(e) {
            var touches = e.originalEvent.touches;
            var changed = e.originalEvent.changedTouches;
            if (!changed || changed.length === 0) return;

            // ピンチ終了（2本指が完全に終わったタイミングなど）
            if (!touches || touches.length < 2) {
                pinchActive = false;
                // 最小スケール付近まで縮小されたら完全リセット
                if (pinchScale <= pinchMinScale + 0.01) {
                    pinchScale = 1;
                    pinchTranslateX = 0;
                    pinchTranslateY = 0;
                    $slider.css({ transform: "", "transform-origin": "" });

                    // ズーム終了時に Slick のスワイプを再有効化
                    if (pinchZoomMode) {
                        pinchZoomMode = false;
                        try {
                            $slider.slick('slickSetOption', 'swipe', true, false);
                            $slider.slick('slickSetOption', 'draggable', true, false);
                        } catch (err) {}
                    }
                }
            }

            // 2本指から1本指に減った直後は、その残った指をパンの新しい起点として再セットする
            if (touches && touches.length === 1 && pinchScale > 1) {
                panStartX = touches[0].clientX;
                panStartY = touches[0].clientY;
                panStartTX = pinchTranslateX;
                panStartTY = pinchTranslateY;
            }

            // 全ての指が離れたタイミングで、はみ出していればクランプ範囲までスナップさせる
            if ((!touches || touches.length === 0) && pinchScale > pinchMinScale + 0.01) {
                var bounds = getPinchTranslateBounds();
                var targetX = Math.max(bounds.txMin, Math.min(bounds.txMax, pinchTranslateX));
                var targetY = Math.max(bounds.tyMin, Math.min(bounds.tyMax, pinchTranslateY));
                // 既に範囲内なら何もしない
                if (targetX !== pinchTranslateX || targetY !== pinchTranslateY) {
                    var startX = pinchTranslateX;
                    var startY = pinchTranslateY;
                    var animObj = { tx: startX, ty: startY };
                    $(animObj).stop().animate(
                        { tx: targetX, ty: targetY },
                        {
                        duration: PINCH_PAN_CONFIG.snapBackDurationMs,
                            easing: "swing",
                            step: function(now, fx) {
                                if (fx.prop === "tx") {
                                    pinchTranslateX = now;
                                } else if (fx.prop === "ty") {
                                    pinchTranslateY = now;
                                }
                                var transformValue = "translate(" + pinchTranslateX + "px," + pinchTranslateY + "px) scale(" + pinchScale + ")";
                                $slider.css({
                                    transform: transformValue,
                                    "transform-origin": pinchOriginXPercent + "% " + pinchOriginYPercent + "%"
                                });
                            },
                            complete: function() {
                                pinchTranslateX = targetX;
                                pinchTranslateY = targetY;
                            }
                        }
                    );
                }
            }

            // 単指で「一定以下ならタップ・それ以外はスワイプ」：移動量 10px 未満ならめくりタップ（左/右で前後送り）
            if (!pinchZoomMode && pinchScale <= pinchMinScale + 0.01 &&
                changed.length === 1 && (!touches || touches.length === 0)) {
                if (isLastPageInteractive(e.target)) return;
                var releaseX = changed[0].clientX, releaseY = changed[0].clientY;
                var dx = releaseX - edgeTapStartX;
                var dy = releaseY - edgeTapStartY;
                if (Math.sqrt(dx * dx + dy * dy) >= 10) return;
                var edgeZone = getTapZone(releaseX, releaseY);
                if (edgeZone === 'top') return;
                if (edgeZone === 'left') { $slider.slick("slickNext"); }
                else if (edgeZone === 'right') { $slider.slick("slickPrev"); }
            }
        });

        // 拡大モード以外：スライダー上ではデフォルトのタッチ操作を無効化
        $(".slider").each(function() {
            this.addEventListener("touchmove", function(e) {
                var touches = e.touches;
                if (pinchScale > 1 && touches && touches.length === 1) {
                    var dx = touches[0].clientX - panStartX;
                    var dy = touches[0].clientY - panStartY;
                    var proposedX = panStartTX + dx;
                    var proposedY = panStartTY + dy;
                    var b = getPinchTranslateBounds();
                    var maxOver = PINCH_PAN_CONFIG.clampMaxOverPx; // クランプ範囲外の「遊び」
                    // X方向：範囲内ならそのまま、外なら抵抗をかけつつ少しだけはみ出させる
                    if (proposedX < b.txMin) {
                        var overLeft = b.txMin - proposedX;
                        pinchTranslateX = b.txMin - Math.min(maxOver, overLeft) * PINCH_PAN_CONFIG.clampResistance;
                    } else if (proposedX > b.txMax) {
                        var overRight = proposedX - b.txMax;
                        pinchTranslateX = b.txMax + Math.min(maxOver, overRight) * PINCH_PAN_CONFIG.clampResistance;
                    } else {
                        pinchTranslateX = proposedX;
                    }
                    // Y方向も同様
                    if (proposedY < b.tyMin) {
                        var overTop = b.tyMin - proposedY;
                        pinchTranslateY = b.tyMin - Math.min(maxOver, overTop) * PINCH_PAN_CONFIG.clampResistance;
                    } else if (proposedY > b.tyMax) {
                        var overBottom = proposedY - b.tyMax;
                        pinchTranslateY = b.tyMax + Math.min(maxOver, overBottom) * PINCH_PAN_CONFIG.clampResistance;
                    } else {
                        pinchTranslateY = proposedY;
                    }
                    var transformValue = "translate(" + pinchTranslateX + "px," + pinchTranslateY + "px) scale(" + pinchScale + ")";
                    $slider.css({
                        transform: transformValue,
                        "transform-origin": pinchOriginXPercent + "% " + pinchOriginYPercent + "%"
                    });
                }
                e.preventDefault();
            }, { passive: false });
        });

        // バー表示タップ
        if ($pageBarOverlay.length) {
            $(document).on('touchstart.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                var touches = e.originalEvent.touches;
                if (!touches || touches.length !== 1) { pageBarTouchStartSlide = null; return; }
                var t = touches[0];
                var tapZone = getTapZone(t.clientX, t.clientY);
                if (tapZone === 'center' || tapZone === 'top') {
                    try { pageBarTouchStartSlide = $slider.slick('slickCurrentSlide'); } catch(err) { pageBarTouchStartSlide = null; }
                } else {
                    pageBarTouchStartSlide = null;
                }
            });
            $(document).on('touchend.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                var ct = e.originalEvent.changedTouches && e.originalEvent.changedTouches[0];
                if (!ct) return;
                var tapZone = getTapZone(ct.clientX, ct.clientY);
                var inTopZone = (tapZone === 'top');
                var inBarTapArea = (tapZone === 'center');
                // 上部：バー非表示時はここを最優先
                if (inTopZone && !pinchZoomMode && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    var slideAtStart = pageBarTouchStartSlide;
                    setTimeout(function() {
                        if ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning) return;
                        try {
                            if ($slider.slick('slickCurrentSlide') === slideAtStart) showPageBar();
                        } catch(err) {}
                        pageBarTouchStartSlide = null;
                    }, PAGE_BAR_CONFIG.swipeCheckDelayMs);
                    return;
                }
                if (inBarTapArea && !pinchZoomMode && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    var slideAtStart = pageBarTouchStartSlide;
                    setTimeout(function() {
                        if ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning) return;
                        try {
                            if ($slider.slick('slickCurrentSlide') === slideAtStart) showPageBar();
                        } catch(err) {}
                        pageBarTouchStartSlide = null;
                    }, PAGE_BAR_CONFIG.swipeCheckDelayMs);
                } else if (inBarTapArea && ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning)) {
                    pageBarJustHiddenByTap = true;
                    setTimeout(function() { pageBarJustHiddenByTap = false; }, PAGE_BAR_CONFIG.tapFlagResetMs);
                    hidePageBarImmediate();
                } else {
                    pageBarTouchStartSlide = null;
                }
            });
        }
    } else {
        $(".pc_none").hide();

        if ($pageBarOverlay.length) {
            document.addEventListener('click', function(e) {
                if (isLastPageInteractive(e.target)) return;
                if (!$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap &&
                    getTapZone(e.clientX, e.clientY) === 'top' && !$(e.target).closest('.page-bar-overlay').length) {
                    e.preventDefault();
                    e.stopPropagation();
                    showPageBar();
                }
            }, true);
            $(document).on('click.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                // めくり領域へのタップ・クリックで前後送り（矢印は pointer-events: none なのでここで処理）
                if ($(e.target).closest('.slider').length && !$(e.target).closest('.page-bar-overlay').length) {
                    var z = getTapZone(e.clientX, e.clientY);
                    if (z === 'left') { $slider.slick('slickNext'); return; }
                    if (z === 'right') { $slider.slick('slickPrev'); return; }
                }
                var tapZone = getTapZone(e.clientX, e.clientY);
                var inBarTapArea = (tapZone === 'center');
                var inTopZone = (tapZone === 'top');
                if (inTopZone && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    showPageBar();
                    return;
                }
                if (inBarTapArea && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    showPageBar();
                } else if (inBarTapArea && $pageBarOverlay.hasClass('page-bar-visible') && !pageBarTransitioning) {
                    pageBarJustHiddenByTap = true;
                    setTimeout(function() { pageBarJustHiddenByTap = false; }, PAGE_BAR_CONFIG.tapFlagResetMs);
                    hidePageBarImmediate();
                }
            });
        }
        
    }
    
});

/*
This project contains code from multiple authors. Each retains their own
copyright.

The components below are each licensed under the MIT License:

  - "なんかいい感じのマンガビューア～slick-custom～" (hatsu kyugen) — MIT.
    See the /***slick-custom*** block below in this file.
  - jQuery — MIT. See jquery-3.6.0.min.js header or jquery.org/license.
  - Slick — MIT. See slick.min.js / slick.css headers or github.com/kenwheeler/slick.
  - Modifications and additional code in this project — MIT.
    Copyright (c) 2026 Kodama Totsuka.
    MIT full text in this file below.

The above list and notes are for organizational purposes only, not license detail,
except for copyright notices.

If you add your own modifications and license them under MIT, add a new entry
the list (including your copyright notice). Keep the MIT License text below as a
single shared copy.

-------------------------------------------------------------------------------
MIT License
-------------------------------------------------------------------------------

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

/***slick-custom***
https://guardian.bona.jp/st/cv/
Licensed under the MIT license.
Copyright (c) 2019 hatsu kyugen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*************/