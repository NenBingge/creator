// import viewItem from "ViewItemPro";
var viewItem = require("ViewItemPro");
var LayoutItemPro = require("LayoutItemPro");
// var layoutPro = require("layoutPro");

const EPSILON = 1e-4;

cc.Class({
    extends: cc.ScrollView,

    properties: {
        item_prefabs: [cc.Prefab],
    },


    onLoad(){
        this.begin_index = 0;
        this.end_index = 0;
        this.item_list = [];
        this.cache_pools = [];
        for(let i = 0 ; i < this.item_prefabs.length ; i++){
            this.cache_pools.push([]);
        }
        this.is_init = false;
    },

    // start(){
    //     this._super();
    // },

    getItemByType(type){
        if(type < this.item_prefabs.length){
            var pool = this.cache_pools[type];
            if(pool.length <= 0){
                var node = cc.instantiate(this.item_prefabs[type]);
                node.type = type;
                node.itemComponent = node.getComponent(viewItem);
                node.parent = this.content;
                var self = this;
                node.on(cc.Node.EventType.SIZE_CHANGED, () => {
                    self._onItemSizeChange(node._data_index);
                });
                return node;
            }
            var node = pool.pop();
            node.active = true;
            return node;
        }
        return null;
    },

    pushItemByType(type, node){
        node.active = false;
        if(type < this.cache_pools.length){
            this.cache_pools[type].push(node);
        }
    },

    _onItemSizeChange(_data_index){
        if(this.is_init)return;
        var index = 0;
        for (var i = 0; i < this.item_list.length; ++i) {
            if (this.item_list[i]._data_index == _data_index) {
                //找到元素在list孩子的索引
                index = i;
                break
            }
        }
        var node = this.item_list[i];
        var begin_y = node.y - node.height;
        for(let i = index + 1 ; i < this.item_list.length ; i++){
            node = this.item_list[i];
            node.y = begin_y;
            begin_y -= node.height;
        }
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
        this.recycleItems();
        this.data = data;
        this.p1 = p1;
        this.begin_index = 0
        this.end_index = 0;
        this.content.y = this._topBoundary;
        this.initItems();
        // this._calculateBoundary();
        this.is_init = false;
    },

    initItems(){
        var begin_y = 0;
        let node = null;
        let layout = null;
        let is_full = false;
        for(let i = 0 , len = this.data.length ; i < len ; i++){
            node = this.getItemByType(this.data[i].type);
            this.item_list.push(node);
            node._data_index = i;
            node.itemComponent.init(this.data[i] , i , this.p1);
            layout = node.getComponent(cc.Layout);
            if (layout) {
                layout.updateLayout();
            }
            node.y = begin_y;
            begin_y += node.height;
            if(is_full)break;
            this.end_index++;
            if(begin_y > this.content.height){
                is_full = true;
            }
        }
    },

    recycleItems(){
        for(let i = 0 ; i < this.item_list.length ; i++){
            this.pushItemByType(this.item_list[i].type , this.item_list[i]);
        }
        this.item_list = [];
    },

    getChildByIndex(index){
        if(index >= this.begin_index && index <= this.end_index){
            var new_index = index - this.begin_index;
            return this.item_list[new_index];
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

    _moveContent (deltaMove, canStartBounceBack) {
        let adjustedMove = this._flattenVectorByDirection(deltaMove);
      
        let newPosition = this.getContentPosition().add(adjustedMove);
        this.setContentPosition(newPosition);

        this._checkNeedRefresh(adjustedMove);

        let outOfBoundary = this._getHowMuchOutOfBoundary();
        // cc.log(outOfBoundary.x , outOfBoundary.y)
        this._updateScrollBar(outOfBoundary);
        if (this.elastic && canStartBounceBack) {
            this._startBounceBackIfNeeded();
        }
    },

    _checkNeedRefresh(offset){
        var list = this.item_list;
        var content_y = this.content.y;
        if(offset.y > 0 && this.end_index < this.data.length - 1){
            if(list.length > 1 && list[1].y + content_y > this._topBoundary){
                var node = list.shift();
                this.pushItemByType(node.type , node);
                this.begin_index++;
            }
            let len = list.length;
            if(len > 1 && list[len-1].y + content_y > this._bottomBoundary){
                this.end_index++;
                var node = this.geneOneNode(this.end_index);
                let y = list[len - 1].y - list[len-1].height;
                node.y = y;
                list.push(node);
            }
        }
        else if(offset.y < 0 && this.begin_index > 0){
            if(list.length > 1 && list[1].y + content_y < this._topBoundary){
                this.begin_index--;
                var node = this.geneOneNode(this.begin_index);
                let layout = node.getComponent(cc.Layout);
                if (layout) {
                    layout.updateLayout();
                }
                let y = list[0].y + node.height;
                node.y = y;
                this.item_list.unshift(node);
            }
            let len = this.item_list.length;
            if(len > 1 && list[len-1].y + content_y < this._bottomBoundary){
                var node = this.item_list.pop();
                this.pushItemByType(node.type , node);
                this.end_index--;
            }
        }
    },

    geneOneNode(index){
        var node = this.getItemByType(this.data[index].type);
        node._data_index = index;
        node.itemComponent.init(this.data[index] , index , this.p1);
        return node;
    },

    _getContentTopBoundary () {
        if(this.item_list.length > 0){
            if(this.begin_index == 0){
                return this.content.y + this.item_list[0].y;
            }else{
                return this.content.y - this.item_list[0].y;
            }
        }else{
            let contentSize = this.content.getContentSize();
            return this._getContentBottomBoundary() + contentSize.height;
        }
    },

    _getContentBottomBoundary () {
        if(this.item_list.length > 0){
            var node = this.item_list[this.item_list.length - 1];
            var y = Math.min(this.content.y + node.y - node.height , this.content.y - this.content.height)
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

    // update (dt) {},
});
