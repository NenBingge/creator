
var HallResources = require("HallResources");
var BetslipData = require("BetslipData");
var AtmControl = require("AtmControl");
var BetslipConst = require("BetslipConst");

cc.Class({
    extends: require("BottomPopDialog"),

    properties: {
        lb_code: cc.Label,
        node_tip: cc.Node,
        lb_temp: cc.Label,
        content: cc.Node,

        // sp_camera: cc.Sprite,
        show_panel: cc.Node,
        camera: cc.Camera,
        node_btn_big: cc.Node,

        follow_panel: require("BetslipFollow"),
        _canvas: null,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.have_init = false;
        this.node_begin_y = this.node_tip.y;
    },


    start () {
        HallResources.getInstance().showLoading();
        this.camera.enabled = false;

        var bets = BetslipData.getAllBet();
        // AtmControl.saveBookingCode(bets , this , this.onBookCode);
        this.follow_panel.init();
        this.state = 1;
    },



    onBookCode(data){
        HallResources.getInstance().removeLoading();
        // cc.log("data:",data);
        this.lb_code.string = data;
    },

    onClickCopy(){
        var aa = BetslipConst.copyTxt(this.lb_code.string);
        this.lb_temp.string = aa;
        this.showTip();
    },

    showTip(){
        this.node_tip.active = true;
        this.node_tip.runAction(cc.sequence(cc.moveBy(2 , 0 , 100) , cc.delayTime(3) , cc.fadeOut(1)))
    },

    onEnable(){
        BetslipData.is_show_share = true;
        this.node_tip.active = false;
    },

    onDisable(){
        BetslipData.is_show_share = false;
    },

    onClose(){
        cc.game.DialogMgr.hide("BetslipShare");
    },

    createCanvas () {
        this.total_height = this.show_panel.height / 2
        this.total_width = this.show_panel.width/ 2;
        if(cc.sys.isBrowser){
            this._canvas = document.createElement('canvas');
            this._canvas.height = this.total_height;
            this._canvas.width = this.total_width;
        }
        this.cur_height = 0;
        this.temp_data = [];
        this.height_arr = [];
    },

    initTexture(){
        let texture = new cc.RenderTexture();
        texture.initWithSize(cc.visibleRect.width / 2 , cc.visibleRect.height / 2 , cc.gfx.RB_FMT_S8);
        this.camera.targetTexture = texture;
        this.texture = texture;
    },

    createImg () {
        var dataURL = this._canvas.toDataURL("image/png");
        var img = document.createElement("img");
        img.src = dataURL;
        return img;
    },

    getImgNode(img){
        let texture = new cc.Texture2D();
        cc.log("getImgNode::::::1");
        if(img){
            texture.initWithElement(img);
        }else{
            texture.initWithData(this.picData, 32, this.total_width, this.total_height);
        }
        cc.log("getImgNode::::::2");
        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);

        let node = new cc.Node();
        let sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;
        return node;
    },
    //web专用
    setCtxData(ctx , all_data , heights , width){
        let cur_height = 0;
        var height = cc.visibleRect.height / 2;
        let rowBytes = width * 4;
        for(let i = 0 ; i < all_data.length ; i++){
            let data = all_data[i];
            let add_height = heights[i];
            for(let row = 0 ,bottom = height - 1 ; row < add_height ; row++ , bottom--){
                let start = bottom * width * 4;
                let imageData = ctx.createImageData(width, 1);
                for (let j = 0; j < rowBytes; j++) {
                    imageData.data[j] = data[start + j];
                }
                ctx.putImageData(imageData, 0, row + cur_height);
            }
            cur_height += height;
        }
    },
    //jsb专用
    getPicData(all_data , heights , width){
        var picData = new Uint8Array(width * this.total_height * 4);
        let cur_height = 0;
        var height = cc.visibleRect.height / 2;
        let rowBytes = width * 4;
        for(let i = 0 ; i < all_data.length ; i++){
            let data = all_data[i];
            let add_height = heights[i];
            for(let row = 0 ,bottom = height - 1 ; row < add_height ; row++ , bottom--){
                let start = bottom * width * 4;
                let re_start = cur_height * rowBytes + row * rowBytes;
                for (let j = 0; j < rowBytes; j++) {
                    picData[re_start + j] = data[start + j];
                }
            }
            cur_height += height;
        }
        this.picData = picData;
    },

    update (dt) {
        if(this.state == 1){
            this.camera.enabled = true;
            this.state = 2;
            return;
        }
        if(this.state != 2)return;
        if(!this.have_init){
            this.have_init = true;
            this.createCanvas();
            this.initTexture();
        }
        let need_height = this.show_panel.height- this.cur_height > cc.visibleRect.height ?  cc.visibleRect.height : this.show_panel.height - this.cur_height;
        this.camera.render();
        let data = this.texture.readPixels();
        this.temp_data.push(data);
        this.height_arr.push(need_height/2);
        this.cur_height += need_height;
        this.show_panel.y = this.show_panel.y + need_height;
        if(this.cur_height >= this.show_panel.height){
            let width = this.texture.width;
            var node = null;
            if(cc.sys.isBrowser){
                let ctx = this._canvas.getContext('2d');
                this.setCtxData(ctx , this.temp_data , this.height_arr , width);
                var img = this.createImg();
                node = this.getImgNode(img);
            }else if(CC_JSB){
                this.getPicData(this.temp_data , this.height_arr , width);
                node = this.getImgNode();
            }else{
                return;
            }
           
            node.parent = this.content;
            this.node_show = node;
            this.content.height = this.total_height;
            this.show_panel.destroy();
            this.camera.node.destroy();
            this.show_panel = null;
            this.camera = null;
            HallResources.getInstance().removeLoading();
            this.state = 3;
        }
    },

    saveImg(){
        if(CC_JSB){
            let filePath = jsb.fileUtils.getWritablePath() + 'bet_share.png';
            let success = jsb.saveImageData(this.picData, this.total_width, this.total_height, filePath)
            if (success) {
                __ShowCommonTip2("image save to: \n" + filePath);
            }
            else {
                cc.error("save image data failed!");
            }
        }else{
            cc.log("no jsb");
        }
    },

    onClickBig(){
        this.node_btn_big.active = false;
        this.node_show.height = this.content.height = this.total_height * 2;
        this.node_show.width = this.content.width = this.total_width * 2;
    },

    onDestroy(){
        this.temp_data = null;
        this.height_arr = null;
        this._canvas = null;
        this.picData = null;
    },
});
