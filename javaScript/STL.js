"use strict";
(function (SortType) {
    SortType[SortType["nothing"] = -1] = "nothing";
    SortType[SortType["order"] = 1] = "order";
    SortType[SortType["Asc"] = 2] = "Asc";
    SortType[SortType["Desc"] = 3] = "Desc";
    SortType[SortType["shuffle"] = 4] = "shuffle";
})(exports.SortType || (exports.SortType = {}));
var SortType = exports.SortType;
var STL = (function () {
    function STL(l, t, cmp) {
        if (t) {
            this._sortType = t;
        }
        else {
            this._sortType = SortType.order;
        }
        if (l) {
            this._list = l;
        }
        else {
            this._list = null;
        }
        this._cmp = cmp;
        if (this._cmp) {
            this._sortType = SortType.Asc;
        }
        this._length = 0;
        this._Map = {};
        this._Array = [];
        this._dirtyArray = false;
        this._dirtyMap = false;
        this.setTail();
    }
    STL.createNode = function (data, key, value) {
        var node = { name: "", pre: null, next: null, value: 0, data: data };
        if (key) {
            node.name = key;
        }
        if (value) {
            node.value = value;
        }
        return node;
    };
    STL.prototype.getDirtyArray = function () {
        return this._dirtyArray;
    };
    STL.prototype.getDirtyMap = function () {
        return this._dirtyMap;
    };
    STL.prototype.getlength = function () {
        return this._length;
    };
    STL.prototype.getSortType = function () {
        return this._sortType;
    };
    STL.prototype.getList = function () {
        return this._list;
    };
    STL.prototype.getTail = function () {
        return this._tail;
    };
    STL.prototype.remove = function (removeNode) {
        if (!removeNode) {
            return false;
        }
        if (this._dirtyMap) {
            this._Map = this.getMap();
            console.log("map数据脏了 获取Map...");
        }
        if (!this.isObj(this._Map)) {
            console.log("链表本来就是空 map当然是空 移除个毛线!");
            return false;
        }
        console.log("removeNode.name = " + removeNode.name);
        console.log("removeNode.pre = " + removeNode.pre);
        console.log("removeNode.next = " + removeNode.next);
        if (removeNode.next)
            console.log("removeNode.next.name = " + removeNode.next.name);
        var key = removeNode.name;
        if (!this._Map[key]) {
            console.log(key + "不存在于map中");
            return false;
        }
        if (this._list == removeNode) {
            this._list = removeNode.next;
            if (this._list) {
                this._list.pre = null;
            }
            else {
                this._list = this._tail = null;
                this._Map = {};
            }
        }
        else if (this._tail == removeNode) {
            this._tail = removeNode.pre;
            if (this._tail) {
                this._tail.next = null;
            }
            else {
                this._list = this._tail = null;
                this._Map = {};
            }
        }
        else {
            if (removeNode.pre)
                removeNode.pre.next = removeNode.next;
            if (removeNode.next)
                removeNode.next.pre = removeNode.pre;
            delete this._Map[key];
        }
        this._dirtyArray = true;
        removeNode.pre = null;
        removeNode.next = null;
        this._length--;
        return true;
    };
    STL.prototype.find = function (curNode) {
        if (!curNode) {
            console.log("findNode is null");
            return null;
        }
        if (!this.isObj(this._Map) || this._dirtyMap) {
            this._Map = this.getMap();
        }
        var key = curNode.name;
        if (!this._Map[key]) {
            console.log("key = " + key);
            return null;
        }
        console.log("this._Map[" + key + "] = " + this._Map[key]);
        return this._Map[key];
    };
    STL.prototype.getMap = function () {
        if (!this._list) {
            this._Map = {};
            this._dirtyMap = false;
            console.log("map的数据从链表里获取 链表都没有数据了 map当然没有数据");
            return this._Map;
        }
        if (!this._dirtyMap && this.isObj(this._Map)) {
            console.log("没脏 有数据 直接返回");
            return this._Map;
        }
        console.log("this._dirtyMap = " + this._dirtyMap);
        console.log("this.isObj(this._Map) = " + this.isObj(this._Map));
        this._dirtyMap = false;
        this._Map = {};
        this.MapPushDG(this._list);
        return this._Map;
    };
    STL.prototype.getArray = function (stype) {
        console.log("------------ getArray ------------");
        console.log("this._sortType = " + this._sortType);
        console.log("stype = " + stype);
        console.log("this._dirtyArray = " + this._dirtyArray);
        if (!this._list) {
            this._Array = [];
            this._dirtyArray = false;
            return this._Array;
        }
        var cmp = this._cmp;
        if (((this._sortType == SortType.Asc || this._sortType == SortType.Desc) && (stype == SortType.order || stype == SortType.shuffle)) ||
            ((this._sortType == SortType.order || this._sortType == SortType.shuffle) && (stype == SortType.Asc || stype == SortType.Desc))) {
            console.log("注意此处:stype有序 _sortType一定无序  反之同理");
            this.updateSequence(stype, cmp);
            if (this._sortType == SortType.Desc) {
                console.log("因为排序是快排 默认从小到大 如果是降序 需要这里再向链表反向取一次值");
                this.getDescArrayEx();
            }
            this._dirtyArray = false;
        }
        else if (((this._sortType == SortType.Asc && stype == SortType.Desc) || (this._sortType == SortType.Desc && stype == SortType.Asc)) ||
            ((this._sortType == SortType.order && stype == SortType.shuffle) || (this._sortType == SortType.shuffle && stype == SortType.order))) {
            console.log("直接从表头获取");
            this._sortType = stype;
            if (this._sortType == SortType.Desc) {
                this.getDescArrayEx();
            }
            else if (this._sortType == SortType.Asc) {
                this.getAscArrayEx();
            }
            else if (this._sortType == SortType.shuffle) {
                this.updateSequence(stype, cmp);
            }
            else {
                this._Array = this.getArrayPure();
            }
            this._dirtyArray = false;
        }
        else {
            console.log("同类型获取: this._sortType == sortType(传不传都无所谓了 上述两种情况已经包含了不同类型的所有情况)");
            console.log("this._Array.length before === " + this._Array.length);
            console.log("this._dirtyArray === " + this._dirtyArray);
            if (this._Array.length > 0 && !this._dirtyArray) {
                console.log("直接返回数组this._Array");
                return this._Array;
            }
            this._dirtyArray = false;
            if (this._sortType == SortType.Asc) {
                console.log("getAscArrayEx");
                this.getAscArrayEx();
            }
            else if (this._sortType == SortType.Desc) {
                console.log("getDescArrayEx");
                this.getDescArrayEx();
            }
            else if (this._sortType == SortType.order) {
                this._Array = this.getArrayPure();
            }
            else if (this._sortType == SortType.shuffle) {
                this.updateSequence(SortType.shuffle);
            }
            else {
                console.log("这是什么类型:" + this._sortType);
                return [];
            }
            console.log("this._Array.length after === " + this._Array.length);
        }
        return this._Array;
    };
    STL.prototype.insert = function (newdata, stype) {
        if (!newdata) {
            console.log("新数据为空不进行没意义赋值");
            return false;
        }
        if (!this._list) {
            newdata.pre = null;
            this._list = newdata;
            this.ListPushDG(newdata, true);
            console.log("原链表为空 赋值新数据:" + newdata.name);
            this.setDirty(true);
            return true;
        }
        var cmp = this._cmp;
        console.log("【运行到此时链表至少含有1个数据 以下所有判定都是在这个基本条件上做】");
        if (((this._sortType == SortType.Asc || this._sortType == SortType.Desc) && (stype == SortType.order || stype == SortType.shuffle)) &&
            ((this._sortType == SortType.order || this._sortType == SortType.shuffle) && (stype == SortType.Asc || stype == SortType.Desc))) {
            console.log("情况:从有序变无序 或者 从无序变有序走上分支   有序指:升序和降序  无序指:顺序和乱序");
            this.push(newdata, false);
            this.updateSequence(stype, cmp);
        }
        else if (((this._sortType == SortType.Asc && stype == SortType.Desc) || (this._sortType == SortType.Desc && stype == SortType.Asc))) {
            if (cmp) {
                console.log("有规则则按规则比较");
                this.rule(this._list, newdata, cmp, stype);
            }
            else {
                console.log("无规则按Node的value比较");
                this.Asc(this._list, newdata, stype);
            }
        }
        else if ((this._sortType == SortType.shuffle && stype == SortType.order)) {
            this.push(newdata);
        }
        else if (((this._sortType == SortType.order && stype == SortType.shuffle))) {
            this.push(newdata);
            this.updateSequence(SortType.shuffle);
        }
        else {
            if (this._sortType == SortType.Asc || this._sortType == SortType.Desc) {
                if (cmp) {
                    console.log("同类型:有规则则按规则比较");
                    this.rule(this._list, newdata, cmp, stype);
                }
                else {
                    console.log("同类型:无规则按Node的value比较 stype = " + stype);
                    this.Asc(this._list, newdata, stype);
                }
            }
            else if (this._sortType == SortType.order) {
                console.log("同类型:顺序从尾插入数据");
                this.push(newdata);
            }
            else if (this._sortType == SortType.shuffle) {
                console.log("同类型:乱序插入数据");
                this.shuffle(newdata);
                this._dirtyArray = false;
            }
            else {
                console.log("没有排序类型 = " + this._sortType);
                return false;
            }
        }
        return true;
    };
    STL.prototype.copyNode = function (curNode) {
        var copyNode = null;
        if (curNode) {
            copyNode = this.deepCopy(copyNode, curNode);
        }
        return copyNode;
    };
    STL.prototype.copy = function (stl) {
        var copylist;
        var tmpNode = {};
        if (stl) {
            var list = stl.getList();
            if (list) {
                tmpNode = this.deepCopy(tmpNode, list);
                copylist = new STL(tmpNode);
            }
        }
        else {
            tmpNode = this.deepCopy(tmpNode, this._list);
            copylist = new STL(tmpNode);
        }
        return copylist;
    };
    STL.prototype.update = function (sortType) {
        var cmp = this._cmp;
        var stype = SortType.shuffle;
        if (sortType) {
            stype = sortType;
        }
        this.updateSequence(stype, cmp);
    };
    STL.prototype.updateSequence = function (sortType, cmp) {
        switch (sortType) {
            case SortType.Asc:
            case SortType.Desc:
                var b = this.updateToAscOrDesc(sortType, cmp);
                console.log("updateToAscOrDesc is " + b);
                break;
            case SortType.order:
                var b = this.updateToOder(SortType.order);
                console.log("updateToOder is " + b);
                break;
            case SortType.shuffle:
                var b = this.updateToShuffle(SortType.shuffle);
                console.log("updateToShuffle is " + b);
                break;
        }
    };
    STL.prototype.updateToAscOrDesc = function (sortType, cmp) {
        this._sortType = sortType;
        this._dirtyArray = false;
        console.log("this._Array.length from getArrayPure before ================ " + this._Array.length);
        this._Array = this.getArrayPure();
        console.log("this._Array.length from getArrayPure after ================ " + this._Array.length);
        this.SortQuick(this._Array, 0, this._Array.length, cmp);
        this.resetConnect(this._Array);
        return true;
    };
    STL.prototype.updateToOder = function (sortType) {
        if (this._sortType == SortType.order) {
            console.log("已经是顺序链表");
            return false;
        }
        console.log("把链表变成顺序 = " + sortType);
        this._sortType = sortType;
        this._Array = this.getArrayPure();
        return true;
    };
    STL.prototype.updateToShuffle = function (sortType) {
        this._sortType = sortType;
        this._Array = this.getArrayPure();
        this._dirtyArray = false;
        var shuffle = [];
        var length = this._Array.length;
        for (var j = 0; j < length; j++) {
            var random_index = this.random(0, this._Array.length - 1);
            var node = this._Array[random_index];
            shuffle.push(node);
            if (j == 0) {
                this._list = node;
                node.pre = null;
                node.next = null;
            }
            else if (j == length - 1) {
                shuffle[j - 1].next = node;
                node.pre = shuffle[j - 1];
                node.next = null;
                this._tail = node;
            }
            else {
                shuffle[j - 1].next = node;
                node.pre = shuffle[j - 1];
                node.next = null;
            }
            this._Array.splice(random_index, 1);
        }
        this._Array = shuffle;
        return true;
    };
    STL.prototype.SortQuick = function (list, start, end, cmp) {
        if (start < end) {
            var pivotpos = this.partition(list, start, end, cmp);
            this.SortQuick(list, start, pivotpos - 1, cmp);
            this.SortQuick(list, pivotpos + 1, end, cmp);
        }
    };
    STL.prototype.partition = function (list, start, end, cmp) {
        var pivotpos = start;
        var pivot = list[start];
        var tmp;
        for (var i = start + 1; i <= end; i++) {
            if (list[i]) {
                var result = list[i].value < pivot.value ? true : false;
                ;
                if (cmp) {
                    result = cmp(list[i].data, pivot.data);
                }
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
    };
    STL.prototype.resetConnect = function (list) {
        for (var i = 0; i < list.length - 1; i++) {
            var cur_node = list[i];
            var next_node = list[i + 1];
            cur_node.next = next_node;
            next_node.pre = cur_node;
            if (i == 0) {
                cur_node.pre = null;
            }
            if (i + 1 == (list.length - 1)) {
                next_node.next = null;
            }
        }
        this._list = list[0];
        this._tail = list[list.length - 1];
    };
    STL.prototype.getAscArrayEx = function () {
        this._sortType = SortType.Asc;
        var head = this._list;
        this._Array = [];
        this.ArrayPushDG(this._Array, head);
    };
    STL.prototype.getDescArrayEx = function () {
        this._sortType = SortType.Desc;
        var head = this._tail;
        this._Array = [];
        this.ArrayPushDG(this._Array, head);
    };
    STL.prototype.push = function (newdata, dirty) {
        if (dirty === void 0) { dirty = true; }
        if (!newdata) {
            return false;
        }
        this._tail.next = newdata;
        newdata.pre = this._tail;
        if (dirty) {
            this.setDirty(true);
        }
        else {
            this._dirtyMap = true;
        }
        this.ListPushDG(newdata, true);
    };
    STL.prototype.shuffle = function (newdata, stype) {
        if (newdata.next) {
            this.push(newdata, false);
            this.updateSequence(stype);
        }
        else {
            this._Array = this.getArrayPure();
            var length = this._Array.length;
            var random_index = this.random(0, length - 1);
            console.log("this._Array[" + random_index + "].name = " + this._Array[random_index].name);
            console.log("乱序插入前数组: this._Array.length = " + this._Array.length);
            if (random_index == 0) {
                this._Array[random_index].pre = newdata;
                newdata.pre = null;
                newdata.next = this._Array[random_index];
                this._Array.splice(random_index, 0, newdata);
                this._list = newdata;
                console.log("随机索引为头: this._list.name = " + this._list.name);
            }
            else if (random_index == length - 1) {
                this._Array[random_index].next = newdata;
                newdata.next = null;
                newdata.pre = this._Array[random_index];
                this._tail = newdata;
                this._Array.splice(random_index + 1, 0, newdata);
                console.log("随机索引为尾: this._tail.name = " + this._tail.name);
            }
            else {
                this._Array[random_index].next = newdata;
                newdata.pre = this._Array[random_index];
                newdata.next = this._Array[random_index + 1];
                this._Array[random_index + 1].pre = newdata;
                this._Array.splice(random_index + 1, 0, newdata);
                console.log("随机索引为中间值: this._list = " + this._list.name + "  this._tail.name = " + this._tail.name);
            }
            console.log("乱序插入后数组: this._Array.length = " + this._Array.length);
            this._length++;
            this.setDirty(true);
        }
    };
    STL.prototype.rule = function (list, newdata, cmp, stype) {
        if (newdata.next) {
            this.push(newdata, false);
            this.updateSequence(stype, cmp);
        }
        else {
            var aObj = list.data;
            if (!aObj) {
                console.log("aObj is null");
                return;
            }
            var bObj = newdata.data;
            if (!bObj) {
                console.log("bObj is null");
                return;
            }
            var result = cmp(bObj, aObj) ? true : false;
            console.log("result = " + result);
            if (result) {
                if (!list) {
                    newdata.pre = null;
                    newdata.next = null;
                    this._list = newdata;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
                else {
                    console.log("rule: bObj(new) < aObj  list.name =========================" + list.name);
                    if (list.pre) {
                        list.pre.next = newdata;
                        newdata.pre = list.pre;
                    }
                    else {
                        newdata.pre = null;
                        this._list = newdata;
                    }
                    list.pre = newdata;
                    newdata.next = list;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
            }
            else {
                if (list.next) {
                    this.rule(list.next, newdata, cmp, stype);
                }
                else {
                    console.log("rule: bObj(new) >= aObj  list.name =========================" + list.name);
                    list.next = newdata;
                    newdata.pre = list;
                    newdata.next = null;
                    this._tail = newdata;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
            }
        }
    };
    STL.prototype.Asc = function (list, newdata, stype) {
        if (newdata.next) {
            this.push(newdata, false);
            this.updateSequence(stype);
        }
        else {
            var result = newdata.value <= list.value ? true : false;
            if (result) {
                console.log("new < old list.name =========================" + list.name);
                if (!list) {
                    newdata.pre = null;
                    newdata.next = null;
                    this._list = newdata;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
                else {
                    if (list.pre) {
                        list.pre.next = newdata;
                        newdata.pre = list.pre;
                    }
                    else {
                        newdata.pre = null;
                        this._list = newdata;
                    }
                    list.pre = newdata;
                    newdata.next = list;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
            }
            else {
                if (list.next) {
                    this.Asc(list.next, newdata, stype);
                }
                else {
                    console.log("new > old list.name =========================" + list.name);
                    list.next = newdata;
                    newdata.pre = list;
                    newdata.next = null;
                    this._tail = newdata;
                    this._length++;
                    this.setDirty(true);
                    return;
                }
            }
        }
    };
    STL.prototype.deepCopy = function (curNode, list, preNode) {
        if (list) {
            var tmp_preNode = list.pre;
            var tmp_nextNode = list.next;
            list.pre = null;
            list.next = null;
            curNode = JSON.parse(JSON.stringify(list));
            if (preNode) {
                curNode.pre = preNode;
                preNode.next = curNode;
            }
            list.pre = tmp_preNode;
            list.next = tmp_nextNode;
            curNode.next = this.deepCopy(curNode.next, list.next, curNode);
        }
        return curNode;
    };
    STL.prototype.ListPushDG = function (curNode, len) {
        if (!curNode) {
            return;
        }
        if (len) {
            this._length++;
        }
        if (curNode.next) {
            this.ListPushDG(curNode.next, len);
        }
        else {
            this._tail = curNode;
            console.log("新尾巴 this._tail.name= " + this._tail.name);
            if (this._tail.pre)
                console.log("旧尾巴 this._tail.pre.name= " + this._tail.pre.name);
        }
    };
    STL.prototype.MapPushDG = function (curNode) {
        if (!curNode) {
            return;
        }
        var key = curNode.name;
        this._Map[key] = curNode;
        if (curNode.next) {
            this.MapPushDG(curNode.next);
        }
        else {
            return;
        }
    };
    STL.prototype.ArrayPushDG = function (_arr, curNode) {
        if (curNode) {
            console.log("ArrayPushDG ---- curNode.name = " + curNode.name);
            if (!curNode.pre && !curNode.next) {
                console.log("节点的左右都是null证明链表只有一个数据!!!!!!!!!!!!!!!!!!!!!!!!!");
                _arr.push(curNode);
                return;
            }
            else {
                _arr.push(curNode);
            }
        }
        else {
            return;
        }
        if (this._sortType == SortType.Asc) {
            console.log("ArrayPushDG-->SortType.Asc");
            this.ArrayPushDG(_arr, curNode.next);
        }
        else if (this._sortType == SortType.Desc) {
            console.log("ArrayPushDG-->SortType.Desc = " + curNode.pre);
            this.ArrayPushDG(_arr, curNode.pre);
        }
        else {
            console.log("ArrayPushDG-->SortType.order or shuffle");
            this.ArrayPushDG(_arr, curNode.next);
        }
    };
    STL.prototype.setDirty = function (dirty) {
        this._dirtyArray = dirty;
        this._dirtyMap = dirty;
    };
    STL.prototype.setTail = function () {
        if (!this._list) {
            this._tail = null;
            return;
        }
        this.ListPushDG(this._list, true);
    };
    STL.prototype.pushHead = function (curNode, newdata) {
        if (!newdata) {
            return false;
        }
        if (!curNode.pre) {
            curNode.pre = newdata;
            newdata.pre = null;
        }
        else {
            this.pushHead(curNode.pre, newdata);
        }
    };
    STL.prototype.getArrayPure = function () {
        var list = this._list;
        console.log("getArrayPure() this._sortType == " + this._sortType);
        if (this._sortType == SortType.Desc) {
            list = this._tail;
        }
        if (!list) {
            this._Array = [];
            this._dirtyArray = false;
            console.log("getArrayPure() !list");
            return this._Array;
        }
        var head = list;
        this._Array = [];
        this.ArrayPushDG(this._Array, head);
        return this._Array;
    };
    STL.prototype.getAscArray = function () {
        console.log("开始把数组进行:升序操作");
        this._list = this.getAscList();
        var head = this._list;
        this._Array = [];
        this.ArrayPushDG(this._Array, head);
        return this._Array;
    };
    STL.prototype.getDescArray = function () {
        console.log("开始把数组进行:降序操作");
        this._list = this.getDescList();
        var head = this._tail;
        this._Array = [];
        this.ArrayPushDG(this._Array, head);
        return this._Array;
    };
    STL.prototype.getAscList = function () {
        if (this._sortType == SortType.Asc) {
            console.log("已经是升序链表");
            return this._list;
        }
        else {
            this._sortType = SortType.Asc;
            this._list = this.reverse(this._list);
            console.log("从降序->升序");
            return this._list;
        }
    };
    STL.prototype.getDescList = function () {
        if (this._sortType == SortType.Desc) {
            console.log("已经是降序链表");
            return this._list;
        }
        else {
            this._sortType = SortType.Desc;
            this._list = this.reverse(this._list);
            console.log("从升序->降序");
            return this._list;
        }
    };
    STL.prototype.reverse = function (data) {
        if (data.next == null) {
            data.pre = null;
            return data;
        }
        var ishead = false;
        if (data.pre == null) {
            ishead = true;
        }
        var p = data;
        p = this.reverse(data.next);
        data.pre = data.next;
        data.next.next = data;
        if (ishead) {
            data.next = null;
            this._tail = data;
        }
        return p;
    };
    STL.prototype.Desc = function (list, newdata) {
        if (newdata.value >= list.value) {
            if (list.pre) {
                list.pre.next = newdata;
                newdata.pre = list.pre;
            }
            newdata.next = list;
            list.pre = newdata;
            this._length++;
            return newdata;
        }
        if (list.next) {
            this.Desc(list.next, newdata);
        }
        else {
            list.next = newdata;
            newdata.pre = list;
            this._length++;
        }
        return list;
    };
    STL.prototype.out = function (d, dir) {
        if (dir === void 0) { dir = true; }
        console.log("########################输出list######################## = " + dir);
        this.mapDG(d, dir);
    };
    STL.prototype.mapDG = function (d, dir) {
        if (dir === void 0) { dir = true; }
        if (d) {
            var pre_name = d.pre ? d.pre.name : "null";
            var next_name = d.next ? d.next.name : "null";
            console.log("d.name=" + d.name + "  d.value=" + d.value + " d.data=" + d.data + " d.pre=" + d.pre + " pre_name=" + pre_name + " d.next=" + d.next + " next_name=" + next_name);
        }
        else {
            console.log("输出链表是空");
            return d;
        }
        if (dir) {
            if (d.next == null) {
                return d;
            }
            this.mapDG(d.next, dir);
        }
        else {
            if (d.pre == null) {
                return d;
            }
            this.mapDG(d.pre, dir);
        }
    };
    STL.prototype.outArr = function (_arr) {
        console.log("########################输出数组########################");
        var arr = this._Array;
        if (_arr) {
            arr = _arr;
        }
        if (arr) {
            console.log("arr.length = " + arr.length);
            for (var i = 0; i < arr.length; i++) {
                console.log("-----------");
                var n = arr[i];
                console.log("n.name = " + n.name);
                console.log("n.value = " + n.value);
                console.log("n.pre = " + n.pre);
                if (n.pre)
                    console.log("n.pre.name = " + n.pre.name);
                console.log("n.next = " + n.next);
                if (n.next)
                    console.log("n.next.name = " + n.next.name);
                console.log("n.data = " + n.data);
            }
        }
        else
            console.log("arr. is null");
    };
    STL.prototype.outMap = function (_map) {
        console.log("########################输出map########################");
        var map = this._Map;
        if (_map) {
            map = _map;
        }
        if (!this.isObj(map)) {
            console.log("map为空");
            return;
        }
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                var data = map[key];
                console.log("----------");
                console.log("node.key = " + key);
                console.log("node = " + data);
                console.log("node.name = " + data.name);
                console.log("node.value = " + data.value);
                console.log("node.pre = " + data.pre);
                if (data.pre)
                    console.log("node.pre.name = " + data.pre.name);
                console.log("node.next = " + data.next);
                if (data.next)
                    console.log("node.next.name = " + data.next.name);
            }
        }
    };
    STL.prototype.isObj = function (obj) {
        var hasObj = false;
        for (var o in obj) {
            hasObj = true;
            return hasObj;
        }
        console.log("obj is empty");
        return hasObj;
    };
    STL.prototype.random = function (min, max) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };
    ;
    return STL;
}());
exports.STL = STL;
