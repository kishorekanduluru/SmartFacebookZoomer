var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
    name:'Facebook',
    prepareImgLinks:function (callback) {
      $('img[src*="fbcdn"]:not(.spotlight), img[src*="fbexternal"], [style*="fbcdn"]:not([data-reactid]), [style*="fbexternal"]').each(function () {
            var img = $(this),
                link = img.parents('a'),
                data = link.data();
            if (!data || data.hoverZoomSrc || link.hasClass('UFICommentLink') || link.hasClass('messagesContent') || link.attr('href').indexOf('notif') != -1) return;

            var src = hoverZoom.getThumbUrl(this),
                origSrc = src;
            if (src.indexOf('safe_image.php') > -1) {
                src = unescape(src.substr(src.lastIndexOf('&url=') + 5));
                if (src.indexOf('?') > -1) {
                    src = src.substr(0, src.indexOf('?'));
                }
                if (src.indexOf('&') > -1) {
                    src = src.substr(0, src.indexOf('&'));
                }
                // Picasa hosted images
                if (src.indexOf('ggpht.com') > -1 || src.indexOf('blogspot.com') > -1) {
                    src = src.replace(/\/s\d+(-c)?\//, options.showHighRes ? '/s0/' : '/s800/');
                }
                // Youtube images
                if (src.indexOf('ytimg.com') > -1) {
                    src = src.replace(/\/(\d|(hq)?default)\.jpg/, '/0.jpg');
                }
            } else {
                var reg = src.match(/\d+_(\d+)_\d+/);
                if (reg) {
                  hoverZoom.prepareFromDocument(link, 'https://mbasic.facebook.com/photo.php?fbid=' + reg[1], function(doc) {
                        var links = doc.querySelectorAll('a[href*="fbcdn"]');
                        return links.length > 0 ? links[links.length-1].href : false;
                    });                    
                }
            }

            data.hoverZoomSrc = [src];
            link.addClass('hoverZoomLink');
        });

        // $('a[ajaxify*="src="]:not(.coverWrap)').one('mouseover', function () {
        //     var link = $(this),
        //         data = link.data();
        //     if (data.hoverZoomSrc) {
        //         return;
        //     }
        //     var key, src = link.attr('ajaxify');
        //     if (!options.showHighRes && src.indexOf('smallsrc=') > -1)
        //         key = 'smallsrc=';
        //     else
        //         key = 'src=';
        //     src = src.substr(src.indexOf(key) + key.length);
        //     src = unescape(src.substr(0, src.indexOf('&')));
        //     data.hoverZoomSrc = [src];
        //     link.addClass('hoverZoomLink');
        // });
    }
});
