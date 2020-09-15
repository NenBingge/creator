// import viewItem from "ViewItemPro";
var viewItem = require("ViewItemPro");
var LayoutItemPro = require("LayoutItemPro");

// var layoutPro = require("layoutPro");

const EPSILON = 1e-4;

var DO_NO = 1;
var PRE_CLEAR_OUT_BOUNDARY_FLAG = 1 << 1;
var CLEAR_OUT_BOUNDARY_FLAG = 1 << 2;

cc.Class({
    extends: cc.ScrollView,

    properties: {
        item_prefab: cc.Prefab,
        item_num: 0,
        item_height: 0,
        cache_prefabs: [cc.Prefab],
        auto_add_layout: false,
        node_bottom: cc.Node,
        is_inner: false,
        // item_prefabs: {
        //     type: cc.Prefab,
        //     default: [],
        // },
        // item_nums: {
        //     type: cc.Integer,
        //     default: [],
        // }
    },


    onLoad(){
        this.state_flag = DO_NO;
        this.begin_index = 0;
        this.end_index = 0;
        this.item_list = [];
        this.index_arr = [];
        this.is_init = false;
        this.layouts = [];
        this.cache_pools = [];
        if(this.cache_prefabs.length){
            for(let i = 0 ; i < this.cache_prefabs.length ; i++){
                this.cache_pools.push([]);
            }
        }
        if(this.node_bottom){
        	this.node_bottom.on(cc.Node.EventType.SIZE_CHANGED,this.onBottomNodeSizeChange,this);
        }
    },

    setOuterScroll(outer_scroll){
        this.outer_scroll = outer_scroll;
    },

    // start(){
    //     this._super();
    // },

    getItem(index){
        if(index < this.item_list.length)return this.item_list[index];
        else{
            if(index == this.item_list.length){
                var node = cc.instantiate(this.item_prefab);
                node.itemComponent = node.getComponent(viewItem);
                if(this.auto_add_layout){
                    node.itemComponent.setScroll(this);
                }
                node.index = index;
                var self = this;
                node.on(cc.Node.EventType.SIZE_CHANGED, _ => {
                    self._onItemSizeChange(index);
                });
                node.parent = this.content;
                this.item_list.push(node);
                return this.item_list[index];
            }else{
                console.warn("getItem index not generate")
            }
        }
    },

    _onItemSizeChange(item_index){
        if(this.is_init)return;
        var index = 0;
        for (var i = 0; i < this.index_arr.length; ++i) {
            if (this.index_arr[i] == item_index) {
                //找到元素在list孩子的索引
                index = i;
                break
            }
        }
        var node = this.item_list[this.index_arr[index]];
        var begin_y = node.y - node.height;
        for(let i = index + 1 ; i < this.index_arr.length ; i++){
            node = this.item_list[this.index_arr[i]];
            node.y = begin_y;
            begin_y -= node.height;
        }
        this.updateBottomNode();
    },

    toTop(){
        this.is_init = true;
        this.stopAutoScroll();
        this.content.y = this._topBoundary;
        this.begin_index = 0;
        if(this.data){
            var begin_y = 0;
            var num = Math.min(this.data.length , this.item_num);
            this.end_index = this.begin_index + num - 1;
            this.initItems(begin_y , num);    
        }
        this.is_init = false;
    },

    initData(data , p1){
        this.is_init = true;
        this.data = data;
        this.p1 = p1;
        var begin_y = 0;
        var num = Math.min(data.length , this.item_num);
        this.end_index = this.begin_index + num - 1;
        if(this.end_index > data.length - 1){
            var offset = this.end_index + 1 - data.length;
            this.end_index = data.length - 1;
            this.begin_index -= offset;
            this.content.y = this.begin_index * this.item_height + this._topBoundary;
            if(this.begin_index < 0)this.begin_index = 0;
            begin_y = -this.begin_index * this.item_height;
        }else{
            if(this.item_list.length > 0 && this.index_arr.length > 0){
                begin_y = this.item_list[this.index_arr[0]].y;
            }
        }
        this.initItems(begin_y , num);
        this.showBottomNode();
        this.updateBottomNode();
        this.state_flag = PRE_CLEAR_OUT_BOUNDARY_FLAG;
        // this._calculateBoundary();
        this.is_init = false;
    },

    initItems(begin_y , num){
        this.index_arr = [];
        var i = 0;
        let layout = null;
        for(; i < num ; i++){
            var node = this.getItem(i);
            var index = this.begin_index + i;
            node.active = true;
            node.y = begin_y;
            node.itemComponent.init(this.data[index] , index , this.p1);
            layout = node.getComponent(cc.Layout)
            if (layout) {
                layout.updateLayout();
            }
            if(this.auto_add_layout){
                node.itemComponent.refreshLayout();
            }
            begin_y -= node.height;
            this.index_arr.push(i);
        }
        for(; i < this.item_list.length ; i++){
            this.item_list[i].active = false;
        }
    },

    changeContentHeight(h){
        if(this.node.height == h)return;
        this.node.height = h;
        this._view.height = h;
        this.content.height = h;
        this.state_flag = PRE_CLEAR_OUT_BOUNDARY_FLAG;
    },

    _quickAllayOuterBoundary(){
        this._outOfBoundaryAmountDirty = true;
        var offset = this._getHowMuchOutOfBoundary();
        if(!offset.fuzzyEquals(cc.v2(0, 0), EPSILON)){
            this.stopAutoScroll();
            let newPosition = this.getContentPosition().add(offset);
            this.setContentPosition(newPosition);
        }
    },

    getChildByIndex(index){
        if(index >= this.begin_index && index <= this.end_index){
            var new_index = index - this.begin_index;
            return this.item_list[this.index_arr[new_index]];
        }
        return null;
    },

    _scrollChildren (deltaMove) {
        deltaMove = this._clampDelta(deltaMove);

        let realMove = deltaMove;
        let outOfBoundary;
        if (this.elastic) {
            outOfBoundary = this._getHowMuchOutOfBoundary();
            realMove.x *= (outOfBoundary.x === 0 ? 1 : 0.5);
            realMove.y *= (outOfBoundary.y === 0 ? 1 : 0.5);
        }

        if (!this.elastic) {
            outOfBoundary = this._getHowMuchOutOfBoundary(realMove);
            realMove = realMove.add(outOfBoundary);
        }

        let scrollEventType = -1;

        if (realMove.y > 0) { //up
            // let icBottomPos = this.content.y - this.content.anchorY * this.content.height;
            let icBottomPos = this._getContentBottomBoundary();
            if (icBottomPos + realMove.y >= this._bottomBoundary) {
                scrollEventType = 'scroll-to-bottom';
            }
        }
        else if (realMove.y < 0) { //down
            // let icTopPos = this.content.y - this.content.anchorY * this.content.height + this.content.height;
            let icTopPos = this._getContentTopBoundary();
            if (icTopPos + realMove.y <= this._topBoundary) {
                scrollEventType = 'scroll-to-top';
            }
        }
        if (realMove.x < 0) { //left
            let icRightPos = this.content.x - this.content.anchorX * this.content.width + this.content.width;
            if (icRightPos + realMove.x <= this._rightBoundary) {
                scrollEventType = 'scroll-to-right';
            }
        }
        else if (realMove.x > 0) { //right
            let icLeftPos = this.content.x - this.content.anchorX * this.content.width;
            if (icLeftPos + realMove.x >= this._leftBoundary) {
                scrollEventType = 'scroll-to-left';
            }
        }

        this._moveContent(realMove, false);

        if (realMove.x !== 0 || realMove.y !== 0) {
            if (!this._scrolling) {
                this._scrolling = true;
                this._dispatchEvent('scroll-began');
            }
            this._dispatchEvent('scrolling');
        }

        if (scrollEventType !== -1) {
            this._dispatchEvent(scrollEventType);
        }

    },
    
    _onTouchMoved (event, captureListeners) {
        if (!this.enabledInHierarchy) return;
        if (this._hasNestedViewGroup(event, captureListeners)) return;

        let touch = event.touch;

        //有外层scroll的话  滑动逻辑交给外层处理
        if (this.content && !this.outer_scroll) {
            this._handleMoveLogic(touch);
        }
        // Do not prevent touch events in inner nodes
        if (!this.cancelInnerEvents) {
            return;
        }

        let deltaMove = touch.getLocation().sub(touch.getStartLocation());
        //FIXME: touch move delta should be calculated by DPI.
        if (deltaMove.mag() > 7) {
            if (!this._touchMoved && event.target !== this.node) {
                // Simulate touch cancel for target node
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

    _moveContent (deltaMove, canStartBounceBack) {
        let adjustedMove = this._flattenVectorByDirection(deltaMove);
      
        let newPosition = this.getContentPosition().add(adjustedMove);
        this.setContentPosition(newPosition);

        if(!adjustedMove.fuzzyEquals(cc.v2(0, 0), EPSILON)){
            this._checkNeedRefresh(adjustedMove);
            this.showBottomNode();
            this.updateLayouts(adjustedMove);
        }

        let outOfBoundary = this._getHowMuchOutOfBoundary();
        // cc.log(outOfBoundary.x , outOfBoundary.y)
        this._updateScrollBar(outOfBoundary);
        if (this.elastic && canStartBounceBack) {
            this._startBounceBackIfNeeded();
        }
    },


    _checkNeedRefresh(offset){
        var len = this.index_arr.length;
        if(len < 2)return;
        if(offset.y > 0 && this.end_index < this.data.length - 1 && this.content.y + this.item_list[this.index_arr[1]].y > this._topBoundary){
            this.begin_index++;
            this.end_index++;
            var end_index = this.index_arr[len - 1];
            var first_index = this.index_arr.shift();
            this.index_arr.push(first_index);
            var node_first = this.item_list[first_index];
            var node_end = this.item_list[end_index];
            // cc.log("tobottom:",this.data[this.end_index])
            node_first.itemComponent.init(this.data[this.end_index] , this.end_index , this.p1);
            node_first.y = node_end.y - node_end.height;
            if(this.auto_add_layout){
                node_first.itemComponent.refreshLayout();
            }
        }
        if(offset.y < 0 && this.begin_index > 0 && this.content.y + this.item_list[this.index_arr[len - 2]].y < this._bottomBoundary){
            this.begin_index--;
            this.end_index--;
            var first_index = this.index_arr[0];
            var end_index = this.index_arr.pop();
            var node_end = this.item_list[end_index];
            var node_first = this.item_list[first_index];
            // cc.log("totop:",this.data[this.begin_index])
            node_end.itemComponent.init(this.data[this.begin_index] , this.begin_index , this.p1);
            let layout = node_end.getComponent(cc.Layout)
            if (layout) {
                layout.updateLayout();
            }
            node_end.y = node_first.y + node_end.height;
            if(this.auto_add_layout){
                node_end.itemComponent.refreshLayout();
            }
            this.index_arr.unshift(end_index);
        }
    },

    updateLayouts(offset){
        if(!this.layouts)return;
        for(let i = 0 ; i < this.layouts.length ; i++){
            if(this.layouts[i].node.active){
                this.layouts[i].refreshItem(offset);
            }
        }
    },

    _getContentTopBoundary () {
        if(this.index_arr.length > 0){
            if(this.begin_index == 0){
                return this.content.y + this.item_list[this.index_arr[0]].y;
            }else{
                return this.content.y - this.item_list[this.index_arr[0]].y;
            }
        }else{
            let contentSize = this.content.getContentSize();
            return this._getContentBottomBoundary() + contentSize.height;
        }
    },

    _getContentBottomBoundary () {
        if(this.index_arr.length > 0){
            var node = this.item_list[this.index_arr[this.index_arr.length - 1]];
            y = this.content.y + node.y - node.height;
            if(this.bottom_is_show){
                y -= this.node_bottom.height;
            }
            var y = Math.min(y , this.content.y - this.content.height);
            return y;
        }else{
            let contentPos = this.getContentPosition();
            return contentPos.y - this.content.getAnchorPoint().y * this.content.getContentSize().height;
        }
    },

    is_top(){
        if(this.data.length > 0 && this.begin_index != 0)return false;
        return this._getContentTopBoundary() <= this._topBoundary;
    },

    is_bottom(){
        if(this.data.length > 0 && this.end_index < this.data.length - 1)return false;
        return this._getContentBottomBoundary() <= this._bottomBoundary;
    },

    //item中layoutpro逻辑
    addLayout(layout){
        this.layouts.push(layout);
    },

    removeLayout(layout){
        var index = this.layouts.indexOf(layout);
        if(index > -1){
            this.layouts.splice(index , 1);
        }
    },

    getCacheByType(type){
        if(type < this.cache_prefabs.length){
            var pool = this.cache_pools[type];
            if(pool.length <= 0){
                var node = cc.instantiate(this.cache_prefabs[type]);
                node.itemComponent = node.getComponent(LayoutItemPro);
                return node;
            }
            var node = pool.pop();
            node.active = true;
            return node;
        }
        return null;
    },

    pushCacheByType(type, node){
        node.parent = null;
        node.active = false;
        if(type < this.cache_pools.length){
            this.cache_pools[type].push(node);
        }
    },

    //下面节点逻辑
    showBottomNode(){
    	if(!this.node_bottom)return;
    	if(this.end_index == this.data.length - 1 && !this.bottom_is_show){
    		this.bottom_is_show = true;
    		var end_index = this.index_arr[this.index_arr.length - 1];
    		var node_end = this.item_list[end_index];
    		var y = node_end.y - node_end.height - this.node_bottom.height * (1-this.node_bottom.anchorY);
            // this.bottom_is_show.parent = this.content;
            this.node_bottom.x = 0;
    		this.node_bottom.y = y;
    	}else if(this.end_index < this.data.length - 1 && this.bottom_is_show){
    		this.bottom_is_show = false;
    		this.node_bottom.x = 1000;
    	}
    },
    updateBottomNode(){
    	if(!this.node_bottom)return;
        if(!this.bottom_is_show)return;
        var y = 0;
        if(this.index_arr.length > 0){
            var end_index = this.index_arr[this.index_arr.length - 1];
            var node_end = this.item_list[end_index];
            var y = node_end.y - node_end.height - this.node_bottom.height * (1-this.node_bottom.anchorY);
        }
		this.node_bottom.y = y;
    },
    onBottomNodeSizeChange(){
    	this.updateBottomNode();
    },
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    // start () {
    //     var scroll = this.node.getComponent(cc.ScrollView);
    //     this.scheduleOnce(function(){
    //         // cc.log("scroll._leftBoundary:",scroll._leftBoundary);
    //         // cc.log("scroll._leftBoundary:",scroll._rightBoundary);
    //         // cc.log("scroll._leftBoundary:",scroll._bottomBoundary);
    //         // cc.log("scroll._leftBoundary:",scroll._topBoundary);
    //         cc.log(scroll.content.y)
    //     },1)

    // },

    _moveContentToTopLeft(viewSize){
        cc.log("_moveContentToTopLeft");
    },


    update (dt) {
        this._super(dt);
        if(this.state_flag == DO_NO)return;
        if(this.state_flag == PRE_CLEAR_OUT_BOUNDARY_FLAG){
            this.state_flag = CLEAR_OUT_BOUNDARY_FLAG;
        }else if(this.state_flag == CLEAR_OUT_BOUNDARY_FLAG){
            // this._calculateBoundary();
            this._quickAllayOuterBoundary();
            this.state_flag = DO_NO;
        }
    },
});
