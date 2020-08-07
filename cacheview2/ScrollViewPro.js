import testItem from "testItem";
import { endianness } from "os";

const EPSILON = 1e-4;

cc.Class({
    extends: cc.ScrollView,

    properties: {
        item_prefab: cc.Prefab,
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
        this.item_num = 0;
        this.item_list = [];
        this.index_arr = [];
    },

    start(){
        this._super();
        var arr = [];
        for(let i = 0 ; i < 6 ; i++){
            arr.push(i);
        }
        this.initData(arr);
       
    },

    initData(data){
        this.data = data;
        var first_node = cc.instantiate(this.item_prefab);
        first_node.parent = this.content;
        first_node.getComponent(testItem).init(data[0] , 0);
        var begin_y = 0;
        first_node.y = begin_y;
        begin_y -= first_node.height;
        var num = Math.ceil(this._view.height / first_node.height);
        this.item_num = num + 2;
        cc.log("item_Num:",this.item_num);
        this.item_list.push(first_node);
        this.index_arr.push(this.end_index);
        var data_len = data.length;
        for(let i = 0 ; i < this.item_num - 1 ; i++){
            var node = cc.instantiate(this.item_prefab);
            node.parent = this.content;
            if(i + 1 < data_len){
                node.getComponent(testItem).init(data[i + 1] , i + 1);
                node.y = begin_y;
                begin_y -= node.height;
                this.item_list.push(node);
                this.end_index++;
                this.index_arr.push(this.end_index);
            }else{
                node.active = false;
            }
        }
        this._calculateBoundary();
    },

    refreshData(data){
        this.data = data;

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
            cc.log("tobottom:",this.data[this.end_index])
            node_first.getComponent(testItem).init(this.data[this.end_index] , this.end_index);
            node_first.y = node_end.y - node_end.height;
        }
        if(offset.y < 0 && this.begin_index > 0 && this.content.y + this.item_list[this.index_arr[len - 2]].y < this._bottomBoundary){
            this.begin_index--;
            this.end_index--;
            var first_index = this.index_arr[0];
            var end_index = this.index_arr.pop();
            var node_end = this.item_list[end_index];
            var node_first = this.item_list[first_index];
            cc.log("totop:",this.data[this.begin_index])
            node_end.getComponent(testItem).init(this.data[this.begin_index] , this.begin_index);
            this.index_arr.unshift(end_index);
            node_end.y = node_first.y + node_end.height;
        }
    },



    _getContentTopBoundary () {
        if(this.index_arr.length > 0){
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
        if(this.index_arr.length > 0){
            var node = this.item_list[this.index_arr[this.index_arr.length - 1]];
            return this.content.y + node.y - node.height;
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
