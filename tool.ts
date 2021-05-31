/**
 * [tool]
 * @Author   freemenL
 * @DateTime 2018-08-14T16:46:22+0800
*/
import { Base64 } from 'js-base64';
import merge from "lodash.merge";
import { cloneDeep } from 'lodash';
/**
 *职责链模式 检测数据类型  
*/
class GetType{

  public static validate(obj,typeObj,next,callBack){
    let type:string="";
    Reflect.ownKeys(typeObj).forEach((item,index)=>{
      if(callBack(typeObj[item],obj)){
        type = item.toString();
      }
    })
    if(type){
      return type;
    }
    return next(obj);
  }

  public static toStringMethod(obj){

    let typeObj = {
      array:"[object Array]",
      object:"[object Object]",
      date:"[object Date]",
      function:"[object Function]",
      symbol:"[object Symbol]",
      set:"[object Set]",
      map:"[object Map]",
      formData:"[object FormData]",
      null:"[object Null]"
    };

    return this.validate(obj,typeObj,this.typeofMethod,(item,obj)=>{
      if(item===Object.prototype.toString.call(obj)){
        return true
      }
    })
  }

  public static typeofMethod(obj){
    let typeObj = {
      string:"string",
      boolean:"boolean",
      undefined:"undefined",
      number:"number",
    };
    return GetType.validate(obj,typeObj,GetType.directMethod,(item,obj)=>{
      if(typeof obj===item){
        return true
      }
    })
  }

  public static directMethod(obj){
    if(null===obj){
      return "null"
    }
    throw new TypeError("params Error!");
  }

}
/**
 * 生成树形菜单数据
 * @param    {[type]}                 menuList) [description]
 * @return   {[type]}                           [description]
*/

const menuTreeGenerator = (menuList)=> (id,pid,children)=> {
  let temObj = {};
  let responseData:Array<any> = [];
  let length = menuList.length;

  for(let i=0;i<length;i++){
    temObj[menuList[i][id]]=menuList[i];
  }
  for(let i=0;i<length;i++){
    let key = temObj[menuList[i][pid]];
    if(key){
      if(!key[children]){
        key[children] = []
      }
      key[children].push(menuList[i]);
    }else{
      responseData.push(menuList[i])
    }
  }
  return responseData
}

const method:any = {
  /* 获取侧栏菜单 组数 */
  getMenuList(pathname,menuList,subs){
    let length = menuList.length
    for(let i=0;i<length;i++){
      if(menuList[i]["pathname"]==pathname&&!menuList[i]["sub"]){
        return []
      }else if(menuList[i]["sub"]&&menuList[i]["sub"].length>0){
        const menus = menuList[i]["sub"];
        const len = menuList[i]["sub"].length;
        for(let menu = 0;menu<len;menu++){
          if(menus[menu]["pathname"]==pathname){
            return subs||menus;
          }
        }
        let str = method.getMenuList(pathname,menus,menus);
        if(str){
          return str
        }
      }
    }
  },
  getPathname:(function(){
    let resData = []
    return {func:function loadMenu(menus){
        let len = menus.length;
        for(let m=0;m<len;m++){
          if(menus[m].sub&&menus[m].sub.length>0){
            loadMenu(menus[m].sub);
          }
          Array.prototype.push.call(resData,menus[m].pathname);
        }
      },
      resData
    }
  })(),
  /**
   * 判断对象是否相等
   */
	isObjectValueEqual:function(a, b) {
    let aProps = Object.getOwnPropertyNames(a);
    let bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (let i = 0; i < aProps.length; i++) {
      let propName = aProps[i];
        if (a[propName] !== b[propName]) {
          return false;
      }
    }
    return true;
	},
  /**
   * 类型验证
  */
  verifyType:function(){
      function isType(type){
        return function(obj){
          return Object.prototype.toString.call(obj)=="[object "+type+"]";
        }
      }
      return{
        isString:isType('String'),
        isArray:isType('Array'),
        isNumber:isType('Number')
      }
    },
    /**
     * 分时函数
    */
    subsection:function(data,fn,count,time){
      let timmer:any = null;
      function start(){
        let preCoord = data.slice(0,1);
        for (var i = 0; i <Math.min(count||1,data.length); i++) {
          var obj = data.splice(0,2);
          fn([...obj,data[0]]);
        }
      }
      return function(){
        timmer  = setInterval(function(){
          if(data.length===0){
            clearInterval(timmer);
          }
          start();
        },time)
      }
    },
    /**
     *函数节流
     */
    throttle:function(fn:Function,interval?:number){
      let _self = fn;
      var timmer;
      let isFirst = true;
      return function(this:void){
        let args = arguments;
        let _me = this;
        if(isFirst){
          fn.apply(_me,args)
          return isFirst = false;
        }
        if(timmer){
          return false;
        }
        timmer = setTimeout(function(){
          clearTimeout(timmer);
          timmer = null;
          fn.apply(_me,args);
        },interval||500)
      }
    },

    promise_all(promise:Array<any>){
      if(method.GetType(promise)!=="array"){
        throw TypeError("promise_all params type must be an array!")
      }
      return new Promise((resolve,reject)=>{
         let length = promise.length;
         let counter = 0;
         let responseArr = new Array();
         for(let i=0;i<length;i++){
           Promise.resolve(promise[i]).then(value=>{
               counter++;
               responseArr[i]=value;
               if(counter===length){
                 resolve(responseArr);
               }
           },(error)=>{
             reject(error);
           })
         }
      })
    },
  /**
   * 处理上传图片的数据
  */
  getUploadMsg:function(params){
    if(!params) return ;
    return params.fileList.map(val=> val.url||val.response.data.src_b)
  },
    /**
     *合并修饰器
     */
    compose(...funcs) {
      if (funcs.length === 0) {
        return arg => arg
      }
      if (funcs.length === 1) {
        return funcs[0]
      }
      return funcs.reduce((a, b) => (...args) => a(b(...args)))
    },

     mergeConfig(defaultConfig, theConfig){
        
        return merge(cloneDeep(defaultConfig), theConfig);
     },

    /**
     * [mixins]
     * @param    {...[type]} 
     * @return   {[type]} 
     */
    mixins(...list) {
      return function (target) {
        Object.assign(target.prototype, ...list)
      }
    },
    /**
     * @param    {[reactCmponent]}              
    */
    autobind(this:void,target) {
      target.prototype.binder = (...methods:Array<string>):void=>{
        let mtd = methods[0];
        methods.find((method) => target.prototype[method] = target.prototype[method].bind(target.prototype));
      }
    },

   /**
   * 格式化秒
   * @param   int     value   总秒数
   * @return  string  result  格式化后的字符串
   */
   formatSeconds(value) { 
        var theTime:number = parseInt(value);// 需要转换的时间秒 
        var theTime1 = 0;// 分 
        var theTime2 = 0;// 小时 
        var theTime3 = 0;// 天
        if(theTime > 60) { 
            theTime1 = Math.floor(theTime/60); 
            theTime = Math.floor(theTime%60); 
            if(theTime1 > 60) { 
                theTime2 = Math.floor(theTime1/60); 
                theTime1 = Math.floor(theTime1%60); 
                if(theTime2 > 24){
                    //大于24小时
                    theTime3 = Math.floor(theTime2/24);
                    theTime2 = Math.floor(theTime2%24);
                }
            } 
        } 
        var result = '';
        if(theTime > 0){
            result = ""+Math.floor(theTime)+"秒";
        }
        if(theTime1 > 0) { 
            result = ""+Math.floor(theTime1)+"分"+result; 
        } 
        if(theTime2 > 0) { 
            result = ""+Math.floor(theTime2)+"小时"+result; 
        } 
        if(theTime3 > 0) { 
            result = ""+Math.floor(theTime3)+"天"+result; 
        }
        return result; 
    },

    /**
     * 转换数组维度
    */
   transformArray(num:number,array:Array<any>):Array<any>{
      var Arr = new Array(Math.ceil(array.length/num));
      for(var i = 0; i<Arr.length;i++){
        Arr[i] = new Array();
        for(var j = 0; j<num; j++){
          Arr[i][j] = '';
        }
      }
      for(var i = 0; i<array.length;i++){
        Arr[Math.floor(i/num)][i%num] = array[i]; 
      } 
      return Arr;
   },
   /**
    *检测数据类型 ，返回对应数据类型的名称 
    *引用类型 array object date function symbol set map 
    *基本数据类型  string boolean undefined number null    
   **/
   GetType:(obj)=>{
     return GetType.toStringMethod(obj);
   },
   /**
    * 获取组件名称 
    */
   getDisplayName(WrappedComponent) {
      return WrappedComponent.displayName || WrappedComponent.name || 'Component';
    }
}
/**
 * about cookie 
*/
const cookieUtil = {
  get:function(name){
    let cookieName = encodeURIComponent(name)+'=',
    cookieStart = document.cookie.indexOf(cookieName),
    cookieValue:any = null;
    if(cookieStart>-1){
      let cookieEnd = document.cookie.indexOf(';',cookieStart);
      if(cookieEnd == -1){
        cookieEnd = document.cookie.length  
      }
      cookieValue = decodeURIComponent(document.cookie.substring(cookieStart+cookieName.length,cookieEnd));
    }
    return cookieValue;
  },
  set:function(name, value, expires?:Date, path?:string, domain?:string, secure?:string){
    let cookieText = encodeURIComponent(name)+'='+encodeURIComponent(value);
    if(expires instanceof Date){
      cookieText+=";expires="+expires.toUTCString();
    }
    if(path){
      cookieText += ";path=" + path;
    }
    if(domain){
      cookieText +=';domain='+domain;
    }
    if(secure){
      cookieText+=';secure';
    }
    document.cookie = cookieText;
  },
  unset:function(name,path?:string,domain?:string,secure?:string){
    this.set(name,'',new Date(0),path,domain,secure)
  }
}


/**
 *about storage 
 */
class Storage {
  public storage;
  constructor(storage){
    this.storage = storage;
  }
  get(key){
    const val = this.storage.getItem(key);
    if (val) {
      return JSON.parse(Base64.decode(this.storage.getItem(key)));
    }
    return '';
  }
  set(key, val){
    const setting = arguments[0]
    if (Object.prototype.toString.call(setting).slice(8, -1) === 'Object') {
      for (const i in setting) {
          this.storage.setItem(i, Base64.encode(JSON.stringify(setting[i])));
      }
    } else {
      this.storage.setItem(key, Base64.encode(JSON.stringify(val)));
    }
  }
  remove(key){
    if (this.storage.getItem(key)) {
      this.storage.removeItem(key)
    }
  }
  clear(){
    this.storage.clear()
  }
}
const Local = new Storage(window.localStorage);
const Session = new Storage(window.sessionStorage);

const emptyTool = {
  cookieUtil,
  Local,
  Session,
  menuTreeGenerator,
  ...method, 
}

export default emptyTool;
