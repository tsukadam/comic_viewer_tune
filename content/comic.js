$(function(){
//***ブラウザ幅取得***
    var width = $(window).width();

//***端末フラグ（iPhone/iPod/Androidのとき常に単ページ扱い。iPad・Macは除外）***
    var agent = navigator.userAgent;
    var isMobileDevice =
        (agent.search(/iPhone/) != -1) ||
        (agent.search(/iPod/) != -1) ||
        (agent.search(/Android/) != -1);
    
//***first_page定数宣言（削除しても復活できるように）***
    var firstPageHtml = '<div id="first_page"></div>';
    
//***パラメータ指定***
    var num = 1;
    
    // URLのパラメータを取得（?p=n）
    var urlParam = location.search.substring(1);
    // URLにパラメータが存在する場合
    if(urlParam) {
        var param = urlParam.split('&');
        var paramArray = [];
        for (i = 0; i < param.length; i++) {
            var paramItem = param[i].split('=');
            paramArray[paramItem[0]] = paramItem[1];
        }
        num = parseInt( paramArray.p );
    }
    
    num = num - 1;
    if(width <= 768){ //768px以下のとき
    } else {//769px以上のとき
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
    
//***slick設定***
    $slider = $('.slider');
    var total_minus = 0;
    
    function sliderSetting(){
        var currentSlide = num;
        var wasInitialized = $slider.hasClass('slick-initialized');
        var wasSinglePage = false;
        var hadFirstPage = false;
        
        if (wasInitialized) {
            // 現在の表示モードを判定（first_pageの有無とslidesToShowから）
            var currentSlidesToShow = $slider.slick('getSlick').options.slidesToShow;
            wasSinglePage = (currentSlidesToShow === 1);
            hadFirstPage = ($("#first_page").length > 0);
            currentSlide = $slider.slick('slickCurrentSlide');
            $slider.slick('unslick'); // 既存スライダーを解除
        }

        // ブラウザ幅を再取得（リサイズ時にも正しく判定）
        var currentWidth = $(window).width();
        var isSinglePage = (currentWidth <= 768) || isMobileDevice;

        //ブラウザ幅分岐（リサイズ時も768px以下/以上で振り分け。iPhone/iPod/Androidは初回から単ページ）
        if(isSinglePage){ //768px以下または端末フラグ時のslickオプション＆イベント
            // 単ページ表示時は、first_pageが存在するなら常に削除
            if($("#first_page").length > 0){
                $("#first_page").remove();
                if (hadFirstPage) {
                    currentSlide = Math.max(0, currentSlide - 1);
                }
            }
            // 見開き→単ページのときだけ補正（初回はwasInitializedがfalseなのでスキップ。page未定義を避ける）
            if (wasInitialized && !wasSinglePage) {
                var page = currentSlide + 1;
                if(hadFirstPage && currentSlide === 0){
                    currentSlide = currentSlide;
                }
                else{
                    var isRightPage = (display === 0 && page % 2 === 0) || (display === 1 && page % 2 === 1);
                    if (isRightPage === 1 && currentSlide > 0) {
                        currentSlide = currentSlide - 1;
                    }
                    else if (isRightPage === 0 && currentSlide > 0) {
                        currentSlide = currentSlide;
                    }
                }
            }

            $slider.slick({
                accessibility: false,
                dots:true,
                appendDots:$('.dots'),
                prevArrow: '<div class="slide-arrow prev-arrow"><span></span></div>',
                nextArrow: '<div class="slide-arrow next-arrow"><span></span></div>',
                slidesToShow:1,
                slidesToScroll:1,
                touchThreshold: 10,
                lazyLoad: 'progressive',
                infinite:false,
                rtl:true,
                initialSlide:currentSlide,
            });
            total_minus = 1;
            $('body').addClass('single-page-view');
        } else{ 
            //769px以上またはイニシャライズ前のときのslickオプション＆イベント
            
            // 右始まりの時、first_pageが存在するなら削除
            if(display === 1 && $("#first_page").length > 0){
                $("#first_page").remove();
                currentSlide = Math.max(0, currentSlide - 1);
            }
            // 左始まりの時、first_pageがないなら先頭に追加（追加時は常にインデックスずれで+1）
            if(display === 0 && $("#first_page").length === 0){
                $slider.prepend(firstPageHtml);
                currentSlide = currentSlide + 1;
            }

            // 単ページ→見開きのときだけ補正（初回はwasInitializedがfalseなのでスキップ）
            if (wasInitialized && wasSinglePage) {
                var hasFirst = ($("#first_page").length > 0);
                var page = hasFirst ? currentSlide : currentSlide + 1;
                var isRightPage = (display === 0 && page % 2 === 0) || (display === 1 && page % 2 === 1);
                if (isRightPage === true && currentSlide > 0) {
                    currentSlide = currentSlide;
                }
                else if (isRightPage === false && currentSlide > 0) {
                    currentSlide = currentSlide-1;
                }
            }         
            
            $slider.slick({
                dots:true,
                appendDots:$('.dots'),
                prevArrow: '<div class="slide-arrow prev-arrow"><span></span></div>',
                nextArrow: '<div class="slide-arrow next-arrow"><span></span></div>',
                slidesToShow:2,
                slidesToScroll:2,
                touchThreshold: 10,
                lazyLoad: 'progressive',
                infinite:false,
                rtl:true,
                initialSlide:currentSlide,
            });
            total_minus = 2;
            $('body').removeClass('single-page-view');
        }


        // めくり領域＝矢印の幅を edgeZone のみで規定。画面上部（バックドロップ縦幅）は除外し上部と排他に
        $slider.on('setPosition', function(event, slick) {
            var zonePct = (typeof getEdgeZoneForBar === 'function' ? getEdgeZoneForBar() : 0.35) * 100;
            var topH = (typeof getTopZoneHeight === 'function' ? getTopZoneHeight() : 100);
            $('.slide-arrow').css({ width: zonePct + '%', top: topH + 'px', height: 'calc(100% - ' + topH + 'px)' });
            $('body').css({ '--arrow-zone-pct': zonePct, '--top-zone-height': topH + 'px' });
            $('.current').text(slick.currentSlide + 1);
            if(display === 1){ //右ページ始まりの時
                $('.total').text(slick.slideCount - total_minus + 1);
            } else { //左ページ始まりの時
                $('.total').text(slick.slideCount - total_minus);
            }  
        });
        $slider.on('beforeChange', function(event, slick, currentSlide, nextSlide) {
            $('.current').text(nextSlide + 1);
        });
    }
 
    sliderSetting();
    
    $(window).resize( function() {
        sliderSetting();
    });

    // 矢印ホバー：委譲で1回だけ登録（単ページ⇔見開きでSlickが作り直しても常にアローに効く）
    $(document).on('mouseenter', '.slide-arrow', function(){ $(this).addClass('hover'); })
               .on('mouseleave', '.slide-arrow', function(){ $(this).removeClass('hover'); });

    // ページバーオーバーレイ：表示・非表示のタイミングと領域は以下で一括指定
    var PAGE_BAR_CONFIG = {
        topZoneY: 100,               // 上部タップ領域の縦幅（px）。この高さ未満が「画面上部」
        breakpointWidth: 768,        // この幅以下で edgeZoneNarrow、超で edgeZoneWide
        edgeZoneNarrow: 0.35,      // 端タップ有効幅（幅の割合・狭い画面）※以前の1.5倍
        edgeZoneWide: 0.35,          // 端タップ有効幅（幅の割合・広い画面）※以前の1.5倍
        initialShowMs: 1200,         // 初回表示時間（ms）後にフェードアウト開始
        idleHideMs: 4000,            // 上部タップで表示したときの無操作で消える時間（ms）
        afterNavHideMs: 1800,        // バー内ドットでページ遷移したときの消える時間（ms）
        swipeCheckDelayMs: 150,      // スワイプでページが変わったか判定する遅延（ms）。この時間後にスライドが同じならバー表示
        fadeInDurationMs: 350,       // バーが「出る」ときのフェード時間（ms）
        fadeOutDurationMs: 800,      // バーが「消える」ときのフェード時間（ms）（初回以外）
        initialFadeOutDurationMs: 1000  // 初回リロード時にバーが消えるときだけこの時間（ms）
    };
    var $pageBarOverlay = $('#page-bar-overlay');
    var $body = $('body');
    /** 現在の表示モードに応じた端ゾーン割合。単ページ＝Narrow、見開き＝Wide（中央＝幅から左右端を引いた残り） */
    function getEdgeZoneForBar() {
        try {
            if ($slider.hasClass('slick-initialized')) {
                var n = $slider.slick('getSlick').options.slidesToShow;
                return n === 1 ? PAGE_BAR_CONFIG.edgeZoneNarrow : PAGE_BAR_CONFIG.edgeZoneWide;
            }
        } catch (e) {}
        // フォールバック: クリック／タップと同じくスライダー実幅で判定（window幅だと単ページ時ずれる）
        var r = $slider[0] && $slider[0].getBoundingClientRect();
        var w = (r && r.width) ? r.width : $(window).width();
        return w <= PAGE_BAR_CONFIG.breakpointWidth ? PAGE_BAR_CONFIG.edgeZoneNarrow : PAGE_BAR_CONFIG.edgeZoneWide;
    }
    var pageBarHideTimer = null;
    var pageBarTouchStartSlide = null;
    var pageBarCachedHeight = 0; // バー表示時に縦幅をキャッシュ（上部「バーを出す」ゾーンと同一にする）
    function getTopZoneHeight() { return pageBarCachedHeight || PAGE_BAR_CONFIG.topZoneY; }
    function isLastPageInteractive(el) { return el && $(el).closest('#last_page').length && $(el).closest('a, button, input').length; }
    var pageBarJustShownByTap = false;  // 表示させるタップで出した直後は、そのタップがバーに届いても遷移させない
    var pageBarJustHiddenByTap = false; // 消すタップ直後の click/touch が「出す」側に奪われないようにする
    var pageBarTransitioning = false;   // フェード中ロック用（主に消える側）
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
    if ($pageBarOverlay.length) {
        // 通常は「出るとき」のフェード時間を設定しておき、消えるときに fadeOutDurationMs に切り替える
        $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
        setTimeout(function() {
            if (pageBarTransitioning) return;
            pageBarTransitioning = true;
            pageBarCachedHeight = $pageBarOverlay.outerHeight(); // 上部ゾーン高さ＝バックドロップ縦幅
            // 初回だけはフェード時間を initialFadeOutDurationMs に上書き
            $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.initialFadeOutDurationMs / 1000) + 's');
            $pageBarOverlay.removeClass('page-bar-visible');
            $body.removeClass('page-bar-open');
            setTimeout(function() {
                // 初回フェードアウト後は「出るとき」のフェード時間に戻す
                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                pageBarTransitioning = false;
            }, PAGE_BAR_CONFIG.initialFadeOutDurationMs);
        }, PAGE_BAR_CONFIG.initialShowMs);
        $pageBarOverlay.find('.page-bar-backdrop').on('click touchend', function(e) {
            e.preventDefault();
            // 直前の「出すタップ」に紐づいたクリック／タップなら、ここでは消さない
            if (pageBarJustShownByTap) return;
            if (pageBarTransitioning) return;
            // 消すタップが行われた直後は、そのイベントが「出す」側に渡らないようフラグを立てる
            pageBarJustHiddenByTap = true;
            setTimeout(function() { pageBarJustHiddenByTap = false; }, 400);
            // バックドロップは「閉じる」のみ。左右めくりはめくり領域（矢印／端タップ）の担当。遷移はドットのみ。
            pageBarTransitioning = true;
            $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeOutDurationMs / 1000) + 's');
            $pageBarOverlay.removeClass('page-bar-visible');
            $body.removeClass('page-bar-open');
            if (pageBarHideTimer) { clearTimeout(pageBarHideTimer); pageBarHideTimer = null; }
            setTimeout(function() {
                pageBarTransitioning = false;
                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
            }, PAGE_BAR_CONFIG.fadeOutDurationMs);
        });
        $pageBarOverlay.find('.page-bar-box').on('click touchend', function(e) {
            e.stopPropagation();
            schedulePageBarHide();
        });
        // 表示させるタップで出した直後は、そのタップ（または続くclick）がバー内に届いても遷移しないよう吸収する
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
        // バー内のドットでページ遷移したら2秒で消す。遷移中に別のドットをタップしたらそのページへ遷移し直す（Slickが処理）
        $slider.on('afterChange.pageBar', function(event, slick, currentSlide) {
            if ($pageBarOverlay.hasClass('page-bar-visible')) {
                schedulePageBarHide(PAGE_BAR_CONFIG.afterNavHideMs);
            }
        });
    }

//***動作設定***
    //最初と最後の矢印のスタイルリセット(cssで非表示)
    $(".slide-arrow.slick-disabled").removeAttr("style");
    
    //もう一度読むボタン
    $(".b_button").click(function(){
        $slider.slick('slickGoTo',0);
    });
    
    // 操作ヘルプ・初期ガイドは現在未使用のため何もしない（JS側からも出さない）
//***拡大モード***
    // ブラウザのピンチ拡大縮小を優先するため、いったん拡大モードは無効化
    var enableZoomMode = false;
    function zoomSetting(){
        if (!enableZoomMode) return;
        $(".menu_show").slideUp(300);
        $slider.toggleClass("zoom");
        $(".zoomwrap").fadeToggle(300);
        $(".zoom_reset").fadeToggle(300);
        //$("html").scrollLeft(width);
    }
    $(".z_button").click(function(){
        zoomSetting();
    });
    
//***キーボード操作***
    $(document).keydown(function(e) {
        if(e.keyCode === 39){//右　前のページ
            $slider.slick('slickPrev');
        }else if(e.keyCode === 37){//左　次のページ
            $slider.slick('slickNext');
        }else if(e.keyCode === 40){//下　メニュー表示
            $(".menu_show").slideToggle(300);
        }else if(e.keyCode === 38){//上　拡大モード
            zoomSetting();
        }
    });
    
//***全画面表示・非表示***
    //全画面表示振り分け
    Element.prototype.requestFullscreen = Element.prototype[(
        Element.prototype.requestFullscreen ||
        Element.prototype.msRequestFullscreen ||
        Element.prototype.webkitRequestFullScreen ||
        Element.prototype.mozRequestFullScreen ||
        {name:null}).name] || function(){};

    document.exitFullscreen = 
        document.exitFullscreen ||
        document.msExitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        function(){};

    if(!document.fullscreenElement)
        Object.defineProperty(document, "fullscreenElement",{
            get : function(){
                return(
                    document.msFullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement || null);
            }
        });
    //表示非表示
    $(".g_button").click(function(){
        if(!document.fullscreenElement){
            $("body")[0].requestFullscreen();
            $(".g_button").val("全画面解除");
        }else{
            if(document.exitFullscreen){
                document.exitFullscreen();
                $(".g_button").val("全画面表示");
            }
        }
    });
    
//***端末別処理***
    if(agent.search(/iPhone/) != -1 || agent.search(/iPad/) != -1 || agent.search(/iPod/) != -1 || agent.search(/Android/) != -1 || (agent.search(/Macintosh/) != -1 && 'ontouchend' in document)){
        //***スマホ・タブレット時***
        //指定クラスの要素非表示
        $(".sp_none").hide();
        //menu表示非表示
        $('.menu_box').after('<div class="menu_sizeup"></div>');
        $(".menu_sizeup").click(function(){
            $(".menu_show").slideToggle(300);
        }); 
        $(".menu_button.close").click(function(){
            $(".menu_show").slideUp(300);
        });     
        $slider.click(function(){
            if ($(".menu_show").is(':visible')) {
                // menu表示の時のみ
                $(".menu_show").slideUp(300);
            }
        });
        //ダブルタップ操作*****拡大モード*****
        var tapCount = 0;
        $(".slider,.zoomwrap").on('touchstart', function(e) {
            // ピンチ開始（複数指）ではダブルタップ判定しない
            if (e.originalEvent.touches && e.originalEvent.touches.length > 1) return;
            if(!$(e.target).closest(".slide-arrow").length) {
                // タッチ範囲に矢印が含まれてない時
                // シングルタップ判定
                if( !tapCount ) {
                    ++tapCount ;
                    setTimeout(function(){
                        tapCount = 0;
                    },300);
                // ダブルタップ判定
                } else {
                    // 拡大モード無効中は何もしない（デフォルト動作も邪魔しない）
                    if (!enableZoomMode) { tapCount = 0; return; }
                    // ブラウザ機能によるズームを防止
                    e.preventDefault(); 
                    //拡大モード
                    zoomSetting();
                    //判定カウントリセット
                    tapCount = 0;
                }
            } else {
                // タッチ範囲に矢印が含まれている時
            }
        });

        // 端もスワイプ領域に含める：矢印でタッチを奪わないよう pointer-events を無効化
        $(".slide-arrow").css("pointer-events", "none");
        // 端タップ（前後送り）＆ピンチ用の座標
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
            if (!touches || touches.length === 0 || $slider.hasClass("zoom")) return;

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
            if (!pinchActive || !touches || touches.length !== 2 || $slider.hasClass("zoom")) return;

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
            if (!changed || changed.length === 0 || $slider.hasClass("zoom")) return;

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
                            duration: 200,
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

            // 単指の短いタップなら端タップとして扱う（※ズーム中は無効）
            // 画面上部（バックドロップ縦幅）はめくり判定から除外 → 領域排他
            if (!pinchZoomMode && pinchScale <= pinchMinScale + 0.01 &&
                changed.length === 1 && (!touches || touches.length === 0)) {
                if (isLastPageInteractive(e.target)) return;
                var releaseY = changed[0].clientY;
                if (releaseY < getTopZoneHeight()) return;
                var dx = changed[0].clientX - edgeTapStartX;
                var dy = releaseY - edgeTapStartY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist >= 10) return;
                var rect = $slider[0].getBoundingClientRect();
                var w = rect.width;
                var localX = edgeTapStartX - rect.left;
                var zone = getEdgeZoneForBar();
                // 左右端タップ領域： [0, w*zone) と (w*(1-zone), w]。単ページ＝Narrow、見開き＝Wide
                if (localX < w * zone) {
                    $slider.slick("slickNext");
                } else if (localX > w * (1 - zone)) {
                    $slider.slick("slickPrev");
                }
            }
        });

        // 拡大モード以外：スライダー上ではデフォルトのタッチ操作を無効化
        $(".slider").each(function() {
            this.addEventListener("touchmove", function(e) {
                if ($slider.hasClass("zoom")) return;
                // 拡大中は1本指ドラッグでパンさせるため、自前で処理してからpreventDefault
                var touches = e.touches;
                if (pinchScale > 1 && touches && touches.length === 1) {
                    var dx = touches[0].clientX - panStartX;
                    var dy = touches[0].clientY - panStartY;
                    var proposedX = panStartTX + dx;
                    var proposedY = panStartTY + dy;
                    var b = getPinchTranslateBounds();
                    var maxOver = 80; // クランプ範囲の外には最大80pxまで「遊び」を許す
                    // X方向：範囲内ならそのまま、外なら抵抗をかけつつ少しだけはみ出させる
                    if (proposedX < b.txMin) {
                        var overLeft = b.txMin - proposedX;
                        pinchTranslateX = b.txMin - Math.min(maxOver, overLeft) * 0.3;
                    } else if (proposedX > b.txMax) {
                        var overRight = proposedX - b.txMax;
                        pinchTranslateX = b.txMax + Math.min(maxOver, overRight) * 0.3;
                    } else {
                        pinchTranslateX = proposedX;
                    }
                    // Y方向も同様
                    if (proposedY < b.tyMin) {
                        var overTop = b.tyMin - proposedY;
                        pinchTranslateY = b.tyMin - Math.min(maxOver, overTop) * 0.3;
                    } else if (proposedY > b.tyMax) {
                        var overBottom = proposedY - b.tyMax;
                        pinchTranslateY = b.tyMax + Math.min(maxOver, overBottom) * 0.3;
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

        // バー表示タップは「左右端タップ領域を除いた中央領域」全高で有効（上から下まで）
        if ($pageBarOverlay.length) {
            $(document).on('touchstart.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                var touches = e.originalEvent.touches;
                if (!touches || touches.length !== 1) { pageBarTouchStartSlide = null; return; }
                var t = touches[0];
                var rect = $slider[0].getBoundingClientRect();
                var w = rect.width;
                var localX = t.clientX - rect.left;
                var zone = getEdgeZoneForBar();
                var inCenter = (localX >= w * zone && localX <= w * (1 - zone));
                var inTopZone = (t.clientY < getTopZoneHeight()); // 上部＝バックドロップ縦幅・画面幅（めくりより優先）
                if (inCenter || inTopZone) {
                    try { pageBarTouchStartSlide = $slider.slick('slickCurrentSlide'); } catch(err) { pageBarTouchStartSlide = null; }
                } else {
                    pageBarTouchStartSlide = null;
                }
            });
            $(document).on('touchend.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                var ct = e.originalEvent.changedTouches && e.originalEvent.changedTouches[0];
                if (!ct) return;
                var rect = $slider[0].getBoundingClientRect();
                var w = rect.width;
                var localX = ct.clientX - rect.left;
                var zone = getEdgeZoneForBar();
                var inBarTapArea = (localX >= w * zone && localX <= w * (1 - zone));
                var inTopZone = (ct.clientY < getTopZoneHeight());
                // 上部ゾーン（バックドロップと同じ縦幅・画面幅）：バー非表示時はここを最優先し、めくりを遮蔽してバーを出す
                if (inTopZone && !pinchZoomMode && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    var slideAtStart = pageBarTouchStartSlide;
                    setTimeout(function() {
                        if ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning) return;
                        try {
                            if ($slider.slick('slickCurrentSlide') === slideAtStart) {
                                pageBarTransitioning = true;
                                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                                $pageBarOverlay.addClass('page-bar-visible');
                                $body.addClass('page-bar-open');
                                setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
                                pageBarJustShownByTap = true;
                                setTimeout(function() { pageBarJustShownByTap = false; }, 400);
                                schedulePageBarHide();
                                setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
                            }
                        } catch(err) {}
                        pageBarTouchStartSlide = null;
                    }, PAGE_BAR_CONFIG.swipeCheckDelayMs);
                    return;
                }
                // 中央タップ：バー非表示 → 出す / バー表示中 or フェード中 → 閉じる
                if (inBarTapArea && !pinchZoomMode && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    var slideAtStart = pageBarTouchStartSlide;
                    setTimeout(function() {
                        if ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning) return;
                        try {
                            var currentSlide = $slider.slick('slickCurrentSlide');
                            if (currentSlide === slideAtStart) {
                                pageBarTransitioning = true;
                                $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                                $pageBarOverlay.addClass('page-bar-visible');
                                $body.addClass('page-bar-open');
                                setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
                                pageBarJustShownByTap = true;
                                setTimeout(function() { pageBarJustShownByTap = false; }, 400);
                                schedulePageBarHide();
                                setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
                            }
                        } catch(err) {}
                        pageBarTouchStartSlide = null;
                    }, PAGE_BAR_CONFIG.swipeCheckDelayMs);
                } else if (inBarTapArea && ($pageBarOverlay.hasClass('page-bar-visible') || pageBarTransitioning)) {
                    // バー表示中またはフェード中の中央タップで閉じる（「中央領域のタップ処理」の一部として扱う）
                    pageBarJustHiddenByTap = true;
                    setTimeout(function() { pageBarJustHiddenByTap = false; }, 400);
                    pageBarTransitioning = true;
                    $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeOutDurationMs / 1000) + 's');
                    $pageBarOverlay.removeClass('page-bar-visible');
                    $body.removeClass('page-bar-open');
                    if (pageBarHideTimer) { clearTimeout(pageBarHideTimer); pageBarHideTimer = null; }
                    setTimeout(function() {
                        pageBarTransitioning = false;
                        $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                    }, PAGE_BAR_CONFIG.fadeOutDurationMs);
                } else {
                    pageBarTouchStartSlide = null;
                }
            });
        }
    }else{
        //***PC時***
        //指定クラスの要素非表示
        $(".pc_none").hide();
        //menu表示非表示
        $(".menu_button").click(function(){
            $(".menu_show").slideToggle(300);
        });
        $(".menu_button.close").click(function(){
            $(".menu_show").slideUp(300);
        });
        $slider.click(function(){
            if ($(".menu_show").is(':visible')) {
                // menu表示の時のみ
                $(".menu_show").slideUp(300);
            }
        });

        // 画面上部（バックドロップ縦幅）はめくり判定から除外し、領域排他にする
        if ($pageBarOverlay.length) {
            document.addEventListener('click', function(e) {
                if (isLastPageInteractive(e.target)) return;
                if (!$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap &&
                    e.clientY < getTopZoneHeight() && e.target && $(e.target).closest('.slide-arrow').length) {
                    e.preventDefault();
                    e.stopPropagation();
                    pageBarTransitioning = true;
                    $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                    $pageBarOverlay.addClass('page-bar-visible');
                    $body.addClass('page-bar-open');
                    setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
                    pageBarJustShownByTap = true;
                    setTimeout(function() { pageBarJustShownByTap = false; }, 400);
                    schedulePageBarHide();
                    setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
                }
            }, true);
            $(document).on('click.pageBar', function(e) {
                if (isLastPageInteractive(e.target)) return;
                var rect = $slider[0].getBoundingClientRect();
                var w = rect.width;
                var localX = e.clientX - rect.left;
                var zone = getEdgeZoneForBar();
                var inBarTapArea = (localX >= w * zone && localX <= w * (1 - zone));
                var inTopZone = (e.clientY < getTopZoneHeight());
                // 画面上部＝バックドロップ縦幅。めくりと排他なのでここではバー表示のみ
                if (inTopZone && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    pageBarTransitioning = true;
                    $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                    $pageBarOverlay.addClass('page-bar-visible');
                    $body.addClass('page-bar-open');
                    setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
                    pageBarJustShownByTap = true;
                    setTimeout(function() { pageBarJustShownByTap = false; }, 400);
                    schedulePageBarHide();
                    setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
                    return;
                }
                if ($(e.target).closest('.slide-arrow').length) return; // めくり領域（矢印上）ならここで終了
                // バーが出ていないとき（中央領域）→ 表示
                if (inBarTapArea && !$pageBarOverlay.hasClass('page-bar-visible') && !pageBarJustHiddenByTap) {
                    pageBarTransitioning = true;
                    $pageBarOverlay.css('transition-duration', (PAGE_BAR_CONFIG.fadeInDurationMs / 1000) + 's');
                    $pageBarOverlay.addClass('page-bar-visible');
                    $body.addClass('page-bar-open');
                    setTimeout(function() { pageBarTransitioning = false; }, PAGE_BAR_CONFIG.fadeInDurationMs);
                    pageBarJustShownByTap = true;
                    setTimeout(function() { pageBarJustShownByTap = false; }, 400);
                    schedulePageBarHide();
                    setTimeout(function() { pageBarCachedHeight = $pageBarOverlay.outerHeight(); }, 0);
                }
                // バーが出ているとき → 中央クリックで閉じる（PC 用の「消すタップ」）
                else if (inBarTapArea && $pageBarOverlay.hasClass('page-bar-visible') && !pageBarTransitioning) {
                    pageBarJustHiddenByTap = true;
                    setTimeout(function() { pageBarJustHiddenByTap = false; }, 400);
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
            });
        }
        
    }
    
});

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