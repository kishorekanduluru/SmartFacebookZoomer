var hoverZoomPlugins = hoverZoomPlugins || [];

var hoverZoom = {
    options:{},
    currentLink:null,
    hzImg:null,
    hzImgCss:{
        'border':'1px solid #e3e3e3',
        'line-height':0,
        'overflow':'hidden',
        'padding':'2px',
        'margin':0,
        'position':'absolute',
        'z-index':2147483647,
        'border-radius':'3px',
        'background':'-webkit-gradient(linear, left top, right bottom, from(#ffffff), to(#ededed), color-stop(0.5, #ffffff))',
        '-webkit-box-shadow':'3px 3px 6px rgba(0,0,0,0.46)'
    },
    imgLoading:null,

    loadHoverZoom:function () {
        var hz = hoverZoom,
            wnd = $(window),
            body = $(document.body),
            hzCaption = null,
            hzGallery = null,
            imgFullSize = null,
            imgThumb = null,
            mousePos = {},
            loading = false,
            loadFullSizeImageTimeout,
            pageActionShown = false,
            skipFadeIn = false,
            body100pct = true,
            linkRect = null;

        var imgDetails = {
          url:'',
          host:'',
          naturalHeight:0,
          naturalWidth:0,
          video:false
      },
            thumbDetails = {
                url:'',
                naturalHeight:0,
                naturalWidth:0
            };
        var prepareDownscaledImagesDelay = 500, prepareDownscaledImagesTimeout;
        var progressCss = {
                'opacity':'0.5',
                'position':'absolute',
                'max-height':'22px',
                'max-width':'22px',
                'left':'3px',
                'top':'3px',
                'margin':'0',
                'padding':'0',
                'border-radius':'2px'
            },
            imgFullSizeCss = {
                'opacity':'1',
                'position':'static',
                'height':'auto',
                'width':'auto',
                'left':'auto',
                'top':'auto',
                'max-height':'none',
                'max-width':'none',
                'margin':'0',
                'padding':'0',
                'border-radius':'0',
                'background-size':'100% 100%',
                'background-position':'center',
                'background-repeat':'no-repeat'
            };
        
        var firstMouseMoveAfterCursorHide = false,
            cursorHideTimeout = 0;
        var prepareImgLinksDelay = 500, prepareImgLinksTimeout;
        // Calculate optimal image position and size
        function posImg(position) {
            if (!imgFullSize) {
                return;
            }

            if (position === undefined || position.top === undefined || position.left === undefined) {
                position = {top:mousePos.top, left:mousePos.left};
            }

            var offset = 20,
                padding = 17,
                statusBarHeight = 12,
                wndWidth = window.innerWidth,
                wndHeight = window.innerHeight,
                wndScrollLeft = (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft,
                wndScrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop,
                bodyWidth = document.body.clientWidth,
                displayOnRight = (position.left - wndScrollLeft < wndWidth / 2);
                
            function posCaption() {
              if (hzCaption) {
                    hzCaption.css('max-width', imgFullSize.width());
                    if (hzCaption.height() > 20) {
                        hzCaption.css('font-weight', 'normal');
                    }
                    // This is looped 10x max just in case something
                    // goes wrong, to avoid freezing the process.
                    var i = 0;
                    while (hz.hzImg.height() > wndHeight - statusBarHeight && i++ < 10) {
                        imgFullSize.height(wndHeight - padding - statusBarHeight - hzCaption.height()).width('auto');
                        hzCaption.css('max-width', imgFullSize.width());
                    }
                }
            }

            if (displayOnRight) {
                position.left += offset;
            } else {
                position.left -= offset;
            }

            if (hz.imgLoading) {
                position.top -= 10;
                if (!displayOnRight) {
                    position.left -= 25;
                }

            } else {

                var fullZoom = options.mouseUnderlap ;

                imgFullSize.width('auto').height('auto');

                // Image natural dimensions
                imgDetails.naturalWidth = imgFullSize.width();
                imgDetails.naturalHeight = imgFullSize.height();
                if (!imgDetails.naturalWidth || !imgDetails.naturalHeight) {
                    return;
                }

                // Width adjustment
                if (fullZoom) {
                    imgFullSize.width(Math.min(imgDetails.naturalWidth, wndWidth - padding + wndScrollLeft));
                } else {
                    if (displayOnRight) {
                        if (imgDetails.naturalWidth + padding > wndWidth - position.left) {
                            imgFullSize.width(wndWidth - position.left - padding + wndScrollLeft);
                        }
                    } else {
                        if (imgDetails.naturalWidth + padding > position.left) {
                            imgFullSize.width(position.left - padding - wndScrollLeft);
                        }
                    }
                }

                // Height adjustment
                if (hz.hzImg.height() > wndHeight - padding - statusBarHeight) {
                    imgFullSize.height(wndHeight - padding - statusBarHeight).width('auto');
                }

                posCaption();

                position.top -= hz.hzImg.height() / 2;

                // Display image on the left side if the mouse is on the right
                if (!displayOnRight) {
                    position.left -= hz.hzImg.width() + padding;
                }

                // Horizontal position adjustment if full zoom
                if (fullZoom) {
                    if (displayOnRight) {
                        position.left = Math.min(position.left, wndScrollLeft + wndWidth - hz.hzImg.width() - padding);
                    } else {
                        position.left = Math.max(position.left, wndScrollLeft);
                    }
                }

                // Vertical position adjustments
                var maxTop = wndScrollTop + wndHeight - hz.hzImg.height() - padding - statusBarHeight;
                if (position.top > maxTop) {
                    position.top = maxTop;
                }
                if (position.top < wndScrollTop) {
                    position.top = wndScrollTop;
                }
            }


            // This fixes positioning when the body's width is not 100%
            if (body100pct) {
                position.left -= (wndWidth - bodyWidth) / 2;
            }

            hz.hzImg.css({top:Math.round(position.top), left:Math.round(position.left)});
        }
        

        function posWhileLoading() {
            if (loading) {
                posImg();
                if (hz.imgLoading && imgFullSize && imgFullSize.height() > 0) {
                    displayFullSizeImage();
                } else {
                    setTimeout(posWhileLoading, 100);
                }
            }
        }
    
        function hideHoverZoomImg(now) {
            if (!now && !imgFullSize || !hz.hzImg) {
                return;
            }
            imgFullSize = null;
            if (loading) {
                now = true;
            }
            hz.hzImg.stop(true, true).fadeOut(now ? 0 : options.fadeDuration, function () {
                hz.hzImg.find('video').attr('src', '');
                hzCaption = null;
                hz.imgLoading = null;
                hz.hzImg.empty();
            });
        }

        function documentMouseMove(event) {
            if (!options.extensionEnabled  || wnd.height() < 30 || wnd.width() < 30) {
                return;
            }

            var links,
                target = $(event.target),
            // Test if the action key was pressed without moving the mouse
                explicitCall = event.pageY == undefined;


            // If so, the MouseMove event was triggered programmaticaly and we don't have details
            // about the mouse position and the event target, so we use the last saved ones.
            
                mousePos = {top:event.pageY, left:event.pageX};
                links = target.parents('.hoverZoomLink');
                if (target.hasClass('hoverZoomLink')) {
                    links = links.add(target);
                }

            if (options.mouseUnderlap && target.length && mousePos && linkRect &&
                (imgFullSize && imgFullSize.length && target[0] == imgFullSize[0] ||
                    hz.hzImg && hz.hzImg.length && target[0] == hz.hzImg[0])) {
                if (mousePos.top > linkRect.top && mousePos.top < linkRect.bottom && mousePos.left > linkRect.left && mousePos.left < linkRect.right) {
                    return;
                }
            }

            if (links && links.length > 0) {
                var hoverZoomSrcIndex = links.data().hoverZoomSrcIndex || 0;
                if (links.data().hoverZoomSrc && typeof(links.data().hoverZoomSrc) != 'undefined' &&
                    links.data().hoverZoomSrc[hoverZoomSrcIndex] &&
                    typeof(links.data().hoverZoomSrc[hoverZoomSrcIndex]) != 'undefined') {
                    // Happens when the mouse goes from an image to another without hovering the page background
                    if (links.data().hoverZoomSrc[hoverZoomSrcIndex] != imgDetails.url) {
                        hideHoverZoomImg();
                    }

                    // Is the image source has not been set yet
                    if (!imgFullSize) {
                        hz.currentLink = links;
                        if (!options.actionKey) {
                            imgDetails.url = links.data().hoverZoomSrc[hoverZoomSrcIndex];
                            clearTimeout(loadFullSizeImageTimeout);

                            // If the action key has been pressed over an image, no delay is applied
                            var delay = explicitCall ? 0 : options.displayDelay;
                            loadFullSizeImageTimeout = setTimeout(loadFullSizeImage, delay);

                            loading = true;
                        }
                    } else {
                        posImg();
                    }
                }
            } else if (hz.currentLink) {
                cancelImageLoading();
            }
        }

        function loadFullSizeImage() {
            // If no image is currently displayed...
            if (!imgFullSize) {
                hz.createHzImg(true);
                hz.createImgLoading();

                imgDetails.video = (imgDetails.url.substr(imgDetails.url.length - 4) == 'webm' || imgDetails.url.substr(imgDetails.url.length - 3) == 'mp4');
                if (imgDetails.video) {
                  console.log("347");
                } else {
                    imgFullSize = $('<img style="border: none" />').appendTo(hz.hzImg).load(imgFullSizeOnLoad).error(imgFullSizeOnError).attr('src', imgDetails.url);
                }

                skipFadeIn = false;
                imgFullSize.css(progressCss);
                if (options.showWhileLoading && !imgDetails.video) {
                    posWhileLoading();
                }
                posImg();
            }
            posImg();
        }

        function imgFullSizeOnLoad() {
            // Only the last hovered link gets displayed
            if (imgDetails.url == $(imgFullSize).attr('src')) {
                loading = false;
                if (hz.imgLoading) {
                    displayFullSizeImage();
                }
            }
        }

        function initLinkRect(elem) {
            linkRect = elem.offset();
            // linkRect.bottom = linkRect.top + elem.height();
            // linkRect.right = linkRect.left + elem.width();
        }

        function displayFullSizeImage() {

            hz.imgLoading.remove();
            hz.imgLoading = null;
            hz.hzImg.stop(true, true);
            hz.hzImg.offset({top:-9000, left:-9000});    // hides the image while making it available for size calculations
            hz.hzImg.empty();

            clearTimeout(cursorHideTimeout);
            hz.hzImg.css('cursor', 'none');

            imgFullSize.css(imgFullSizeCss).appendTo(hz.hzImg).mousemove(imgFullSizeOnMouseMove);

            if (hz.currentLink) {
                // Sets up the thumbnail as a full-size background
                imgThumb = hz.currentLink;
                var lowResSrc = imgThumb.attr('src');
                if (!lowResSrc) {
                    imgThumb = hz.currentLink.find('[src]').first();
                    lowResSrc = imgThumb.attr('src');
                }
                if (!lowResSrc) {
                    imgThumb = hz.currentLink.find('[style]').first();
                    lowResSrc = hz.getThumbUrl(imgThumb);
                }
                lowResSrc = lowResSrc || 'noimage';
                if (loading && lowResSrc.indexOf('noimage') == -1) {
                    var ext = imgDetails.url.substr(imgDetails.url.length - 3).toLowerCase();
                    if (ext != 'gif' && ext != 'svg' && ext != 'png') {
                        var imgRatio = imgFullSize.width() / imgFullSize.height(),
                            thumbRatio = imgThumb.width() / imgThumb.height();
                        // The thumbnail is used as a background only if its width/height ratio is similar to the image
                        if (Math.abs(imgRatio - thumbRatio) < 0.1)
                            imgFullSize.css({'background-image':'url(' + lowResSrc + ')'});
                    }
                } else {
                    imgThumb = null;
                }

                /*if (thumb.length == 1) {
                 panningThumb = thumb.first();
                 }*/

                hz.hzImg.css('cursor', 'pointer');

                initLinkRect(imgThumb || hz.currentLink);

            }
            if (!skipFadeIn) {
                hz.hzImg.hide().fadeTo(options.fadeDuration, options.picturesOpacity);
            }

            // The image size is not yet available in the onload so I have to delay the positioning
            setTimeout(posImg, options.showWhileLoading ? 0 : 10);
            
            if (options.addToHistory && !chrome.extension.inIncognitoContext) {
                var url = hz.currentLink.context.href || imgDetails.url;
                chrome.runtime.sendMessage({action:'addUrlToHistory', url:url});
            }
        }

        function imgFullSizeOnError() {
            if (imgDetails.url == $(this).attr('src')) {
                var hoverZoomSrcIndex = hz.currentLink ? hz.currentLink.data().hoverZoomSrcIndex : 0;
                if (hz.currentLink && hoverZoomSrcIndex < hz.currentLink.data().hoverZoomSrc.length - 1) {
                    // If the link has several possible sources, we try to load the next one
                    imgFullSize.remove();
                    imgFullSize = null;
                    hoverZoomSrcIndex++;
                    hz.currentLink.data().hoverZoomSrcIndex = hoverZoomSrcIndex;
                    console.info('[HoverZoom] Failed to load image: ' + imgDetails.url + '\nTrying next one...');
                    imgDetails.url = hz.currentLink.data().hoverZoomSrc[hoverZoomSrcIndex];
                    setTimeout(loadFullSizeImage, 100);
                } else {
                    hideHoverZoomImg();
                    //hz.currentLink.removeClass('hoverZoomLink').removeData();
                    console.warn('[HoverZoom] Failed to load image: ' + imgDetails.url);
                }
            }
        }


        function hideCursor() {
            firstMouseMoveAfterCursorHide = true;
            hz.hzImg.css('cursor', 'none');
        }

        function imgFullSizeOnMouseMove() {
            if (!imgFullSize && !options.mouseUnderlap) {
                hideHoverZoomImg(true);
            }
            clearTimeout(cursorHideTimeout);
            if (!firstMouseMoveAfterCursorHide) {
                hz.hzImg.css('cursor', 'pointer');
                cursorHideTimeout = setTimeout(hideCursor, 500);
            }
            firstMouseMoveAfterCursorHide = false;
        }

        function cancelImageLoading() {
            hz.currentLink = null;
            clearTimeout(loadFullSizeImageTimeout);
            hideHoverZoomImg();
        }

        function prepareImgCaption(link) {
        }

        // Callback function called by plugins after they finished preparing the links
        function imgLinksPrepared(links) {
            
        }

        function prepareImgLinks() {
            
            pageActionShown = false;

            for (var i = 0; i < hoverZoomPlugins.length; i++) {
                hoverZoomPlugins[i].prepareImgLinks(imgLinksPrepared);
            }
            prepareImgLinksTimeout = null;

            prepareDownscaledImagesAsync();

        }

        function prepareDownscaledImagesAsync(dontResetDelay) {
            
        }

        function prepareDownscaledImages() {
        }

        function prepareImgLinksAsync(dontResetDelay) {
            
            if (!dontResetDelay) {
                prepareImgLinksDelay = 500;
            }
            clearTimeout(prepareImgLinksTimeout);
            prepareImgLinksTimeout = setTimeout(prepareImgLinks, prepareImgLinksDelay);
            prepareImgLinksDelay *= 2;
        }


        function applyOptions() {
            init();
            if (!options.extensionEnabled) {
                hideHoverZoomImg();
                $(document).unbind('mousemove', documentMouseMove);
            }
        }

        function loadOptions() {
            chrome.runtime.sendMessage({action:'getOptions'}, function (result) {
                options = result;
                if (options) {
                applyOptions();
                }
            });
        }

        function onMessage(message, sender, sendResponse) {
            if (message.action == 'optionsChanged') {
                options = message.options;
                applyOptions();
            }
        }

        function windowOnDOMNodeInserted(event) {
            var insertedNode = event.target;
            if (insertedNode && insertedNode.nodeType === Node.ELEMENT_NODE) {
                if (insertedNode.nodeName === 'A' || 
                    insertedNode.nodeName === 'IMG' || 
                    insertedNode.getElementsByTagName('A').length > 0 || 
                    insertedNode.getElementsByTagName('IMG').length > 0) {
                    if (insertedNode.id !== 'hzImg' &&
                        insertedNode.parentNode.id !== 'hzImg' &&
                        insertedNode.id !== 'hzDownscaled') {
                        prepareImgLinksAsync();
                    }
                } else if (insertedNode.nodeName === 'EMBED' || insertedNode.nodeName === 'OBJECT') {
                    fixFlash();
                }
            }
        }

        function windowOnLoad(event) {
            prepareImgLinksAsync();
        }

        function bindEvents() {
            wnd.bind('DOMNodeInserted', windowOnDOMNodeInserted).load(windowOnLoad).scroll(cancelImageLoading);
            $(document).mousemove(documentMouseMove).mouseleave(cancelImageLoading);
        }
        
        
        function init() {
          if (!window.innerHeight || !window.innerWidth) {
              return;
          }
          prepareImgLinks();
          bindEvents();
        }
   
        // chrome.runtime.onMessage.addListener(onMessage);
        loadOptions();
    },

    // Extract a thumbnail url from an element, whether it be a link,
    // an image or a element with a background image.
    getThumbUrl:function (el) {
        // var compStyle = (el && el.nodeType == 1) ? getComputedStyle(el) : false,
        //     backgroundImage = compStyle ? compStyle.backgroundImage : 'none';
        // if (backgroundImage != 'none') {
        //     return backgroundImage.replace(/.*url\s*\(\s*(.*)\s*\).*/i, '$1');
        // } else {
        //     
        // }
        return el.src || el.href;
    },

    // Simulates a mousemove event to force a zoom call
    displayPicFromElement:function (el) {
        hoverZoom.currentLink = el;
        $(document).mousemove();
    },

    // Create and displays the zoomed image container
    createHzImg:function (displayNow) {
        if (!hoverZoom.hzImg) {
            hoverZoom.hzImg = $('<div id="hzImg"></div>').appendTo(document.body);
        }
        hoverZoom.hzImg.css(hoverZoom.hzImgCss);
        hoverZoom.hzImg.empty();
        if (displayNow) {
            hoverZoom.hzImg.stop(true, true).fadeTo(options.fadeDuration, options.picturesOpacity);
        }
    },

    // Create and displays the loading image container
    createImgLoading:function () {
        hoverZoom.imgLoading = hoverZoom.imgLoading || $('<img src="' + chrome.extension.getURL('images/loading.gif') + '" style="opacity: 0.8; padding: 0; margin: 0" />');
        hoverZoom.imgLoading.appendTo(hoverZoom.hzImg);
    },

    
    prepareFromDocument:function (link, url, getSrc) {
        $.get(url.replace(/.*:(\/\/.*)/, '$1'), function(data) {
            var doc = document.implementation.createHTMLDocument();
            doc.open();
            doc.write(data);
            doc.close();
            var httpRefresh = doc.querySelector('meta[http-equiv="refresh"][content]');
            if (httpRefresh) {
                var redirUrl = httpRefresh.content.substr(httpRefresh.content.toLowerCase().indexOf('url=')+4);
                if (redirUrl) {
                    hoverZoom.prepareFromDocument(link, redirUrl, getSrc);
                }
            }
            var src = getSrc(doc);
            if (src) {
                if (Array.isArray(src)) {
                    if (src.length > 1) {
                        link.data().hoverZoomGallerySrc = src;
                        link.data().hoverZoomGalleryIndex = 0;
                      }
                    link.data().hoverZoomSrc = src[0];                        
                } else {
                    link.data().hoverZoomSrc = [src];
                }
                // link.addClass('hoverZoomLink');
                if (hoverZoom.currentLink == link)
                    hoverZoom.displayPicFromElement(link);
            }
        });
    }
};

hoverZoom.loadHoverZoom();
