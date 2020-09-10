
var ScrollViewPro = require("ScrollViewPro");

cc.Class({
    extends: cc.ScrollView,

    properties: {
        m_scrollViews: [ScrollViewPro],
        _cur_scrollView: null,
    },

    _hasNestedViewGroup (event, captureListeners) {
        if (event.eventPhase !== cc.Event.CAPTURING_PHASE) return;
        // this._cur_scrollView = null;
        return false;
    },

    isScrollBottom() {
        return this.content.y <= this._topBoundary
    },
    isScrollTop() {
        return this.content.y - this.content.height >= this._bottomBoundary;
    },

    findInnerScroll(event, captureListeners){
        if (captureListeners) {
            //captureListeners are arranged from child to parent
            for (let i = 0; i < captureListeners.length; ++i){
                let item = captureListeners[i];
                if (this.node === item) {
                    let scroll = event.target.getComponent(cc.ScrollView);
                    if (scroll && scroll.is_inner) {
                        this._cur_scrollView = scroll;
                        return;
                    }
                }
            }
        }
        this._cur_scrollView = null;
    },

    _onTouchBegan (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        if (this._hasNestedViewGroup(event, captureListeners)) return;
        this.findInnerScroll(event, captureListeners);
        let touch = event.touch;
        if (this.content) {
            this._handlePressLogic(touch);
        }
        this._touchMoved = false;
        this._stopPropagationIfTargetIsMe(event);
    },
    
    _onTouchMoved (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        if (this._hasNestedViewGroup(event, captureListeners)) return;
        if (!this.cancelInnerEvents) {
            return;
        }
        let touch = event.touch;
        let deltaMove = touch.getLocation().sub(touch.getStartLocation());
        if (this.content) {
            if(deltaMove.y > 0){
                if(this.isScrollTop() && this._cur_scrollView){
                    this._cur_scrollView._handleMoveLogic(touch);
                }else{
                    this._handleMoveLogic(touch);
                }    
            }else if(deltaMove.y < 0){
                if(this._cur_scrollView && !this._cur_scrollView.is_top()){
                    this._cur_scrollView._handleMoveLogic(touch);
                }else{
                    this._handleMoveLogic(touch);
                   
                }  
            }
        }
        // Do not prevent touch events in inner nodes
        if (deltaMove.mag() > 7) {
            if (!this._touchMoved && event.target !== this.node && captureListeners.length < 2) {
                let cancelEvent = new cc.Event.EventTouch(event.getTouches(), event.bubbles);
                cancelEvent.type = cc.Node.EventType.TOUCH_CANCEL;
                cancelEvent.touch = event.touch;
                cancelEvent.simulate = true;
                event.target.dispatchEvent(cancelEvent);
                this._touchMoved = true;
            }
        }
        this._stopPropagationIfTargetIsMe(event);
    },

});
