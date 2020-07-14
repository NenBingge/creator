

cc.Class({
    extends: cc.Component,

    properties: {
        item_prefab: {
            type: cc.Prefab,
            default: null,
        },
    },

    // use this for initialization
    onLoad: function () {
        this.OPT_HEIGHT = 0, // 每项的高度
        this.ALL_NUM = 0, // 每页为8个;
        this.scroll_view = this.node.getComponent(cc.ScrollView);
        this.content = this.scroll_view.content;
        this.begin_content_y = this.content.y;
        this.scroll_view.node.on("scroll-began", this._on_scroll_begin.bind(this), this);
        this.scroll_view.node.on("scroll-ended", this._on_scroll_ended.bind(this), this);
    },

    start: function() {
       
    },

    setData(data){
        if(!data)return;
        this.value_set = data;
        this.opt_item_set = [];
        this.item_index_arr = [];
        this.head_index = 0;
        var item = cc.instantiate(this.item_prefab);
        this.content.addChild(item);
        this.opt_item_set.push(item);
        this.item_index_arr.push(0);
        item.zIndex = 0;
        this.ALL_NUM = Math.ceil(this.node.height / item.height) + 2;
        var len = Math.min(this.ALL_NUM , data.length);
        for(var i = 1; i < len; i++) {
            var item = cc.instantiate(this.item_prefab);
            this.content.addChild(item);
            this.opt_item_set.push(item);
            this.item_index_arr.push(i);
            item.zIndex = i;
        }
        this.load_record();
    },

    set_func(func){
        for(let i = 0 , len = this.opt_item_set.length ; i < len ; i++){
            this.opt_item_set[i].getComponent("ViewItem").set_func(func);
        }
    },

    // 从这个索引开始，加载数据记录到我们的滚动列表里面的选项
    load_record: function(index) {
        var i = 0;
        var len = this.ALL_NUM;
        if(index || index == 0){
            i = index;
            len = index + 1;
        }
        for(; i < len ; i ++) {
            this.opt_item_set[this.item_index_arr[i]].getComponent("ViewItem").init(this.value_set[this.head_index + i]);
        }
    },

    _on_scroll_begin(){
        this.is_moving = true;
        // this.cur_pos_y = this.content.y;
    },

    _on_scroll_ended() {
        this.is_moving = false;
    },

    on_scrolling(speed){
        //向上滑
        if(speed > 0){
            var first_item = this.opt_item_set[this.item_index_arr[0]]
            if(this.content.y - this.begin_content_y > first_item.height && this.head_index < this.value_set.length - this.ALL_NUM){
                this.head_index++;
                var first_index = this.item_index_arr.shift();
                this.item_index_arr.push(first_index);
                this.set_zindex();
                this.content.y -= first_item.height;
                this.cur_pos_y = this.content.y;
                // if(speed > 200)return;
                this.load_record(this.ALL_NUM - 1);
            }
        }else{
            var last_item = this.opt_item_set[this.item_index_arr[this.ALL_NUM - 1]];
            if(this.content.y - this.begin_content_y < last_item.height && this.head_index > 0){
                this.head_index--;
                var last_index = this.item_index_arr.pop();
                this.item_index_arr.unshift(last_index);
                this.set_zindex();
                this.content.y += last_item.height;
                this.cur_pos_y = this.content.y;
                // if(speed > 200)return;
                this.load_record(0);
            }
        }
    },

    set_zindex(){
        for(let i = 0 ; i < this.item_index_arr.length ; i++){
            this.opt_item_set[this.item_index_arr[i]].zIndex = i;
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(!this.is_moving)return;
        var offset_y = this.content.y - this.cur_pos_y;
        if(offset_y == 0)return;
        this.cur_pos_y = this.content.y;
        var speed = offset_y / dt;
        this.on_scrolling(speed);
    },
});
