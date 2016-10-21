
//总结:
// 单向链表缺陷在于插入时候头尾重复判断 效率低下 双向链表解决了这个问题
// 本类关键函数: 具体详解查看各自函数说明
// createNode 创建
// insert     插入
// remove     移除
// getMap     获取map
// getArray   获取数组
// copyNode   深拷贝节点
// copy       深拷贝类(指定拷贝链表 也就是节点)
// update     更新链表

//用于测试排序的数据类型(外部可以自行定义所需类型)
export interface TestData1{
    [userId:string]:{ obj:{ [msgId:number]:number; };msgStr:string; };
}
export interface TestData2{
    key:string;
    value:number;
}
///////////////////////////////////////上面是测试类型///////////////////////////////////////
//规则函数(只有在升序或降序类型有用 其余类型即便传入也无效果)
export interface ICMP{
    (a:any,b:any):boolean
}
//链表类型
export interface Node{
    name?:string;//这个值用于map做key用 不需要可以不赋值(注:如果用到map 此数据很关键)
    pre?:Node;//上一个节点
    next?:Node;//下一个节点
    value?:number;//value一般用于方便记录复杂的data里头的关键数据 便于更快获取数据 和排序 不需要可以不赋值
    data?:any;//泛指任何可能类型 如上述:TestData1、TestData2 ...
}

export enum SortType {
    nothing = -1, //什么类型都不是(总是返回空链表list 空数组array 空map)
    order   = 1,  //顺序(按照数据的先后插入到链表 从尾插入)
	Asc     = 2,  //升序(主要针对数组操作)
	Desc    = 3,  //降序(主要针对数组操作)
    shuffle = 4   //乱序(随机插入到链表中)
}
/*
 * 链表中的数据都是以引用的形式存在  外部单独改变数据会影响链表
 * 如果希望链表里边的数据是单独存在 想与外部隔离的话  插入前应该深度拷贝一份新数据 然后把新数据插入链表
 * 【最好的使用方式是把需要按照某一需要数据的数据优先赋值到Node的value 这样就不用麻烦new去传入规则 而且效率更高】
 * 
 * 声明:
 * 【严格运用本类公开函数对数据进行操作 不要私自移除或者插入更改本类中的数组或者map的数据 如需增加或者移除数据 用本类函数即可】
 */
export class STL {
    private _Map:any;//Map: key-value的数据结构
    private _Array:Node[];//vector 数组
    private _list:Node;//list 链表(头)
    private _tail:Node;//list 链表(尾)
    private _sortType:number;//排序类型(指数组array的排序)
    private _length:number;//链表长度
    private _dirtyArray:boolean;//表示array数据是否脏了
    private _dirtyMap:boolean;//表示map数据是否脏了
    private _cmp:any;//外部给入的排序规则 必须是a<b 或者 a<=b 且a是原链表(节点) b是新数据(节点)
    constructor(l?:Node,t?:number,cmp?:any) {
        if (t){
            this._sortType = t;
        }
        else{
            this._sortType = SortType.order;
        }
        if (l){
            //注意:自己给的链表最好自己先排好序 否则除了升序->无序的过程会重新排序以外都是直接按照升序链表插入
            this._list = l;
            // this._length = 1;//不一定是1个节点可能初始化的时候有好几个node连接着 setTail统计
        }
        else{
            this._list = null;
        }
        //有规则 则默认切换到升序(可在 获取数组 或者 再插入时候 自行切换排序规则)
        this._cmp = cmp;
        if(this._cmp){
            this._sortType = SortType.Asc;
        }

        this._length = 0;//初始化为0 让各自函数统计长度

        this._Map = {};
        this._Array = [];
        this._dirtyArray = false;
        this._dirtyMap = false;
        this.setTail();//给尾巴赋值
        
    }
    /*
    **************************************************************************************
    ***************************************静态*******************************************
    **************************************************************************************
    */
    /**
     * 创建一个节点(注意:这里并没有把data进行深度拷贝 而是引用方式创建node 
     * 如需拷贝 创建后直接调用copyNode)
     * 
     * @param {any}     data  自定义数据
     * @param {string}  key   赋值后可用作于map的key
     * @param {number}  value 赋值后可用作于排序所需关键数值比较 
     * 对value进一步解释:
     * 比如data数据较为复杂 但是需要里面的某个值作为排序依据
     * 可以把值放在value里面 但要记住 data若改变这个数值 这里要自行同步 因为内部不知道
     * 也可以不传 在new stl时候传入规则 以后这个链表所有排序操作都将按照这个规则 规则排序比默认的value稍慢些
     * 
     * @return {Node} 返回Node类型
     */
    static createNode(data:any,key?:string,value?:number){
        var node:Node = {name:"",pre:null,next:null,value:0,data:data};
        if (key){
            node.name = key;
        }
        if(value){
            node.value = value;
        }
        return node;
    }

    /*
    **************************************************************************************
    ***************************************公有*******************************************
    **************************************************************************************
    */

    /** 
     * 获取当前array是否被更新过
     * 
     * @return {boolean} dirty
     */
    public getDirtyArray(){
        return this._dirtyArray;
    }
    /** 
     * 获取当前map是否被更新过
     * 
     * @return {boolean} dirtyMap
     */
    public getDirtyMap(){
        return this._dirtyMap;
    }
    /** 
     * 获取链表长度
     * 
     * @return {number} length
     */
    public getlength(){
        return this._length;
    }
    /** 
     * 获取当前链表排序类型
     * 
     * @return {number} sortType
     */
    public getSortType(){
        return this._sortType;
    }
    //用于测试(外部不要用这个函数!)
    // public setSortType(t){
    //     this._sortType = t;
    // }
    /** 
     * 获取当前链表(头)
     * 
     * @return {Node} list
     */
    public getList(){
        return this._list;
    }
    /** 
     * 获取当前链表(尾)
     * 
     * @return {Node} tail
     */
    public getTail(){
        return this._tail;
    }
    /**
     * 移除链表中的某个值(因为用map移除快) 注:通过map移除节点是直接影响链表
     * 【因为Node是带有前后关系 并且是引用】 重新获取数组也可以得到最新移除后的数组
     * 【注:此方法只能移除一个节点 节点前后忽略】
     * 
     * @param {Node}  removeNode 需要移除的数据
     * 
     * @return {boolean} 移除是否成功 
     */
    public remove(removeNode:Node){
        //需要移除的数据是空 不处理
        if(!removeNode){
            return false;
        }
        //map是否脏了(从链表中获取值给map)
        if(this._dirtyMap){//因为插入和移除都会刷新map 如果链表没值 数据是不可能有的
            this._Map = this.getMap();//里头刷新_dirtyMap
            console.log("map数据脏了 获取Map...");
        }
        //经过上面的过滤 此处如果map是空 证明链表本身就没数据 无需再往下操作
        if (!this.isObj(this._Map)){
            console.log("链表本来就是空 map当然是空 移除个毛线!");
            return false;
        }
        console.log("removeNode.name = "+removeNode.name);
        console.log("removeNode.pre = "+removeNode.pre);
        console.log("removeNode.next = "+removeNode.next);
        if (removeNode.next)
            console.log("removeNode.next.name = "+removeNode.next.name);

        //map中没有这个值(移除前 链表没有node)
        var key = removeNode.name;
        if( !this._Map[key] ){
            console.log(key+"不存在于map中");
            return false;
        }
        /*** 注意:【往下开始 this._Map[key] == removeNode】***/

        //对头进行临界判定
        if( this._list == removeNode ){
            this._list = removeNode.next;
            if (this._list){
                this._list.pre = null;
            }
            //头的下一个不存在 证明链表空了
            else{
                this._list = this._tail = null;
                this._Map = {};//清空map
            }
        }
        //对尾进行临界判定
        else if(this._tail == removeNode ){
            this._tail = removeNode.pre;
            if (this._tail){
                this._tail.next = null;
            }
            //尾的上一个不存在 证明链表空了 (理论上不会进来这里 因为头已经判定了)
            else{
                this._list = this._tail = null;
                this._Map = {};//清空map
            }
        }
        //对中间进行判定
        else{
            // console.log("remove (**removeNode.pre**) = "+removeNode.pre);
            // console.log("remove (**removeNode.next**) = "+removeNode.next);
            if (removeNode.pre)
                removeNode.pre.next = removeNode.next;
            if (removeNode.next)
                removeNode.next.pre = removeNode.pre;
            delete this._Map[key];//移除
        }
        //数据移除后 array脏了
        this._dirtyArray = true;
        //移除后把数据前后置空 免得数据重复插入时候出问题
        removeNode.pre = null;
        removeNode.next = null;

        this._length--;
        return true;
    }
    /**
     * 从map中获取node
     * 
     * @param {Node}  curNode 需要查找的数据
     * 
     * @return {Node} 
     */
    public find(curNode:Node):Node{
        if( !curNode ){
            console.log("findNode is null");
            return null;
        }
        if(!this.isObj(this._Map) || this._dirtyMap){
            this._Map = this.getMap();
        }
        var key = curNode.name;
        if( !this._Map[key] ){
            console.log("key = "+key);
            return null;
        }
        console.log("this._Map["+key+"] = "+this._Map[key]);
        return this._Map[key];
    }
    
    /**
     * 获取当前Map(以name为key的树结构) 注:操作过链表后 不会即时刷新数组和map 需要重新获取
     * (注:map跟array有点不同 它是按照链表的顺序来的 它没有排序可言 主要用于查找和移除数据)
     * 函数会刷新_dirtyMap
     * 
     * @return {any} map对象
     */
    public getMap():any{
        //map的数据从链表里获取 链表都没有数据了 map当然没有数据
        if (!this._list){
            this._Map = {};
            this._dirtyMap = false;
            console.log("map的数据从链表里获取 链表都没有数据了 map当然没有数据");
            return this._Map;
        }

        if( !this._dirtyMap && this.isObj(this._Map) ){
            console.log("没脏 有数据 直接返回");
            return this._Map;
        }
        console.log("this._dirtyMap = "+this._dirtyMap);
        console.log("this.isObj(this._Map) = "+this.isObj(this._Map));
        
        //给map赋值
        this._dirtyMap = false;
        this._Map = {};//清空map
        this.MapPushDG(this._list);

        return this._Map;
    }
    /**
     * 获取当前数组 
     * 注:操作过链表后 不会即时刷新数组和map 需要重新获取(乱序第一次获取会刷新数组)
     * 重复获取不脏的同类型数组 直接返回数组
     * 函数调用后会刷新_dirtyArray=false 
     * 【注意:cmp必须是升序规则 即 a < b 或 a <= b  a是原先数据 b是需要插入的数据
     * 如果插入时候给了规则 获取也必须给规则 因为全部按照这个规则来获取数据】
     * 
     * @param {number}  sortType 按照什么排序类型获取(可不传 默认当初new时候的类型)
     * @param {ICMP}    cmp 按照什外部指定规则做升序链表
     * 
     * @return {Node[]} 排序数组
     */
    public getArray(stype?:number):Node[]{
        console.log("------------ getArray ------------");
        console.log("this._sortType = "+this._sortType);
        console.log("stype = "+stype);
        console.log("this._dirtyArray = "+this._dirtyArray);
        
        //数组的数据从链表里获取 链表都没有数据了 数组当然没有数据
        if (!this._list){
            this._Array = [];
            this._dirtyArray = false;
            // console.log(">>>行321");
            return this._Array;
        }
        //获取外部传入的规则(new stl时候给出)
        var cmp = this._cmp;
        //情况:从有序获取无序 或者 从无序获取有序走上分支   有序指:升序和降序  无序指:顺序和乱序
        //从_sortType(Asc||Desc)->stype(order||shuffle)  或者 _sortType(order||shuffle)->stype(Asc||Desc)都需走上面分支
        if ( ( (this._sortType == SortType.Asc   || this._sortType == SortType.Desc) && (stype == SortType.order || stype == SortType.shuffle) ) ||
             ( (this._sortType == SortType.order || this._sortType == SortType.shuffle) && (stype == SortType.Asc   || stype == SortType.Desc) )
            ){
             //注意此处:stype有序 _sortType一定无序  反之同理
             console.log("注意此处:stype有序 _sortType一定无序  反之同理");
             this.updateSequence(stype,cmp);
             //因为排序是快排 默认从小到大 如果是降序 需要这里再向链表反向取一次值
             if (this._sortType == SortType.Desc){
                 console.log("因为排序是快排 默认从小到大 如果是降序 需要这里再向链表反向取一次值");
                 this.getDescArrayEx();
             }
             this._dirtyArray = false;
        }
        //升降序互相获取  顺乱序互相获取
        else if( ( (this._sortType == SortType.Asc && stype == SortType.Desc) || (this._sortType == SortType.Desc && stype == SortType.Asc) ) || //升序获取降序 或 降序获取升序
                ( (this._sortType == SortType.order && stype == SortType.shuffle) || (this._sortType == SortType.shuffle && stype == SortType.order)) //顺序获取乱序 或 乱序获取顺序
               ){
                //直接从表头获取
                console.log("直接从表头获取");
                this._sortType = stype;
                //判断未改变类型前 链表的顺序是怎样的 获取后再改变类型
                if (this._sortType == SortType.Desc){
                    this.getDescArrayEx();
                }
                else if(this._sortType == SortType.Asc){
                    this.getAscArrayEx();
                }
                else if(this._sortType == SortType.shuffle){
                    this.updateSequence(stype,cmp);
                }
                else{//this._sortType == SortType.order
                    this._Array = this.getArrayPure();//直接重新获取表头
                }
                
                this._dirtyArray = false;
        }
        //同类型获取: this._sortType == sortType(传不传都无所谓了 上述两种情况已经包含了不同类型的所有情况)
        else{
            // console.log("同类型获取: this._sortType == sortType(传不传都无所谓了 上述两种情况已经包含了不同类型的所有情况)");
            //如果数组 【条件:有数据 没有脏 同类型没要求】 直接返回
            console.log("同类型获取: this._sortType == sortType(传不传都无所谓了 上述两种情况已经包含了不同类型的所有情况)");
            console.log("this._Array.length before === "+this._Array.length);
            console.log("this._dirtyArray === "+this._dirtyArray);
            if(this._Array.length > 0 && !this._dirtyArray){
                console.log("直接返回数组this._Array");
                return this._Array;
            }
            //【条件:有数据 脏了 or 没数据 没脏 or 没数据 脏了】
            //更新数组 置换_dirtyArray为没脏
            this._dirtyArray = false;

            //根据排序类型获取数组数据(来到这里 链表肯定是相同类型)
            //升序
            if (this._sortType == SortType.Asc){
                console.log("getAscArrayEx");
                this.getAscArrayEx();
            }
            //降序
            else if (this._sortType == SortType.Desc){
                console.log("getDescArrayEx");
                this.getDescArrayEx();
            }
            //顺序
            else if (this._sortType == SortType.order){
                this._Array = this.getArrayPure();//原来是怎样的数组就返回怎样的回去
            }
            //乱序
            else if (this._sortType == SortType.shuffle){
                this.updateSequence(SortType.shuffle);
            }
            else{
                console.log("这是什么类型:"+this._sortType);
                return [];
            }
            console.log("this._Array.length after === "+this._Array.length);
        }
        return this._Array;

        // console.log("*******************测试专用区*******************");
        // console.log("------------开始获取数组------------------");
        // this._Array = this.getArrayPure();
        // console.log("------------获取数组完毕 开始输出链表 数组------------------");
        // this.out(this.getList());
        // console.log("------------开始输出数组------------------");
        // console.log("this._Array[0].name = "+this._Array[0].name);
        // console.log("this._Array[0].value = "+this._Array[0].value);
        // console.log("this._Array[0].next = "+this._Array[0].next);
        // console.log("this._Array[0].pre = "+this._Array[0].pre);
        // console.log("《《《《《《《《《《《改变数组》》》》》》》》》");
        // this._Array[0].name = "nullnullnull";
        // this._Array[0].value = 709394666;
        // this._Array[0].next = null;
        // this._Array[0].pre  = null;
        // console.log("------------改变后输出数组------------------");
        // console.log("this._Array[0].name = "+this._Array[0].name);
        // console.log("this._Array[0].value = "+this._Array[0].value);
        // console.log("this._Array[0].next = "+this._Array[0].next);
        // console.log("this._Array[0].pre = "+this._Array[0].pre);
        // return this._Array;
    }
    
    /**
     * 插入链表
     * (按照当前链表的排序类型进行插入) 注:操作过链表后 不会立刻刷新数组(乱序除外)和map 需要重新获取
     * 因为频繁插入频繁刷新会有效率问题 用到获取了才刷新
     * 【所插入的数据必须是头 不能是一个中间节点 否则会忽略插入数据前面所有数据】
     * 
     * @param {Node}    newdata    需要插入的数据
     * @param {number}    stype    排序类型(如果对插入后的类型没有要求 可不用传)
     * 
     * @return {boolean} 是否成功插入链表
     */
    public insert(newdata:Node,stype?:number){
        if(!newdata){
            console.log("新数据为空不进行没意义赋值");
            return false;
        }
        if(!this._list){
            newdata.pre = null;//确保是头
            this._list = newdata;
            this.ListPushDG(newdata,true);//因为newdata有可能是一个带有2个或以上Node的链表 不能直接赋值给尾;
            // this._tail = newdata;
            // this._length++;//可能插入的是一个链表
            console.log("原链表为空 赋值新数据:"+newdata.name);
            this.setDirty(true);//链表被更新了
            return true;
        }
        //外部new时候传入链表的规则 链表则按照这个规则排序
        var cmp = this._cmp;
        console.log("【运行到此时链表至少含有1个数据 以下所有判定都是在这个基本条件上做】");
        //【运行到此时链表至少含有1个数据 以下所有判定都是在这个基本条件上做】
        //情况:从有序变无序 或者 从无序变有序走上分支   有序指:升序和降序  无序指:顺序和乱序
        //从_sortType(Asc||Desc)->stype(order||shuffle)  或者 _sortType(order||shuffle)->stype(Asc||Desc)都需走上面分支
        if ( ((this._sortType == SortType.Asc || this._sortType == SortType.Desc) && (stype == SortType.order || stype == SortType.shuffle)) &&
              ((this._sortType == SortType.order || this._sortType == SortType.shuffle) && (stype == SortType.Asc || stype == SortType.Desc))
            ){
            console.log("情况:从有序变无序 或者 从无序变有序走上分支   有序指:升序和降序  无序指:顺序和乱序");
            //不要在此处改变_sortType 函数updateSequence内部去改变
            this.push(newdata,false);//传入false 让updateSequence去刷新 但会刷新_dirtyMap
            //注意此处:stype有序 _sortType一定无序  反之同理
            this.updateSequence(stype,cmp);//array是否有脏 函数内部决定了
        }
        //升降序互相插入后切换  顺乱序互相插入后切换
        else if( ( (this._sortType == SortType.Asc && stype == SortType.Desc) || (this._sortType == SortType.Desc && stype == SortType.Asc) ) //升序->降序 或 降序->升序
               ){
               //注意:此处_sortType和stype一定是一个升序 另一个降序
               //有规则则按规则比较
                if (cmp){
                    console.log("有规则则按规则比较");
                    this.rule(this._list,newdata,cmp,stype);
                }
                //无规则按Node的value比较
                else{
                    console.log("无规则按Node的value比较");
                    this.Asc(this._list,newdata,stype);
                }
        }
        //乱序->顺序
        else if ( (this._sortType == SortType.shuffle && stype == SortType.order) )
        {
            //数组不变 直接插入
            this.push(newdata);//原来链表的尾连接newdata 再指向新尾即可
        }
        //顺序->乱序
        else if( ( (this._sortType == SortType.order && stype == SortType.shuffle)  ) 
               ){
               //原先是顺序的 先插入 后再乱序
               this.push(newdata);
               this.updateSequence(SortType.shuffle);
        }
        //同类型插入
        else{
            //改用双向链表后统一按升序处理就够了(双向链表中_sortType只针对升序和降序数组 对链表毫无意义)
            if(this._sortType == SortType.Asc || this._sortType == SortType.Desc){
                //有规则则按规则比较
                if (cmp){
                    console.log("同类型:有规则则按规则比较");
                    this.rule(this._list,newdata,cmp,stype);
                }
                //无规则按Node的value比较
                else{
                    console.log("同类型:无规则按Node的value比较 stype = "+stype);
                    this.Asc(this._list,newdata,stype);
                }
            }
            //顺序从尾插入数据
            else if(this._sortType == SortType.order){
                console.log("同类型:顺序从尾插入数据");
                this.push(newdata);
            }
            //乱序插入
            else if(this._sortType == SortType.shuffle){
                console.log("同类型:乱序插入数据");
                //本身已经是乱序 直接随机一个位置插入即可 无需重新乱序
                this.shuffle(newdata);
                //比较特殊:此时刷新数组为不脏 因为乱序插入本身带有乱序效果 下次获取乱序类型的数组则直接获取即可
                this._dirtyArray =false;
            }
            else{
                console.log("没有排序类型 = "+this._sortType);
                return false;
            }
        }
        
        return true;
    }
    /**
     * 深度拷贝Node
     * 
     * @param {Node}  curNode 需要拷贝的Node数据
     * 
     * @return {Node} 返回stl类型
     */
    public copyNode(curNode:Node):Node{
       // console.log("------深度拷贝Node开始-----");
       var copyNode:Node = null;
        if (curNode){
            copyNode = this.deepCopy(copyNode,curNode);
        }
        // console.log("------深度拷贝Node结束-----");
        return copyNode;
    }

    /**
     * 深度拷贝一份一模一样的链表返回出去(类型是stl)
     * 
     * @param {STL}  stl 需要拷贝的stl数据(可不传 默认拷贝调用者本身) 
     * 
     * @return {STL} 返回stl类型
     */
    public copy(stl?:STL):STL{
        // console.log("------深度拷贝list开始-----");
        var copylist:STL;
        var tmpNode:Node = {};
        //指定拷贝stl
        if( stl ){
            var list:Node = stl.getList();
            if(list){
                tmpNode = this.deepCopy(tmpNode,list);
                copylist = new STL(tmpNode);
            }
        }
        //默认拷贝对象stl
        else{
            tmpNode = this.deepCopy(tmpNode,this._list);
            copylist = new STL(tmpNode);
        }
        // console.log("------深度拷贝list结束-----");
        return copylist;
    }
    
    /**
     * 更新链表【一般用于主动打乱已经是乱序类型的乱数组 因为同是乱序类型重复获取数组 不会重复打乱】
     * 一般用于重复主动打乱已经是乱序的数组 内部已经处理需要打乱的情况 由于考虑想再打乱一次 所以公开借口 
     * 若需在乱序链表情况下获取有序的东西(泛指数组) getArray指定类型就好 getArray具体详情查看函数解释和测试区解释用法
     * 此方法和updateSequence一样 但为了区分外部和内部函数多写了一个 方便日后扩展区分
     *
     */
    public update(sortType?:number){
        var cmp = this._cmp;
        var stype = SortType.shuffle;
        if (sortType){
           stype = sortType;
        }
        this.updateSequence(stype,cmp);
    }
    /*
    **************************************************************************************
    ***************************************私有*******************************************
    **************************************************************************************
    **************【不要私自公开私有函数 防止外部错误调用 引起不可挽回的bug】******************
    */
    //改变链表的序列(三种:1.升序(降序) 2.顺序(先后插入) 3.乱序(链表打乱)) 
    //此函数不影响_dirtyMap 只有在插入和移除时候才会刷新 交由插入和移除方法决定
    private updateSequence(sortType:number,cmp?:ICMP){
        switch(sortType){
            //升序(降序)
            case SortType.Asc:
            case SortType.Desc:
                var b = this.updateToAscOrDesc(sortType,cmp);
                console.log("updateToAscOrDesc is "+b);
                break;
             //顺序
            case SortType.order:
                var b = this.updateToOder(SortType.order);
                console.log("updateToOder is "+b);
                break;
            //乱序
            case SortType.shuffle:
                var b = this.updateToShuffle(SortType.shuffle);
                console.log("updateToShuffle is "+b);
                break;
        }
    }
    //把链表变成升序(降序) 效率: O(nlogN) + O(N) 快排+链接(排好序后的pre和next重新指定链接)
    private updateToAscOrDesc(sortType:number,cmp?:ICMP){
        // if( this._sortType == SortType.Asc || this._sortType == SortType.Desc ){
        //     console.log("已经是升序(降序)链表 = "+this._sortType);
        //     return false;
        // }
        this._sortType = sortType;
        //因为用数组做排序 所以数组被刷新过
        this._dirtyArray = false;//_dirtyMap维持原样即可 因为map不关心排序
        //利用数组来进行对链表的重新调整
        console.log("this._Array.length from getArrayPure before ================ "+this._Array.length);
        this._Array = this.getArrayPure();
        console.log("this._Array.length from getArrayPure after ================ "+this._Array.length);
        this.SortQuick(this._Array,0,this._Array.length,cmp);
        this.resetConnect(this._Array);
        return true;
    }
    //把链表变成顺序(先后插入 和乱序不同 链表可以保持原样 因此array没脏 map只有在插入和删除中会被刷新)
    private updateToOder(sortType:number){
        if( this._sortType == SortType.order ){
            console.log("已经是顺序链表");
            return false;
        }
        console.log("把链表变成顺序 = "+sortType);
        //顺序不需要做什么处理 直接改变一下状态 之后就会从尾插入数据
        this._sortType = sortType;
        //获取数组(此时刷新了数组)
        this._Array = this.getArrayPure();
        return true;
    }
    //把链表变成乱序 效率: O(n) 打乱并且建立链接
    //(链表打乱 随机插入到链表中 这里借用数组来打乱 并且会直接刷新数组 往后getArray时候直接获取)
    private updateToShuffle(sortType:number){
        // if( this._sortType == SortType.shuffle ){
        //     console.log("已经是乱序链表");
        //     return false;
        // }
        //此处链表至少含有1个数据  外部已经对空链表处理
        this._sortType = sortType;
        //获取数组(此时刷新了数组)
        this._Array = this.getArrayPure();
        this._dirtyArray = false;
        //打乱操作
        var shuffle = [];//乱序数组
        var length = this._Array.length;
        for (var j = 0; j < length; j++) {
            var random_index = this.random(0,this._Array.length-1);//随机索引
            var node = this._Array[random_index];
            shuffle.push(node);//装入随机数组
            //建立链接(注:此时shuffle[shuffle.length-1]就是node)
            //这个分支至少1个数据
            if(j == 0){//头
                this._list = node;
                node.pre  = null;
                node.next = null;
            }
            //这个分支至少2个数据 
            else if( j == length - 1){//尾 此时:j=shuffle.length-1
                shuffle[j-1].next = node;
                node.pre = shuffle[j-1];
                node.next = null;
                this._tail = node;
            }
            //这个分支至少三个数据 此时:当前的上一个索引:shuffle.length-2 = j-1
            else{
                //当前跟上一个连
                shuffle[j-1].next = node;
                node.pre = shuffle[j-1];
                node.next = null;//每一个新数据都是从shuffle的尾push进来 所以每个数据最后要node.next = null;
            }
            this._Array.splice(random_index,1);//移除数据
            // console.log("this._Array.length = "+this._Array.length);
        }
        //覆盖原来的数组(因为之前数组已经被刷新 但是未打乱的状态)
        this._Array = shuffle;
        // this.resetConnect(this._Array);//重新建立上下节点关系

        return true;
    }
    //快速排序
    private SortQuick(list:any,start:number,end:number,cmp?:ICMP){
        // console.log(">>>>>>>>>>>>>>>>SortQuick<<<<<<<<<<<<<<<<<<<<<<");
        if(start < end){
            var pivotpos = this.partition(list, start, end,cmp);//找出快排的基数
            this.SortQuick(list, start, pivotpos - 1,cmp); //将左边的快排一次  
            this.SortQuick(list, pivotpos + 1, end,cmp);//将右边的快排一次  
        }
    }
    //将一个序列调整成以基数为分割的两个区域，一边全都不小于基数，一边全都不大于基数
    private partition(list, start, end, cmp?) {
        var pivotpos = start;  
        var pivot = list[start];//这里是一个node 
        var tmp;  
        for(var i = start + 1; i <= end; i ++) {
            //有规则就用规则 无传入规则就用默认value排序
            if(list[i]){
                // console.log("list["+i+"] = "+list[i]);
                // console.log("pivot = "+pivot);
                var result = list[i].value < pivot.value?true:false;;
                // console.log("list[i].name = "+list[i].name);
                
                if (cmp){
                    result = cmp(list[i].data,pivot.data);
                }
                // if (list[i]){
                //     // console.log("list["+i+"].value = "+list[i].value);
                //     // console.log("pivot.value = "+pivot.value);
                //     if(this._sortType == SortType.Asc)
                //         result = list[i].value < pivot.value?true:false;
                //     else//降序
                //         result = list[i].value > pivot.value?true:false;
                //     if (cmp){
                //         result = cmp(pivot.data,list[i].data);
                //     }
                // }
                if (result) {
                    tmp = list[i];  
                    pivotpos += 1;  
                    list[i] = list[pivotpos];  
                    list[pivotpos] = tmp;  
                }
            }  
        }  
        tmp = list[start];  
        list[start] = list[pivotpos];  
        list[pivotpos] = tmp;  
        return pivotpos;
    }
    //重新链接左右节点(头:_list 尾:_tail 重新赋值)
    private resetConnect(list){
        // console.log("<<<<<<<<<<<<<<<resetConnect>>>>>>>>>>>>>");
        for (var i = 0; i < list.length-1; i++) {
            var cur_node  = list[i];
            var next_node = list[i+1];
            // console.log("-------");
            // console.log("cur_node.name = "+cur_node.name);
            // console.log("next_node.name = "+next_node.name);
            cur_node.next = next_node;
            next_node.pre = cur_node;
            //第一个的上一个指向null
            if(i == 0){
                cur_node.pre = null;
            }
            //最后一个的下一个指向null
            if (i+1 == (list.length-1)){
                next_node.next = null;
            }
        }
        this._list = list[0];
        this._tail = list[list.length-1];
    }
    //获取一个升序数组(无需对数组进行升序操作)
    private getAscArrayEx(){
        this._sortType = SortType.Asc;
        var head:Node = this._list;

        this._Array = [];//清空数组
        this.ArrayPushDG(this._Array,head);

    }
    //获取一个降序数组(无需对数组进行降序操作)
    private getDescArrayEx(){
        this._sortType = SortType.Desc;
        //不要用新node 用引用数据
        var head:Node = this._tail;

        this._Array = [];//清空数组
        this.ArrayPushDG(this._Array,head);
        // console.log("######ArrayPushDG########");
        // for (var i = 0; i < this._Array.length; i++) {
        //     var node = this._Array[i];
        //     console.log("node.name = "+node.name);
        // }
    }
    //尾插入(可能插入了一个链表 所以要递归寻找长度并且找出新的尾巴) 是否需要刷新链表 默认刷新
    //被调用情况:1.无序变有序 2.有序变无序 3.顺序插入 4.任何排序类型插入非单个数据的操作也要借用 因为尾插入后重新排序比直接排来的快
    private push(newdata:Node,dirty:boolean = true){
        if( !newdata ){
            return false;
        }
        //跟原来的尾巴连接
        // console.log(">>>行808:"+" this._tail.name = "+this._tail.name);
        // console.log(">>>行809:"+" this._tail.pre = "+this._tail.pre);
        // console.log(">>>行810:"+" this._tail.next = "+this._tail.next);
        // console.log(">>>行811:"+" newdata.name = "+newdata.name);
        // console.log(">>>行812:"+" newdata.pre = "+newdata.pre);
        // console.log(">>>行813:"+" newdata.next = "+newdata.next);
        this._tail.next = newdata;
        newdata.pre = this._tail;
        if(dirty){
            this.setDirty(true);//链表被更新了
        }
        else{
            this._dirtyMap = true;//插入操作 map数据脏了
        }
        
        //重新对尾巴进行赋值(同时统计新长度)
        this.ListPushDG(newdata,true);
        // this._tail = newdata;//刷新新尾巴
        // this._length++;
        // console.log("重新对尾巴进行赋值 this._tail.name = "+this._tail.name);
        // if(this._tail.next){
        //     console.log("重新对尾巴进行赋值 this._tail.next.name = "+this._tail.next.name);
        // }
        // if(this._tail.pre){
        //     console.log("重新对尾巴进行赋值 this._tail.pre.name = "+this._tail.pre.name);
        // }
    }
    //乱序插入(插入的可能是个链表 该链表保持顺序 如果想让插入的链表也参与乱序 先把链表拆除一个个node插入)
    private shuffle(newdata:Node,stype?:number){
         //判断单个数据还是链表 (默认2个或以上就是链表)
        if(newdata.next){
            //链表直接尾插入后用排序 传入false 让updateSequence去刷新
            this.push(newdata,false);//长度在push内部运算
            this.updateSequence(stype);
        }
        //单个数据
        else{
            //【乱序的数组跟链表的排序一致】
            //获取数组(此时更新了数组)
            this._Array = this.getArrayPure();
            var length = this._Array.length;
            var random_index = this.random(0,length-1);//随机索引 测试: 0 Math.floor(length/2) length-1
            // this.outArr(this._Array);
            console.log("this._Array["+random_index+"].name = "+this._Array[random_index].name);
            console.log("乱序插入前数组: this._Array.length = "+this._Array.length);
            //以下操作后会把整体数据往后挪
            //随机索引为头(至少含有1个数据)
            if(random_index == 0){
                this._Array[random_index].pre = newdata;
                newdata.pre = null;
                newdata.next = this._Array[random_index];
                //把新数据直接插入到数组(细节:头不需要+1 默认插前面)
                this._Array.splice(random_index,0,newdata);
                this._list = newdata;
                //测试头插入
                // this.pushHead(this._tail,newdata);
                // this._tail = this._Array[length];
                //此处无需针对只有1个数据做尾部赋值操作  因为函数外部已经判定
                console.log("随机索引为头: this._list.name = "+this._list.name);
            }
            //随机索引为尾(至少含有2个数据)
            else if(random_index == length-1 ){//优先运算length-1 再判断的 无需括号
                this._Array[random_index].next = newdata;
                newdata.next = null;
                newdata.pre =  this._Array[random_index];
                this._tail = newdata;
                //(细节:+1是为了保证和链表保持一致的顺序 因为这个插入会默认插入到数据前面而不是后面)
                this._Array.splice(random_index+1,0,newdata);
                console.log("随机索引为尾: this._tail.name = "+this._tail.name);
            }
            //随机索引为中间值(至少有3个数据或以上)
            else{
                this._Array[random_index].next = newdata;
                newdata.pre  = this._Array[random_index];
                newdata.next = this._Array[random_index+1];
                this._Array[random_index+1].pre = newdata; 
                //把新数据直接插入到数组(细节:+1是为了保证和链表保持一致的顺序 因为这个插入会默认插入到数据前面而不是后面)
                this._Array.splice(random_index+1,0,newdata);

                console.log("随机索引为中间值: this._list = "+this._list.name+"  this._tail.name = "+this._tail.name);
            }
            console.log("乱序插入后数组: this._Array.length = "+this._Array.length);
            // this.out(this.getList());
            // this.out(this.getTail(),false);
            // console.log("链表被更新了链表被更新了链表被更新了链表被更新了链表被更新了");
            this._length++;
            this.setDirty(true);//链表被更新了
        }
        
    }
    //按规则插入(这里无关排序 由外部写规则时候默认是 【<】 号)
    //【因为内部默认按照升序处理(不然就要写升序和降序两套逻辑 维护成本增大)  如果写成 > 号  链表会出现混乱
    //这里不给外部随意设计规则是因为内部有序统一按照升序链表处理 只是获取数组时候用tail倒序获取】
    //关键说明:stype主要是给插入链表时候重新排序用 单个数据毫无用处
    private rule(list:Node,newdata:Node,cmp:ICMP,stype?:number){
        //判断单个数据还是链表 (默认2个或以上就是链表)
        if(newdata.next){
            //链表直接尾插入后用排序 传入false 让updateSequence去刷新
            this.push(newdata,false);//长度在push内部运算
            this.updateSequence(stype,cmp);
        }
        //单个数据
        else{
            // console.log("进入rule = "+list);
            //不存在数据就插入不成功
            var aObj = list.data;
            if( !aObj ){//不存在数据无从按照规则比较 所以插入不成功
                console.log("aObj is null");
                return;
            }
            //不存在数据就插入不成功
            var bObj = newdata.data;
            if( !bObj ){
                console.log("bObj is null");
                return;
            }
            //bObj是否小于aObj
            var result = cmp(bObj,aObj)?true:false;
            console.log("result = "+result);

            //aObj < bObj
            if (result){
                if( !list ){
                    newdata.pre = null;
                    newdata.next = null;
                    this._list = newdata;
                    this._length++;
                    this.setDirty(true);//链表被更新了
                    return;
                }
                else{
                    console.log("rule: bObj(new) < aObj  list.name =========================" + list.name);
                    //如果当前数据的上一个数据存在(链表有至少2个数据以上)
                    if(list.pre){
                        //新数据和当前数据的上一个数据连接 插入当前数据的上一个数据后面
                        list.pre.next = newdata;
                        newdata.pre = list.pre;
                    }
                    //不存在 则变成头
                    else{
                        newdata.pre = null;
                        this._list = newdata;
                    }
                    //新数据和当前数据连接 插入当前数据的前面
                    list.pre = newdata;
                    newdata.next = list;

                    this._length++;
                    this.setDirty(true);//链表被更新了
                    
                    return;
                }
            }
            //aObj >= bObj
            else{
                //找到直至下一个不满足条件
                if( list.next ){
                    this.rule(list.next,newdata,cmp,stype);
                }
                //新数据插入到当前数据后面
                else{
                    console.log("rule: bObj(new) >= aObj  list.name =========================" + list.name);
                    
                    list.next = newdata;
                    newdata.pre = list;
                    newdata.next = null;
                    this._tail = newdata;

                    this._length++;
                    this.setDirty(true);//链表被更新了
                    return;
                }
            }
        }
    }
    //升序(newdata可能是个链表)
    private Asc(list:Node,newdata:Node,stype:number){
        //外部已判断list和newdata是否存在 没必要重复判断
        // console.log("ASC list.name = "+list.name);
        // console.log("ASC newdata.name = "+newdata.name);
        // console.log("ASC stype = "+stype);
        //判断单个数据还是链表 (默认2个或以上就是链表)
        if(newdata.next){
            //链表直接尾插入后用排序 传入false 让updateSequence去刷新
            this.push(newdata,false);//长度在push内部运算 
            this.updateSequence(stype);
        }
        //单个数据
        else{
            // console.log("------------");
            // console.log("newdata.value = "+newdata.value);
            // console.log("list.value = "+list.value);
            //【注意:链表永远只可能是升序 不会是降序 获取降序数组只是从链表的尾巴向头取数据 因此逻辑只考虑升序链表的插入】
            //按照升序判定(a<b) a:新数据 b原数据
            //在升序链表中 插入条件:
            //1.找到直至下一个不满足条件 或者数据为空时候 然后插入到后面  也就是走new>old分支 此处数据必定至少有1个
            //2.找到第一个满足条件 然后插入到前面 也就是走new<old分支 这里不存在数据为空 因为外部如果发现空链表是直接插入
            // if(stype){
                // console.log(" Asc(***传入有值 Asc和Desc互相切换  或者  Oder和shuffle互相切换***)");
                var result = newdata.value <= list.value?true:false;
                //new < old
                if(result){
                    console.log("new < old list.name =========================" + list.name);
                    //空链表则直接赋值(一般不会进来 因为外部判断了)
                    if(!list){
                        newdata.pre = null;
                        newdata.next = null;
                        this._list = newdata;
                        this._length++;
                        this.setDirty(true);//链表被更新了
                        return;
                    }
                    //至少有一个数据
                    else{
                        //如果当前数据的上一个数据存在(链表有至少2个数据以上)
                        if(list.pre){
                            //新数据和当前数据的上一个数据连接 插入当前数据的上一个数据后面
                            list.pre.next = newdata;
                            newdata.pre = list.pre;
                        }
                        //不存在 则变成头
                        else{
                            newdata.pre = null;
                            this._list = newdata;
                        }
                        //新数据和当前数据连接 插入当前数据的前面
                        list.pre = newdata;
                        newdata.next = list;

                        this._length++;
                        this.setDirty(true);//链表被更新了
                        
                        return;
                    }
                    // 下面逻辑在升序链表是错误的！
                    // if( list.next ){
                    //     this.Asc(list.next,newdata,stype);
                    // }
                    //
                    // else{
                    //     //发现是头就改变头 
                    //     if(!list.pre){
                    //         this._list = newdata;
                    //     }
                    //     else{
                    //         //新数据和当前数据的上一个连 在它后面
                    //         list.pre.next = newdata;
                    //     }
                        
                    //     newdata.pre = list.pre;
                    //     //新数据和当前数据连 在它前面
                    //     newdata.next = list;
                    //     list.pre = newdata;

                    //     this._length++;
                    //     this.setDirty(true);//链表被更新了
                        
                    //     return;
                    // }
                }
                else{
                    //找到直至下一个不满足条件
                    if( list.next ){
                        this.Asc(list.next,newdata,stype);
                    }
                    //新数据插入到当前数据后面
                    else{
                        console.log("new > old list.name =========================" + list.name);
                        
                        list.next = newdata;
                        newdata.pre = list;
                        newdata.next = null;
                        this._tail = newdata;

                        this._length++;
                        this.setDirty(true);//链表被更新了
                        return;
                    }
                }
            // }
            // //同类型的插入:指同是Asc 或者 Desc的插入
            // else{
            //     console.log(" Asc(***同类型的插入:指同是Asc 或者 Desc的插入***)");
            //     var result = newdata.value <= list.value?true:false;
            //     //new <= old
            //     if(result){
            //     }
            //     else{

            //     }
            // }
            
        }//if(newdata.next)
            
    }

    
    //细节:传入的curNode虽然是对象 但无法直接内部改变赋值
    private deepCopy(curNode:Node,list:Node,preNode?:Node){
        // console.log("------测试-----");
        // var t:Node = {name:"t",pre:null,next:null,value:999};
        // curNode = JSON.parse(JSON.stringify(t));
        // console.log("curNode.name = "+curNode.name);
        // return curNode;
        // console.log("-----------");
        if (list){
            //把前后节点暂存起来
            var tmp_preNode = list.pre;
            var tmp_nextNode= list.next;
            //json深度拷贝需要数据节点是单独存在 而不是嵌套节点的链接的(与节点无关的可以 比如data数据) 不知道怎么解析
            //把一个个节点作为一个独立的存在进行json深度拷贝
            list.pre = null;
            list.next = null;
            curNode = JSON.parse(JSON.stringify(list));
            //和前一个node链接
            if( preNode ){
                curNode.pre = preNode;
                preNode.next = curNode;
            }
            // console.log("copy.name = "+curNode.name);
            // console.log("copy.value = "+curNode.value);
            //拷贝完成 还原赋值
            list.pre = tmp_preNode;
            list.next = tmp_nextNode;
            curNode.next = this.deepCopy(curNode.next,list.next,curNode);
        }
        return curNode;
    }
    //递归存储数据(list 把数据赋值给尾) len是否增加总长度 参数用于插入时候
    private ListPushDG(curNode:Node,len?:boolean){
        if(!curNode){
            return;
        }
        //是否统计新长度
        if (len){
            this._length++;
        }

        if(curNode.next){
            this.ListPushDG(curNode.next,len);
        }
        else{
            this._tail = curNode;
            console.log("新尾巴 this._tail.name= "+this._tail.name);
            if(this._tail.pre)
               console.log("旧尾巴 this._tail.pre.name= "+this._tail.pre.name); 
        }
    }
    //递归存储数据(Map)
    private MapPushDG(curNode:Node){
        if(!curNode){
            return;
        }
        var key = curNode.name;
        this._Map[key] = curNode;
        if(curNode.next){
            this.MapPushDG(curNode.next);
        }
        else{
            return;
        }

    }
    //递归存储数据(array)
    private ArrayPushDG(_arr:Node[],curNode:Node){
        if( curNode ){
            console.log("ArrayPushDG ---- curNode.name = "+curNode.name);
            if (!curNode.pre && !curNode.next){
                //节点的左右都是null证明链表只有一个数据
                console.log("节点的左右都是null证明链表只有一个数据!!!!!!!!!!!!!!!!!!!!!!!!!");
                _arr.push(curNode);
                return;
            }
            else{
                _arr.push(curNode);
            }
        }else{
            return;
        }
       
    //    console.log("curNode.name = "+curNode.name);
    //    console.log("curNode.value = "+curNode.value);
    //    console.log("curNode.next = "+curNode.next);
    //    if(curNode.next)
    //         console.log("curNode.next.name = "+curNode.next.name);
    //    console.log("curNode.pre = "+curNode.pre);
    //    if(curNode.pre)
    //         console.log("curNode.pre.name = "+curNode.pre.name);
       
       //根据当前排序类型递归
       if(this._sortType == SortType.Asc){
           console.log("ArrayPushDG-->SortType.Asc");
           this.ArrayPushDG(_arr,curNode.next);
       }
       else if(this._sortType == SortType.Desc){
           console.log("ArrayPushDG-->SortType.Desc = "+curNode.pre);
           this.ArrayPushDG(_arr,curNode.pre);
       }
       else{
           console.log("ArrayPushDG-->SortType.order or shuffle");
           this.ArrayPushDG(_arr,curNode.next);
       }
       
    }
    //设置数据是否被污染
    private setDirty(dirty:boolean){
        this._dirtyArray = dirty;
        this._dirtyMap = dirty;
    }
    //给链表尾赋值(构造函数里边用到)
    private setTail(){
        if(!this._list){
            this._tail = null;
            return;
        }
        
        this.ListPushDG(this._list,true);
    }
    //头插入 也就是this._tail.pre.pre.. 最后的那个
    private pushHead(curNode:Node,newdata:Node){
        if( !newdata ){
            return false;
        }
        if(!curNode.pre){//这里是this._tail的反向尽头  也就是this._list的头
            curNode.pre = newdata;
            newdata.pre = null;
        }
        else{
            this.pushHead(curNode.pre,newdata);
        }
    }
    //纯属从链表中获取一个数组(内部专用 无关任何类型)
    private getArrayPure(){
        var list = this._list;
        console.log("getArrayPure() this._sortType == "+this._sortType);
        if(this._sortType == SortType.Desc){
            list = this._tail;
        }
        if (!list){
            this._Array = [];
            this._dirtyArray = false;
            console.log("getArrayPure() !list");
            return this._Array;
        }

        var head:Node = list;
        //注意:【!!!!!!!
        //   此处写法不可以用下面 因为Node是一个新节点 
        //   就跟list里面的node不是引用关系 并不是指向同一块 
        //    一旦改变这个Node 就不是指向同一块了 就不同步
        //    stl原则是不改变外边传入的node 一直以引用关系操作链表
        //
        //var head:Node = {};
        // console.log("for (var key in list):{ ");
        // for (var key in list) {
        //     if (list.hasOwnProperty(key)) {
        //         head[key] = list[key];
        //         // console.log("---------");
        //         // console.log("key = "+key);
        //         // console.log("head["+key+"] = "+head[key]);
        //     }
        // }
        // console.log("}");
        // !!!!!!!】
        // console.log("this._list.name1 ===== "+this._list.name);
        // console.log("this._tail.name1 ===== "+this._tail.name);
        // console.log("正向链表----->");
        // this.out(this._list);
        // console.log("逆向链表----->");
        // this.out(this._tail,false);
        // console.log("**********************************************");
        // console.log("**********************************************");
        // console.log("**********************************************");
        
        this._Array = [];//清空数组
        this.ArrayPushDG(this._Array,head);//head是正向链表
        // this._Array.push(this._list);//测试

        // console.log("this._list.name2 ===== "+this._list.name);
        // console.log("this._tail.name2 ===== "+this._tail.name);
        // console.log("正向链表----->");
        // this.out(this._list);
        // console.log("逆向链表----->");
        // this.out(this._tail,false);

        return this._Array;
    }
    /*
    **************************************************************************************
    ***************************************已废弃******************************************
    **************************************************************************************
    【废弃原因:有序链表只有升序 取数据按照头尾节点足以 否则两套方案使维护成本加大 效率也并没有提高 
    对于升序链表与降序链表相互切换有效率开销 对于双向链表完全可以做到取得升序降序数组 因此维护一条升序链表足以
    多写一个降序链表规则只是能让外部更方便使用 说白了就是在传入规则cmp的时候 cmp无需指定old<new这种模式
    对于从运行效率角度来说 性能并没有得到很好的提升 反而下降 同时使得维护成本增加 所以废弃】
    */
    //获取一个升序数组(已废弃)
    private getAscArray(){
        console.log("开始把数组进行:升序操作");
        this._list = this.getAscList();
        var head:Node = this._list;
        this._Array = [];//清空数组
        this.ArrayPushDG(this._Array,head);
        return this._Array;
    }
    //获取一个降序数组(已废弃)
    private getDescArray(){
        console.log("开始把数组进行:降序操作");
        this._list = this.getDescList();
        var head:Node = this._tail;
        this._Array = [];//清空数组
        this.ArrayPushDG(this._Array,head);
        return this._Array;
    }
    //获取一个升序链表(已废弃)
    private getAscList(){
        if ( this._sortType == SortType.Asc ){
            console.log("已经是升序链表");
            return this._list;
        }
        else{
            this._sortType = SortType.Asc;
            this._list = this.reverse(this._list);
            console.log("从降序->升序");
            return this._list;
        }
    }
    //获取一个降序链表(已废弃)
    private getDescList(){
        if (  this._sortType == SortType.Desc ){
            console.log("已经是降序链表");
            return this._list;
        }
        else{
            this._sortType = SortType.Desc;
            this._list = this.reverse(this._list);
            console.log("从升序->降序");
            return this._list;
        }
    }
    //链表逆置( a->b->c->d 变成 d->c->b->a ) (已废弃)
    private reverse(data:Node):Node{
        // console.log("data.name = "+data.name);
        if(data.next == null){
            data.pre = null;
            return data;//返回头
        }
        //把链表原来的头变成尾
        var ishead = false;
        if (data.pre == null){
            ishead = true; 
        }
        var p:Node = data;
        p = this.reverse(data.next);
        data.pre  = data.next;//左右指向互换
        data.next.next = data;
        
        if(ishead){
            data.next = null;
            this._tail = data;//给尾巴赋值
        }
        // data.next = null;//双向链表不能清空
        // console.log("out(p)");
        // out(p);
        // console.log("out(a)");
        // out(a);
        return p;
    }
    //降序(双向链表后统一按升序排就够了 数组排序可以双向取)(已废弃)
    private Desc(list:Node,newdata:Node){
        //插入头
        if(newdata.value >= list.value){
            //把old的上一个和new进行连接
            if (list.pre){
                list.pre.next = newdata;
                newdata.pre = list.pre;
            }
            //把old和new进行连接
            newdata.next = list;
            list.pre = newdata;
            this._length++;
            return newdata;
        }
        //检查是否有下一个
        if( list.next ){
            this.Desc(list.next,newdata);
        }
        else{
            list.next = newdata;
            newdata.pre = list;
            this._length++;
        }
        return list;
    }
    /*
    **************************************************************************************
    ***************************************其它*******************************************
    **************************************************************************************
    */
    //输出链表(dir: true正向输出链表 false逆向输出链表)
    out(d:Node,dir:boolean = true){
        console.log("########################输出list######################## = "+dir);
        this.mapDG(d,dir);
    }
    mapDG(d:Node,dir:boolean = true){
        if(d){
            var pre_name = d.pre?d.pre.name:"null";
            var next_name = d.next?d.next.name:"null";
            console.log("d.name="+d.name+"  d.value="+d.value +" d.data="+d.data+" d.pre="+d.pre+" pre_name="+pre_name+ " d.next="+d.next+" next_name="+next_name);
            // if(d.pre){
            //     console.log("d.pre.name = "+d.pre.name);
            // }
            // if(d.next){
            //     console.log("d.next.name = "+d.next.name);
            // }
        }else{
            console.log("输出链表是空");
            return d
        }
        if(dir){
            if(d.next == null){
                return d
            }
            this.mapDG(d.next,dir);
        }
        else{
             if(d.pre == null){
                return d
            }
            this.mapDG(d.pre,dir);
        }
        
        
    }
    //输出数组
    outArr(_arr?:Node[]){
        console.log("########################输出数组########################");
        var arr = this._Array;
        if (_arr){
            arr = _arr;
        }
        if(arr){
            console.log("arr.length = "+arr.length);
            for (var i = 0; i < arr.length; i++) {
                console.log("-----------");
                var n = arr[i];
                console.log("n.name = "+n.name);
                console.log("n.value = "+n.value);
                console.log("n.pre = "+n.pre);
                if(n.pre)
                    console.log("n.pre.name = "+n.pre.name);
                console.log("n.next = "+n.next);
                if(n.next)
                    console.log("n.next.name = "+n.next.name);
                console.log("n.data = "+n.data);
            }
        }  
        else
            console.log("arr. is null");
        
    }

    //输出map
    outMap(_map?:any){
        console.log("########################输出map########################");
        var map = this._Map;
        if(_map){
            map = _map;
        }
         
        if(!this.isObj(map)){
            console.log("map为空");
            return;
        }
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                var data = map[key];
                console.log("----------");
                console.log("node.key = "+key);
                console.log("node = "+data);
                console.log("node.name = "+data.name);
                console.log("node.value = "+data.value);
                console.log("node.pre = "+data.pre);
                if(data.pre)
                    console.log("node.pre.name = "+data.pre.name);
                console.log("node.next = "+data.next);
                if(data.next)
                    console.log("node.next.name = "+data.next.name);
            }
        }
    }
    //判断对象是否为空
    isObj(obj:any){
        var hasObj = false;  
        for (var o in obj){  
            hasObj = true;
            return hasObj; 
        }
        console.log("obj is empty");
        return hasObj;
    }
    //随机数
    random(min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

}

/**
 * ================================测试区================================
 * 测试区代码是建立在和STL不同的文件中运行 建测试区代码另起一个文件 跟STL.ts放在同一个目录方便点
 * 建议用mocha或者其他测试工具跑
 * 
 */
//函数测试范例:
// import stlTs = require("./STL");
// import stl   = stlTs.STL;//静态类
// import Node  = stlTs.Node;//节点类
// import ICMP  = stlTs.ICMP;//规则类
// import TestData1 = stlTs.TestData1;//规则类的规则数据类 规则1
// import TestData2 = stlTs.TestData2;//规则类的规则数据类 规则2
// //规则1测试数据
// var t1:TestData1 = {
//     "11":{
//             obj:{
//                 111:1111,
//                 112:1112,
//                 113:1113
//             },
//             msgStr:"这里是11"
//         },
//     "22":{
//             obj:{
//                 221:2221,
//                 222:3,
//                 223:2223
//             },
//             msgStr:"这里是22"
//         },
//     "33":{
//             obj:{
//                 331:3331,
//                 332:3332,
//                 333:3333
//             },
//             msgStr:"这里是33"
//         }
// };
// var t2:TestData1 = {
//     "11":{
//             obj:{
//                 111:1111,
//                 112:1112,
//                 113:1113
//             },
//             msgStr:"这里是11"
//         },
//     "22":{
//             obj:{
//                 221:2221,
//                 222:1,
//                 223:2223
//             },
//             msgStr:"这里是22"
//         },
//     "33":{
//             obj:{
//                 331:3331,
//                 332:3332,
//                 333:3333
//             },
//             msgStr:"这里是33"
//         }
// };
// var t3:TestData1 = {
//     "11":{
//             obj:{
//                 111:1111,
//                 112:1112,
//                 113:1113
//             },
//             msgStr:"这里是11"
//         },
//     "22":{
//             obj:{
//                 221:2221,
//                 222:2,
//                 223:2223
//             },
//             msgStr:"这里是22"
//         },
//     "33":{
//             obj:{
//                 331:3331,
//                 332:3332,
//                 333:3333
//             },
//             msgStr:"这里是33"
//         }
// };
// //规则2测试数据
// var t4 = {key:"t4",value:-3};
// var t5 = {key:"t5",value:-1};
// var t6 = {key:"t6",value:-2};

// console.log("------------------------------------------------> ");
// console.log("创建节点: createNode ----------------------------->");
// console.log("------------------------------------------------> ");
// var node1:Node = stl.createNode(t4);//后面两个值可传可不传 
// var node1:Node = stl.createNode(t4,t4.key);//如果要用map第二个值必须传 用作key
// var node1:Node = stl.createNode(t4,t4.key,t4.value);//第三个值用作排序的关键依据

// console.log("------------------------------------------------> ");
// console.log("创建链表: new stl ----------------------------->");
// console.log("------------------------------------------------> ");
// var list:stl = new stl();//不传默认是空链表 默认用node的value排序 默认顺序排序(也就是尾插入)
// var list:stl = new stl(node1);//第一个参数:传入就以节点node1为头的一个链表  
// var list:stl = new stl(node1,stlTs.SortType.Asc);//第二个参数:指定排序类型
// var list:stl = new stl(node1,null,testdata1);//第三个参数:指定排序规则 
//【注意:指定规则后 默认类型改为升序 但是传入的node1如果是链表 初始化不会自动排序 
//重新排序只有在无序(顺序 乱序)->有序(升序 降序)相互切换的时候发生】
// var list:stl = new stl(null,null,testdata1);//也可以指定一个规则的空链表 日后自行插入数据

// console.log("------------------------------------------------> ");
// console.log("插入数据: insert ----------------------------->");
// console.log("------------------------------------------------> ");
// var node2:Node = stl.createNode(t5);
// var node3:Node = stl.createNode(t6);
// list.insert(node2);//第一个参数:插入一个node  插入规则会按照排序类型来(默认顺序 规则排序的默认是升序)
// list.insert(node2,stlTs.SortType.Desc);//第二个参数:插入node 同时指定插入规则类型 
// 插入方式:【顺序 升序 降序 乱序】
// list.insert(node2,stlTs.SortType.oder);//这种插入式从尾巴一个个插入 速度极快 
// list.insert(node2,stlTs.SortType.Asc);//这种插入式是把链表做了一次快排更新(如果之前已经是有序(升序 降序)  第二次插入就会直接找对应位置插入 而无需快排) 
// list.insert(node2,stlTs.SortType.Desc);//这种插入式和升序方式方法一样 所以统称为有序 唯一不同是在取数组的时候会按照当前的排序规则给予调用者同类型数组
// list.insert(node2,stlTs.SortType.shuffle);//这种插入式是乱序插入 会把node随机插入到链表中都某一个位置 而且第一次改变会做打乱
// 补充解释: 四个类型可分为 有序(升序 降序)  无序(顺序 乱序) 
// 如果插入的时候:
// 任何类型变有序的切换都需要做一次彻底的排序(仅第一次) 第二次开始类型只要还是有序 新数据就会找到相应的位置插入 而无需再重新排序
// 任何类型变乱序都需要做打乱操作(仅第一次) 第二次开始类型只要还是乱序 新数据会随机一个位置插入 而无需重新打乱
// 任何类型变顺序是最快的 因为直接返回链表即可 顺序不关心排序 只关心从尾插入就好
// 从顺序变成任何类型 第一次改变都需要做相应排序或者打乱操作
// 如果插入数据2个或以上 同样会做打乱或排序操作 默认2个起就是插入链表 因为不能确保传进来的链表是否有序
// 使用建议:在new stl起初就清楚知道自己所需数据 从而开始就指定好类型 这样效率是最好的 因为类型间的切换需要效率代价(第一次)

// console.log("------------------------------------------------> ");
// console.log("移除数据: remove ----------------------------->");
// console.log("------------------------------------------------> ");
// list.remove(node);//从链表中移除一个节点 注:移除依赖map 会自动获取map并且返回移除后的map 插入操作不会更新map 只会标识为脏 直至getMap时候才刷新map
// 补充解释: 脏分两种 array脏 map脏
// 脏的意思就是数据被操作过 通知下一次获取的时候要重新从链表获取数据
// map脏: 只有在插入和移除的时候会重新获取map 并且移除时候是自动刷新 插入的时候只是标识 下次getMap时候重新获取新map map不关心顺序
// array脏: 插入和移除会刷新脏 任何类型间的切换都会标识脏 除了变成乱序类型 会自动刷新数组 因为乱序依赖数组乱序 所以数组被刷新
// array脏数据脏后getArray的时候才会重新刷新一遍 如果本身就乱序的获取getArray就不会再对数组进行操作 后续详解

// console.log("------------------------------------------------> ");
// console.log("查找数据: find ----------------------------->");
// console.log("------------------------------------------------> ");
// list.find(node);//从map中找到所需数据 如果map此时脏了 也会借助getMap重新刷新map再查找


// console.log("------------------------------------------------> ");
// console.log("获取Map数据: getMap ----------------------------->");
// console.log("------------------------------------------------> ");
// list.getMap();//获取map会根据数据是否有脏来刷新map

// console.log("------------------------------------------------> ");
// console.log("获取Array数据: getArray ----------------------------->");
// console.log("------------------------------------------------> ");
// list.getArray();//根据类型获取对应的类型数组 还会根据数组是否脏了来决定是否刷新数组 同类型而且数据没脏都是直接返回数组 这种情况重复频繁获取没有效率开销
// list.getArray(stlTs.SortType.oder)//获取一个顺序数组 获取速度最快 任何类型变顺序获取数组 即便是脏了 也只是单纯从链表里边再取一次数据 效率仅次于重复获取数组
// list.getArray(stlTs.SortType.shuffle)//获取一个乱序数组 如果数据没脏 直接返回 不再打乱 脏了的话 第一次需要做打乱操作 注:乱序的插入并不会使数组脏 因为乱序所有操作都依赖数组 比较特殊
// list.getArray(stlTs.SortType.Asc)//获取一个升序数组 顺序和乱序切换到获取升序数组 都需要做一次重新排序 同样 数据没脏 重复获取是直接返回
// list.getArray(stlTs.SortType.Desc)//和Asc一样 但是如果是从升序和降序的互相切换间 是没有效率开销 链表没有改变 只是获取数组的时候相对方向获取就好了 效率跟获取顺序数组一样
// 补充解释: 获取速度从快到慢: 同类型没脏重复获取 > 顺序获取 = 有序间(升序 降序)切换获取 > 乱序获取 > 顺序或乱序切换到有序
// 因此频繁在乱序和有序中切换获取数组是最糟糕的效率 如果有需求可以建立两个链表分别对应做处理 数据都是引用同一块data 两条链表分别相应排序做处理更好

// console.log("------------------------------------------------> ");
// console.log("拷贝节点: copyNode ----------------------------->");
// console.log("------------------------------------------------> ");
// var copyNode = list.copy(node)//深度拷贝一个一模一样的节点返回
// 注意: 节点里的data数据都拷贝了一份  没有引用可言 上下关系默认都是null

// console.log("------------------------------------------------> ");
// console.log("拷贝链表: copy ----------------------------->");
// console.log("------------------------------------------------> ");
// var copylist  = list.copy()//深度拷贝一个一模一样的list链表
// var copylist2 = list.copy(list2)//指定深度拷贝一个一模一样的list2链表
// 注意: 链表里的节点数据node都拷贝了一份(包括节点的node 和上下关系)  没有引用可言

// console.log("------------------------------------------------> ");
// console.log("更新链表: update ----------------------------->");
// console.log("------------------------------------------------> ");
// list.update()//更新链表 参数可传入类型 但是意义不大 若需在乱序链表情况下获取有序的东西(泛指数组) getArray指定类型就好
// 更新链表 本来不想公开更新借口 但考虑乱序需要重复打乱的情况 
// 一般用于打乱  其他情况都无序主动调用刷新 类内部自行处理

/**
 * ****************************以下是测试范例****************************
 * ***********************以如下格式为一个测试区*************************
 * console.log("------------------------------------------------> "); 
 * console.log("XXXXX: ----------------------------->"); 
 * console.log("------------------------------------------------> ");
 * 
 * 注意:最下面有个 "**非空链表测试排序转换**" 是独立开放的长测试
 * 
 * 辅助函数:
 * out用于输出链表  
 * 正向输出 : out(XXXX.getList())
 * 反向输出 : out(XXXX.getTail(),false);
 * 
 * outArr用于输出数组
 * outArr(XXXX.getArray(XXX?));
 * 
 * outMap用于输出map
 * outMap(XXXX.getMap());
 * 
 */ 

//默认是顺序排序 但是传入规则 会自动切换到升序 即第二个参数传不传都无所谓 
//******* 并且传入规则需要符合模式:【 old<new或old<=new old:原链表(节点)  new:新数据(节点) 】 *******
//规则参考:案例1.testdata1(复合型数据结构 数据结构较为复杂 规则麻烦  不过也是自己自行定义设计) 或者 案例2.testdata2(较为简单的数据结构 规则也简单) 
//【注:规则是自己设定的 没有强制需要按参考写 参考只是给出一些范例 有复杂的写法 也有简单的写法 自行灵活变通规则 前提是符合a<b模式】
// var datalist = new stl(o,null,testdata2);//t5(p) > t6(q) > t4(o)
// console.log("datalist = "+datalist);
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// datalist.outArr(datalist.getArray());
// datalist.outMap(datalist.getMap());
// console.log("datalist.getlength() = "+datalist.getlength());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+p.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// datalist.insert(p);
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// datalist.outArr(datalist.getArray(stlTs.SortType.shuffle));
// datalist.outMap(datalist.getMap());
// console.log("datalist.getlength() = "+datalist.getlength());

// console.log("------------------------------------------------> ");
// console.log("获取数据12: ----------------------------->");
// console.log("------------------------------------------------> ");
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// datalist.outArr(datalist.getArray());
// datalist.outMap(datalist.getMap());
// console.log("datalist.getlength() = "+datalist.getlength());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+q.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// datalist.insert(q);
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// datalist.outArr(datalist.getArray(stlTs.SortType.Desc));
// datalist.outMap(datalist.getMap());
// console.log("datalist.getlength() = "+datalist.getlength());


// console.log("------------------------------------------------> ");
// console.log("拷贝链表数据: ----------------------------->");
// console.log("------------------------------------------------> ");
// var cplist = datalist.copy();
// console.log("改变前:------> ");
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// console.log("datalist.getList().data.key = "+datalist.getList().data.key);
// console.log("datalist.getList().data.value = "+datalist.getList().data.value);
// console.log("datalist.getList().next.data.key = "+datalist.getList().next.data.key);
// console.log("datalist.getList().next.data.value = "+datalist.getList().next.data.value);
// console.log("改变后:------> ");
// datalist.getList().name = "nnnnnnnn";
// datalist.getList().value = 66666;
// // datalist.getList().pre = null;
// // datalist.getList().next = null;
// datalist.getList().data.key = "tttt";
// datalist.getList().data.value = 7777;
// datalist.getList().next.data.key = "pppppp";
// datalist.getList().next.data.value = 8888;
// console.log("原链表:------> ");
// datalist.out(datalist.getList());
// datalist.out(datalist.getTail(),false);
// console.log("datalist.getList().data.key = "+datalist.getList().data.key);
// console.log("datalist.getList().data.value = "+datalist.getList().data.value);
// console.log("datalist.getList().next.data.key = "+datalist.getList().next.data.key);
// console.log("datalist.getList().next.data.value = "+datalist.getList().next.data.value);
// console.log("拷贝链表:------> ");
// cplist.out(cplist.getList());
// cplist.out(cplist.getTail(),false);
// console.log("cplist.getList().data.key = "+cplist.getList().data.key);
// console.log("cplist.getList().data.value = "+cplist.getList().data.value);
// console.log("cplist.getList().next.data.key = "+cplist.getList().next.data.key);
// console.log("cplist.getList().next.data.value = "+cplist.getList().next.data.value);




// //参考规则1 (较为复杂的数据结构 主要是获取数据麻烦 原理还是a<b)
// function testdata1(aObj:any,bObj:any):boolean{
//     // console.log("***************testdata1***************");
//     // console.log("aObj = "+aObj);
//     // console.log("bObj = "+bObj);
//     var a_num = 0;
//     var b_num = 0;
//     FORA:
//     for (var key in aObj) {
//         if (aObj.hasOwnProperty(key)) {
//             // console.log("FORA-> key === "+key);
//             if (key == "22"){
//                 var _a = aObj[key];
//                 for (var k in _a.obj) {
//                     if (_a.obj.hasOwnProperty(k)) {
//                         // console.log("FORA-> k = "+k);
//                         if (parseInt(k) == 222){
//                             a_num = _a.obj[k];//获取到原链表所需比较的数据a
//                             break FORA;
//                         }
//                     }
//                 }
//             }
//         }
//     }
//     FORB:
//     for (var key in bObj) {
//         if (bObj.hasOwnProperty(key)) {
//             // console.log("FORB-> key === "+key);
//             if (key == "22"){
//                 var _b = bObj[key];
//                 for (var k in _b.obj) {
//                     if (_b.obj.hasOwnProperty(k)) {
//                         // console.log("FORB-> k = "+k);
//                         if (parseInt(k) == 222){
//                             b_num = _b.obj[k];//获取到新数据(描述成新链表也行)所需比较的数据b
//                             break FORB;
//                         }
//                     }
//                 }
//             }
//         }
//     }

//     // console.log("a_num = "+a_num);
//     // console.log("b_num = "+b_num);

//     return a_num < b_num?true:false;
// }
// //参考规则2 (较为简单的数据结构 主要是获取数据简单 原理还是a<b)
// function testdata2(aObj:any,bObj:any):boolean{
//     var a_num = 0;
//     var b_num = 0;

//     if( aObj && bObj){
//         a_num = aObj.key;
//         b_num = bObj.key;
//     }


//     return a_num < b_num?true:false;
// }

// console.log("************************************空链表测试排序转换************************************");
// var nulllist = new stl();
// console.log("nulllist = "+nulllist);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getList(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+f.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// console.log("nulllist.getSortType() == "+nulllist.getSortType());
// nulllist.insert(f);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+b.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// console.log("nulllist.getSortType() == "+nulllist.getSortType());
// nulllist.insert(b);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+c.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(c);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+a.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(a);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outMap(nulllist.getMap());
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Asc));

// console.log("------------------------------------------------> ");
// console.log("获取刚才的数据1: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+d.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(d);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Desc));
// nulllist.outMap(nulllist.getMap());
// console.log("------------------------------------------------> ");
// console.log("获取刚才的数据2: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+h.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(h);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.order));
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("获取刚才的数据3: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());


// console.log("------------------------------------------------> ");
// console.log("增加数据:"+g.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(g);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.shuffle));

// console.log("------------------------------------------------> ");
// console.log("获取刚才的数据4: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());


// console.log("------------------------------------------------> ");
// console.log("增加数据:"+e.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(e);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("获取数据Desc: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Desc));
// // allout();

// console.log("------------------------------------------------> ");
// console.log("获取刚才的数据5: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+i.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(i);
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("获取Asc数据6: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Asc));

// console.log("------------------------------------------------> ");
// console.log("获取数据7: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+l.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(l);
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray(stlTs.SortType.shuffle));

// console.log("------------------------------------------------> ");
// console.log("获取数据8: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+j.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(j);
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray(stlTs.SortType.order));

// console.log("------------------------------------------------> ");
// console.log("获取数据9: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());


// console.log("------------------------------------------------> ");
// console.log("移除数据:"+e.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.remove(e);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());

// console.log("------------------------------------------------> ");
// console.log("移除数据:"+i.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.remove(i);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Desc));

// console.log("------------------------------------------------> ");
// console.log("获取数据10: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.shuffle));
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+e.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(e);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());


// console.log("------------------------------------------------> ");
// console.log("增加数据:"+k.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(k);
// nulllist.out(nulllist.getList());
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Asc));

// console.log("------------------------------------------------> ");
// console.log("获取数据11: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("更新数据测试: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.update();
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("增加数据:"+o.name+" ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.insert(o);
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray(stlTs.SortType.Asc));

// console.log("------------------------------------------------> ");
// console.log("获取数据12: ----------------------------->");
// console.log("------------------------------------------------> ");
// nulllist.out(nulllist.getList());
// nulllist.out(nulllist.getTail(),false);
// nulllist.outArr(nulllist.getArray());
// nulllist.outMap(nulllist.getMap());

// console.log("------------------------------------------------> ");
// console.log("测试完成: ----------------------------->");
// console.log("------------------------------------------------> ");
// console.log("nulllist.getlength() = "+nulllist.getlength());


