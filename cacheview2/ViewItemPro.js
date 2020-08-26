
cc.Class({
    extends: cc.Component,

    properties: {
        layouts: [require("LayoutPro")],
    },

    init(){

    },

    setScroll(scroll){
        if(this.layouts.length > 0){
            for(let i = 0 ; i < this.layouts.length ; i++){
                this.layouts[i].setScroll(scroll , true);
                scroll.addLayout(this.layouts[i]);
            }
        }
    },

    refreshLayout(){
        if(this.layouts.length > 0){
            for(let i = 0 ; i < this.layouts.length ; i++){
                if(this.layouts[i].node.active){
                    this.layouts[i].refreshData();
                }
            }
        }
    },
});
