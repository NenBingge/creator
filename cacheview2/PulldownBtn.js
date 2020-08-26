

cc.Class({
    extends: cc.Component,

    properties: {
        node_arrow: cc.Node,
        node_show: cc.Node,
        
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.is_show = true;
        this.node.on("click" , this.onClick , this);
        if(this.node_show.getComponent("LayoutPro")){
            this.layout_pro = this.node_show.getComponent("LayoutPro");
        }
    },

    setCallfunc(func){
        this.func = func;
    },

    setState(state , no_call){
        // if(this.is_show == state)return;
        this.is_show = state;
        if(state){
            this.node_arrow.angle = 0;
            if(!no_call){
                this.node_show.active = true;
                if(this.layout_pro){
                    this.node_show.y = this.node.y - this.node.height * this.anchorY;
                }
            }
        }else{
            this.node_arrow.angle = 90;
            if(!no_call){
                if(this.layout_pro && this.node_show.active){
                    this.layout_pro.clearMyItems();
                }
                this.node_show.active = false;
            }
        }
    },

    onClick(){
        this.setState(!this.is_show);
        if(this.func){
            this.func(this.is_show);
        }
    },

    start () {

    },

    // update (dt) {},
});
