/**
 * jQuery拖拽 & 弹出层
 * API: http://dreamback.github.io/dialog/
 * @author: heshimeng1987@qq.com
 */
~function($, window, undefined) {
    var win = $(window),
        doc = $(document),
        ie = $.browser.msie,
        version = parseInt($.browser.version),
        ie6 = ie && version < 7,
        dialog,
        dialogZindex = 1e4;

    //插入皮肤
    (function(){
        var script = document.getElementsByTagName('script'),
            i = 0,
            len = script.length,
            link = document.createElement('link'),
            theme,
            path;
            link.setAttribute('rel', 'stylesheet');
        for( ; i < len; i++){
            theme = script['dialog-theme']||script[i].getAttribute('dialog-theme');
            if(theme){
                path = (script[i].src||script[i].getAttribute('src'));
                path = path.substring(0, path.lastIndexOf('/'))+'/theme/';
                link.setAttribute('href', path+theme+'/style.css');
                script[i].parentNode.insertBefore(link, script[i]);
                break;
            }
        }
    })();

    drag = function(target, options) {
        return new drag.fn.init(target, options);
    };

    drag.fn = drag.prototype = {
        init: function(options) {

            var that = this;
            this.target = $(options.target);
            options = options || {};
            this.root = options.root ? $(options.root) : this.target;
            this.min = options.min;
            this.max = options.max;
            this.start = options.start;
            this.move = options.move;
            this.end = options.end;
            this.fixed = options.fixed;
            this.startPosition = {};
            this.movePosition = {};
            this.ie6fix = '(document.documentElement || document.body)';
            var _down = function(e) {
                e = that.fixEvent(e);
                that.startPosition = {
                    x: e.layerX,
                    y: e.layerY
                };
                that.start && that.start(that.startPosition);
                doc.bind('mousemove', _move)
                    .bind('mouseup', _end);
                this.setCapture && this.setCapture(false); //ie 鼠标移出浏览器依然可以拖拽
                e.preventDefault(); //阻止默认行为，chrome的拖拽选择文字行为
                return false;
            },
            _move = function(e) {
                e = that.fixEvent(e);

                that.movePosition = {
                    x: e.clientX - that.startPosition.x,
                    y: e.clientY - that.startPosition.y
                };
                that.limit();
                if (that.fixed && ie6) { //IE6 fixed
                    that.root[0].style.setExpression('left', 'eval(' + that.ie6fix + '.scrollLeft + ' + (that.movePosition.x - win.scrollLeft()) + ') + "px"');
                    that.root[0].style.setExpression('top', 'eval(' + that.ie6fix + '.scrollTop + ' + (that.movePosition.y - win.scrollTop()) + ') + "px"');
                } else {
                    that.root.css({
                        left: that.movePosition.x,
                        top: that.movePosition.y
                    });
                }
                that.move && that.move(that.movePosition);
                return false;
            },
            _end = function() {
                doc.unbind('mousemove', _move)
                    .unbind('mouseup', _end);
                that.end && that.end(that.movePosition);
                return false;
            };

            this.target.bind('mousedown', _down).bind('mouseup', function() {
                this.releaseCapture && this.releaseCapture();
            });
        },
        fixEvent: function(e) {
            if (!e.pageX) {
                e.pageX = e.clientX + win.scrollTop();
                e.pageY = e.clientY + win.scrollLeft();
            }
            if (!e.layerX) {
                e.layerX = e.clientX - parseInt(this.root.css('left'));
                e.layerY = e.clientY - parseInt(this.root.css('top'));
            }
            return e;
        },
        /**
         * 限制
         */
        limit: function() {
            if (this.min !== undefined) {
                this.movePosition = {
                    x: Math.max(this.min.x, this.movePosition.x),
                    y: Math.max(this.min.y, this.movePosition.y)
                };
            }
            if (this.max !== undefined) {
                this.movePosition = {
                    x: Math.min(this.max.x, this.movePosition.x),
                    y: Math.min(this.max.y, this.movePosition.y)
                };
            }
        }
    };
    drag.fn.init.prototype = drag.fn;
    window.iDrag = $.drag = drag;

    dialog = function(options) {
        var _dialog;
        if (dialog.get[options.id] !== undefined) {
            _dialog = dialog.get[options.id];
            _dialog.show();
            return _dialog;
        }
        _dialog = new dialog.fn._init(options);
        _dialog.id = _dialog.id || +new Date();
        dialog.get[_dialog.id] = _dialog;
        return _dialog;
    };

    dialog.fn = dialog.prototype = {
        _init: function(options) {
            this.id      = options.id;
            this.lock    = options.lock || false;
            this.fixed   = options.fixed || false;
            this.width   = options.width || 'auto';
            this.height  = options.height || 'auto';
            this.top     = options.top;
            this.left    = options.left;
            this.padding = options.padding || 20;
            this._content = options.content || 'loading...';
            this.init    = options.init;
            this._show    = options.show || function(){};
            this._close   = this.close || function(){};
            this.opacity = options.opacity === undefined ? .3 : options.opacity;
            this.background = options.background || '#000';
            this.title   = options.title === undefined ? '消息' : options.title;
            this.follow  = options.follow === undefined ? false : $(options.follow);
            this.drag    = options.drag === undefined ? true : options.drag;
            this.effect  = options.effect === undefined ? 'i-scale' : options.effect;
            this.inited  = false;
            this.myDrag  = {};
            
            this.$body   = $(document.body);

            this.show();
            this.events();
            this.init && this.init();

        },
        _lock: function() {
            var lock = document.createElement('div');
            this.$lock = $(lock).addClass('i-dialog-lock').css({
                zIndex: ++dialogZindex,
                height: doc.height(),
                background: this.background
            }).html(!ie6 ? '' : '<iframe src="about:blank"></iframe>');
            this.$body[0].appendChild(lock);
        },
        createHTML: function() {
            this.lock && this._lock();
            this.inited = true;
            var dialog = document.createElement('div'),
                html = '';
            if (this.title!==false) {
                html = '<div class="title">' +
                    '<h2>' + this.title + '</h2>' +
                    '<a href="javascript:void(0);" title="关闭" class="close">×</a>' +
                    '</div>';
            }
            html += '<div class="content"></div>';
            this.$body[0].appendChild(dialog);
            this.$dialog = $(dialog).addClass('i-dialog').html(html).css({
                zIndex: ++dialogZindex,
                width: this.width,
                height: this.height
            });
            this.$target = this.$dialog.find('.title');
            this.$title = this.$dialog.find('h2');
            this.$close = this.$dialog.find('a');
            this.$content = this.$dialog.find('.content').css({
                padding: this.padding
            });
            this.effect&&this.$dialog.addClass(this.effect);
            if(this.drag){
                this.myDrag = $.drag({
                    target: this.$target,
                    root: this.$dialog,
                    fixed: this.fixed
                });
            }
            this.setPosition();
            this.content();
            if(this.title===false){
                this.$dialog.css({background:'none',boxShadow:'none',borderRadius:0,border:'none'});
            }
        },
        content: function(content) {
            this.content = content || this.content;
            if (typeof this._content == 'string') {
                this.$content.html(this._content);
            } else if (typeof this._content == 'object' && this._content.nodeType === 1) {
                this.$content[0].appendChild(this._content);
                this._content.style.display='block';
            }
            return this;
        },
        setPosition: function() {
            if (this.fixed) {
                if (!ie6) {
                    this.$dialog.css({
                        position: 'fixed'
                    });
                } else {
                    this.$dialog.css({
                        position: 'absolute'
                    });
                    $('html').css({
                        backgroundImage: 'url(about:blank)',
                        backgroundAttachment: 'fixed'
                    });
                }
            } else {
                this.$dialog.css({
                    position: 'absolute'
                });
            }
        },
        show: function() {
            !this.inited && this.createHTML();
            if(this._show()===false)return;
            if(this.lock){
                this.$lock.show();
                ie&&version<9&&this.$lock.css({opacity: this.opacity});
            }
            this.width = this.$dialog.width();
            this.height = this.$dialog.height();
            var winWidth = win.width(),
                winHeight = win.height(),
                scrollLeft = win.scrollLeft(),
                scrollTop = win.scrollTop(),
                that = this;
            this.follow&&this._follow();
            this.$dialog.show().css({
                top: this.top!==undefined?this.top : ((winHeight - this.height)*.382  + (ie6 || !this.fixed ? scrollTop : 0)),
                left: this.top!==undefined?this.left : ((winWidth - this.width) / 2 + (ie6 || !this.fixed ? scrollLeft : 0)),
                width: this.width,
                height: this.height
            });
            setTimeout(function() {
                that.lock && that.$lock.css({
                    opacity: that.opacity
                });
                that.effect&&that.$dialog.addClass('i-show');
            }, this.effect?50:0);       
        },
        _follow: function(){
            var offset = this.follow.offset(),
                width  = parseInt(this.follow.width()),
                height = parseInt(this.follow.height()),
                top;
            this.top = offset.top + height + 5;
            this.left = offset.left-(this.width-width)/2;
            this.limit();
            
            this.top = this.top > this.myDrag.max.y ? this.myDrag.max.y : this.top;
            this.left = this.left > this.myDrag.max.x ? this.myDrag.max.x : this.left;
            this.top = this.top < this.myDrag.min.y ? this.myDrag.min.y : this.top;
            this.left = this.left < this.myDrag.min.x ? this.myDrag.min.x : this.left;
            if(this.top<this.myDrag.max.y){
                top = this.top-this.height-height-5;
                this.top =  top > this.myDrag.min.y ? top : this.top;
            }
        },
        hide: function() {
            if(this._close()===false)return;
            var style = this.$dialog[0].style,
                time = 0,
                that = this;
            if (style.transform !== undefined || style.webkitTransform !== undefined ||
                style.mozTransform !== undefined || style.msTransform !== undefined) {
                time = 300;
            }
            this.$dialog.removeClass('i-show');
            this.lock && this.$lock.css({
                opacity: 0
            });
            setTimeout(function() {
                that.lock && that.$lock.hide();
                that.$dialog.hide();
            }, this.effect?time:0);
        },
        events: function() {
            var that = this,
                timeout = null;
            win.bind('resize', function() {
                timeout && clearTimeout(timeout);
                timeout = setTimeout(function() {
                    that.limit();
                    (parseInt(that.$dialog.css('left'))>that.myDrag.max.x)&&that.$dialog.css('left',that.myDrag.max.x);
                    (parseInt(that.$dialog.css('top'))>that.myDrag.max.y)&&that.$dialog.css('top',that.myDrag.max.y);
                }, 100);
            });
            this.$close.bind('click', function() {
                that.hide();
            });
            this.$lock && this.$lock.bind('dblclick', function() {
                that.hide();
            });
            doc.bind('keyup', function(e) {
                if (e.keyCode == 27) that.hide();
            });
            //设置限制拖拽区域
            if(this.drag){
                this.myDrag.start = function() {
                    that.limit();
                }
            };
        },
        limit: function(){
            var winWidth = win.width(),
                winHeight = win.height(),
                scrollLeft = win.scrollLeft(),
                scrollTop = win.scrollTop();
            this.myDrag.min = {
                x: 0,
                y: 0
            };                
            if (this.fixed && ie6) {
                this.myDrag.min = {
                    x: scrollLeft,
                    y: scrollTop
                };
            }
            if (this.fixed) {
                this.myDrag.max = !ie6 ? {
                    x: winWidth - this.width,
                    y: winHeight - this.height
                } : {
                    x: winWidth + scrollLeft - this.width,
                    y: winHeight + scrollTop - this.height
                };
            } else {
                this.myDrag.max = {
                    x: winWidth - this.width,
                    y: this.$body.height() - this.height
                };
            }
            // 减去边框的宽
            this.myDrag.max.x -= 2;
            this.myDrag.max.y -= 2;
        }
    };

    dialog.fn._init.prototype = dialog.fn;
    window.iDialog = $.dialog = dialog;

    dialog.get = {};
    $.dialog.get = dialog.get;

}(jQuery, this);