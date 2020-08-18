import viewItem from "ViewItemPro";

const EPSILON = 1e-4;

cc.Class({
    extends: cc.ScrollView,

    properties: {
        item_prefab: cc.Prefab,
        item_num: 0,
        item_height: 0,
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
        this.begin_index = 0;
        this.end_index = 0;
        this.item_list = [];
        this.index_arr = [];
        this.is_init = false;
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
    },

    initData(data){
        this.is_init = true;
        this.data = data;
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
        this.index_arr = [];
        var i = 0;
        for(; i < num ; i++){
            var node = this.getItem(i);
            var index = this.begin_index + i;
            node.active = true;
            node.y = begin_y;
            node.itemComponent.init(data[index] , index);
            begin_y -= node.height;
            this.index_arr.push(i);
        }
        for(; i < this.item_list.length ; i++){
            this.item_list[i].active = false;
        }
        // this._calculateBoundary();
     
        this.is_init = false;
    },

    getChildByIndex(index){
        if(index >= this.begin_index && index <= this.end_index){
            var new_index = index - this.begin_index;
            return this.item_list[this.index_arr[new_index]];
        }
        return null;
    },


    // initData(data){
    //     this.data = data;
    //     var first_node = cc.instantiate(this.item_prefab);
    //     first_node.parent = this.content;
    //     first_node.getComponent(viewItem).init(data[0] , 0);
    //     var begin_y = 0;
    //     first_node.y = begin_y;
    //     begin_y -= first_node.height;
    //     var num = Math.ceil(this._view.height / first_node.height);
    //     if(this.item_num == 0){
    //         this.item_num = num + 2;
    //     }
    //     cc.log("item_Num:",this.item_num);
    //     this.item_list.push(first_node);
    //     this.index_arr.push(this.end_index);
    //     var data_len = data.length;
    //     for(let i = 0 ; i < this.item_num - 1 ; i++){
    //         var node = cc.instantiate(this.item_prefab);
    //         node.parent = this.content;
    //         if(i + 1 < data_len){
    //             node.getComponent(viewItem).init(data[i + 1] , i + 1);
    //             node.y = begin_y;
    //             begin_y -= node.height;
    //             this.item_list.push(node);
    //             this.end_index++;
    //             this.index_arr.push(this.end_index);
    //         }else{
    //             node.active = false;
    //         }
    //     }
    //     this._calculateBoundary();
    // },

    // refreshData(data){
    //     if(data.length > this.data.length && this.data.length + 2 < this.item_num){
    //         var num = data.length - this.data.length;
    //         num = Math.min(num , this.item_num - this.data.length);
    //         for(let i = 0 ; i < num ; i++){
    //             var index = this.index_arr.pop();
    //             this.item_list[index].active = false;
    //         }
    //     }else if(data.length < this.data.length && data.length + 2 < this.item_num){
    //         this.index_arr = [];
    //         for(let i = 0 ; i < data.length ; i++){
    //             var index = this.index_arr.pop();
    //             this.item_list[index].active = false;
    //         }
    //     }
    //     this.data = data;
    // },

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
        this._updateScrollBar(outOfBoundary);
        if (this.elastic && canStartBounceBack) {
            this._startBounceBackIfNeeded();
        }
    },

    
    // setContentPosition (position) {
    //     if (position.fuzzyEquals(this.getContentPosition(), EPSILON)) {
    //         return;
    //     }
    //     this.content.setPosition(position);
    //     this._outOfBoundaryAmountDirty = true;
      
        
    // },

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
            node_first.itemComponent.init(this.data[this.end_index] , this.end_index);
            node_first.y = node_end.y - node_end.height;
        }
        if(offset.y < 0 && this.begin_index > 0 && this.content.y + this.item_list[this.index_arr[len - 2]].y < this._bottomBoundary){
            this.begin_index--;
            this.end_index--;
            var first_index = this.index_arr[0];
            var end_index = this.index_arr.pop();
            var node_end = this.item_list[end_index];
            var node_first = this.item_list[first_index];
            // cc.log("totop:",this.data[this.begin_index])
            node_end.itemComponent.init(this.data[this.begin_index] , this.begin_index);
            let layout = node_end.getComponent(cc.Layout)
            if (layout) {
                layout.updateLayout();
            }
            node_end.y = node_first.y + node_end.height;
            this.index_arr.unshift(end_index);
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
            var y = Math.min(this.content.y + node.y - node.height , this.content.y - this.content.height)
            return y;
        }else{
            let contentPos = this.getContentPosition();
            return contentPos.y - this.content.getAnchorPoint().y * this.content.getContentSize().height;
        }
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
