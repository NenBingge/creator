
var LayoutItemPro = require("LayoutItemPro");

cc.Class({
    extends: cc.Component,

    properties: {
        // scroll: require("ScrollViewPro"),
        m_type: 0,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.item_list = [];
    },

    setScroll(scroll , need_calc_parent){
        this.scroll = scroll;
        this.content = this.scroll.content;
        this.need_calc_parent = need_calc_parent;
        // if(need_calc_parent){
        //     this.parent = this.node.parent;
        // }
    },


    initData(data,p1,force_refresh){
        this.have_init = false;
        this.data = data;
        this.p1 = p1;
        if(!this.node_height){
            var node = this.scroll.getCacheByType(this.m_type);
            this.node_height = node.height;
            this.scroll.pushCacheByType(this.m_type , node);
        }
        this.node.height = this.node_height * data.length;
        if(!this.need_calc_parent || force_refresh){
            this.refreshData();
        }
    },

    refreshData(){
        if(!this.data || this.data.length <= 0)return;
        var top = this.scroll._topBoundary;
        var m_top = this.getTopPos();
        if(m_top < this.scroll._bottomBoundary){
            this.begin_index = 0;
            this.end_index = this.data.length >= 2 ? 1 : 0;
        }else if(m_top - this.node.height > top){
            this.end_index = this.begin_index = this.data.length - 1;
            if(this.data.length >= 2)this.begin_index--;
        }else{
            var show_top = top < m_top ? top - m_top : 0;
            if(show_top == 0){
                this.begin_index = 0;
            }else{
                this.begin_index = Math.floor(-show_top / this.node_height);
            }
            var num = Math.ceil(this.scroll.node.height / this.node_height) + 1;
            if(this.begin_index + num > this.data.length){
                num = this.data.length - this.begin_index;
            }
            this.end_index = this.begin_index + num - 1;
        }
        this.showItems();
        this.have_init = true;
    },

    showItems(){
        this.clearMyItems(true);
        cc.log("begin:",this.begin_index);
        cc.log("end:",this.end_index);
        for(let i = this.begin_index ; i <= this.end_index ; i++){
            var node = this.scroll.getCacheByType(this.m_type);
            node.itemComponent.init(this.data[i] , i , this.p1);
            this.item_list.push(node);
            node.parent = this.node;
            node.y = -this.node_height * i;
        }
    },
    geneOneNode(index){
        var node = this.scroll.getCacheByType(this.m_type);
        node.parent = this.node;
        node.itemComponent.init(this.data[index] , index , this.p1);
        node.y = -this.node_height * index;
        return node;
    },

    // refreshData(){
    //     if(!this.data || this.data.length <= 0)return;
    //     var m_top = this.getTopPos();
    //     var top = this.scroll._topBoundary;
    //     var show_top = top < m_top ? top - m_top : 0;
    //     var show_bottom = show_top -this.scroll.node.height;;
    //     if(show_bottom < -this.node.height)show_bottom = -this.node.height;
    //     this.showItems(show_top);
    //     this.have_init = true;
    // },

    // showItems(show_top , bottom_top){
    //     this.clearMyItems(true);
    //     if(show_top == 0){
    //         this.begin_index = 0;
    //     }else{
    //         this.begin_index = Math.floor(-show_top / this.node_height);
    //     }
    //     var num = Math.ceil(this.scroll.node.height / this.node_height) + 1;
    //     if(this.begin_index + num > this.data.length){
    //         num = this.data.length - this.begin_index;
    //     }
    //     this.end_index = this.begin_index + num - 1;
    //     var index = 0;
    //     this.item_list = [];
    //     for(let i = 0 ; i < num ; i++){
    //         index = this.begin_index + i;
    //         var node = this.scroll.getCacheByType(this.m_type);
    //         node.itemComponent.init(this.data[index] , index , this.p1);
    //         this.item_list.push(node);
    //         node.parent = this.node;
    //         node.y = -this.node_height * index;
    //     }
    //     cc.log("this.type:",this.m_type , ":",this.node.children.length)
    // },

    refreshItem(offset){
        if(!this.have_init)return;
        //向上
        if(offset.y > 0){
            if(this.item_list.length <= 0 && this.data.length > 0){
                if(this.getTopPos()  > this.scroll._bottomBoundary){
                    this.begin_index = 0;
                    this.end_index = this.data.length > 1 ? 1 : 0;
                    this.showItems();
                }
            }else{
                if(this.end_index < this.data.length - 1){
                    var len = this.item_list.length;
                    if(len > 1 && this.getTopPos() + this.item_list[len-1].y > this.scroll._bottomBoundary){
                        this.end_index++;
                        var node = this.geneOneNode(this.end_index);
                        this.item_list.push(node);
                    }
                }
            }
            if(this.item_list.length > 2 && this.getTopPos() + this.item_list[1].y > this.scroll._topBoundary){
                var node = this.item_list.shift();
                this.scroll.pushCacheByType(this.m_type , node);
                this.begin_index++;
            }
        }
        //向下
        else if(offset.y < 0){
            if(this.item_list.length <= 0 && this.data.length > 0){
                if(this.getTopPos() - this.node.height < this.scroll._topBoundary){
                    if(this.data.length > 1){
                        this.begin_index = this.data.length - 2;
                        this.end_index = this.begin_index + 1;
                    }else{
                        this.begin_index = this.end_index = this.data.length - 1;
                    }
                    this.showItems();
                }
            }else{
                if(this.begin_index > 0){
                    if(this.item_list.length > 1 && this.getTopPos() + this.item_list[1].y < this.scroll._topBoundary){
                        this.begin_index--;
                        var node = this.geneOneNode(this.begin_index);
                        this.item_list.unshift(node);
                    }
                }
                var len = this.item_list.length;
                if(len > 2 && this.getTopPos() + this.item_list[len-1].y < this.scroll._bottomBoundary){
                    var node = this.item_list.pop();
                    this.scroll.pushCacheByType(this.m_type , node);
                    this.end_index--;
                }
            }
        }
    },


    getTopPos(){
        if(this.need_calc_parent){
            return this.content.y + this.node.y + this.node.parent.y;
        }else{
            return this.content.y + this.node.y;
        }
    },

    clearMyItems(force){
        if(force){
            if(this.node.children.length > 0){
                var childrens = this.node.children;
                for(let i = childrens.length - 1 ; i >= 0 ; i--){
                    this.scroll.pushCacheByType(this.m_type , childrens[i]);
                }
            }
        }else{
            if(this.item_list.length > 0){
                for(let i = this.item_list.length - 1 ; i >= 0 ; i--){
                    this.scroll.pushCacheByType(this.m_type , this.item_list[i]);
                }
            }
        }
        this.item_list = [];
    },

    // start () {

    // },

    // update (dt) {
        // if(!this.content)return;
        // //-198 bottom: -1058
        // var top = this.scroll._topBoundary;
        // var bottom = this.scroll.node.height;
        // var m_top = this.getTopPos();
        // var m_bottom = m_top - this.node.height;
        // var show_top = top < m_top ? top - m_top : 0;
        // var show_bottom = show_top -bottom;
        // if(show_bottom < -this.node.height)show_bottom = -this.node.height;
        // cc.log("top:",show_top , "bottom:",show_bottom);
    // },
});
