// var Variable = function(){
// 	this.Value = 0;
// 	this.Type = "int";
// };

var StrFun = function(caller, fname, param){
	this.caller = caller;
	this.fname = fname;
	this.param = param;
}

var ListFun = function(caller, fname, param){
	this.caller = caller;
	this.fname = fname;
	this.param = param;
}

function subfunc(caller, fname, param)
{
	if(caller.Type == "string")
	{
		var func = new StrFun(caller,fname,param);
		return func.exe();
	}
	else if(caller.Type == "list")
	{
		var func = new ListFun(caller,fname,param);
		return func.exe();
	}
}
StrFun.prototype.exe = function()
{
	try{
		var res;
		switch(this.fname)
		{
			case 'split': res = this.split(); break;
			case 'strip': res = this.strip(); break;
			case 'replace': res = this.replace(); break;
			case 'find': res = this.find(); break;
			case 'count': res = this.count(); break;
			case 'join': res = this.join(); break;
			case 'lower': res = this.lower(); break;
			case 'upper': res = this.upper(); break;
			default: throw"\nFunction error: the function name "+sysfunc.fname+" not found";
		}
		return res;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}
StrFun.prototype.split = function()
{
	var i;
	var str = this.caller.Value;
	var p1 = (this.param).length > 0 ? this.param[0].Value : ' ';
	//p1 = this.localvar[0];
	var re = str.split(p1);
	var v = new Variable();
	v.Value = new Array();
	for(i= 0;i<re.length;i++){
		var temp = new Variable();
		temp.Type = "string";
		temp.Value = re[i];
		v.Value.push(temp);
	}
	v.Type = "list";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.strip = function()
{
	var str = this.caller.Value;
	var v = new Variable();
	v.Value = str.replace(/^\s+|\s+$/g, '');
	v.Type = "string";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.replace = function()
{
	var i;
	var str = this.caller.Value;
	var v = new Variable();
	v.Value = str.replace(new RegExp(this.param[0].Value,"gm"),this.param[1].Value);
	v.Type = "string";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.find = function()
{
	var str = this.caller.Value;
	var v = new Variable();
	v.Value = str.indexOf(this.param[0].Value);
	v.Type = "int";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.count = function()
{
	var str = this.caller.Value;
	var i,cnt;
	cnt = 0;
	for(i=0;i<str.length;i++)
	{
		if(str[i] == this.param[0].Value)
		{
			cnt++;
		}
	}
	var v = new Variable();
	v.Value = cnt;
	v.Type = "int";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.lower = function()
{
	var str = this.caller.Value;
	var v = new Variable();
	v.Value = str.toLowerCase();
	v.Type = "string";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.upper = function()
{
	var str = this.caller.Value;
	var v = new Variable();
	v.Value = str.toUpperCase();
	v.Type = "string";
	var result = new Array();
	result[1]=v;
	return result;
}

StrFun.prototype.join = function()
{
	var i;
	var res = '';
	var str = this.caller.Value;
	var list = this.param[0].Value;
	for(i=0;i<list.length;i++)
	{
		res = res + list[i].Value;
		if(i+1!=list.length)
		{
			res = res + str;
		}
	}
	var v = new Variable();
	v.Value = res;
	v.Type = "string";
	var result = new Array();
	result[1]=v;
	return result;
}

ListFun.prototype.exe = function()
{
	try{
		var res;
		switch(this.fname)
		{
			case 'insert': res = this.insert(); break;
			case 'append': res = this.append(); break;
			case 'pop': res = this.pop(); break;
			case 'remove': res = this.remove(); break;
			case 'reverse': res = this.reverse(); break;
			case 'sort': res = this.sort(); break;
			case 'index': res = this.index(); break;
			case 'count': res = this.count(); break;
			case 'clear': res = this.clear(); break;
			case 'extend': res = this.extend(); break;
			default: throw"\nFunction error: the function name "+sysfunc.fname+" not found";
		}
		return res;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

ListFun.prototype.insert = function()
{
	var index = this.param[0].Value;
	var list = this.caller.Value;
	list.splice(index,0,this.param[1]);
	var v = new Variable();
	v.Value = list;
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}
//L.append('i');
ListFun.prototype.append = function()
{
	var temp = new Variable();
	temp.Value = this.param[0].Value;
	temp.Type = this.param[0].Type;
	var list = this.caller.Value;
	list.push(temp);
	var v = new Variable();
	v.Value = list;
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}

ListFun.prototype.pop = function()
{
	var list = this.caller.Value;
	var tmp = list[list.length-1]
	list.splice(list.length-1,1);
	var v1 = new Variable();
	v1.Value = list;
	v1.Type = "list";

	var v2 = new Variable();
	v2.Value = tmp.Value;
	v2.Type = tmp.Type;
	return new Array(v1,v2);
}

ListFun.prototype.remove = function()
{
	var list = this.caller.Value;
	var str = this.param[0];
	var index = 0;
	for(index = 0;index <list.length;index++){
		if(list[index].Value==str.Value&&list[index].Type==str.Type)
			break;
	}
	if(index != list.length){
		list.splice(index,1);
	}
	var v = new Variable();
	v.Value = list;
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}

ListFun.prototype.reverse = function()
{
	var list = this.caller.Value;
	var v = new Variable();
	v.Value = list.reverse();
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}

ListFun.prototype.sort = function()
{
	var list = this.caller.Value;
	var v = new Variable();
	v.Value = list.sort();
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}

ListFun.prototype.index = function()
{
	var list = this.caller.Value;
	var str = this.param[0].Value;
	var v = new Variable();
	v.Value = list.indexOf(str);
	v.Type = "int";
	var result = new Array();
	result[1]=v;
	return result;
}

ListFun.prototype.count = function()
{
	var list = this.caller.Value;
	var str = this.param[0].Value;
	var i;
	var cnt = 0;
	for(i=0;i<list.length;i++)
	{
		if(list[i] == str)
		{
			cnt++;
		}
	}
	var v = new Variable();
	v.Value = cnt;
	v.Type = "int";
	var result = new Array();
	result[1]=v;
	return result;
}

ListFun.prototype.clear = function()
{
	var v = new Variable();
	v.Value = new Array();
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}

ListFun.prototype.extend = function()
{
	var list = this.caller.Value;
	var list1 = this.param[0].Value;
	var v = new Variable();
	v.Value = list.concat(list1);
	v.Type = "list";
	var result = new Array();
	result[0]=v;
	return result;
}




var SysFun = function(fname, param) {
	this.fname = fname;
	this.param = param;
}

function func(fname, param){
	try{
		var sysfunc = new SysFun(fname, param);
		switch(sysfunc.fname)
		{
			case 'print': res = sysfunc.print(); break;
			case 'len': res = sysfunc.len(); break;
			case 'max': res = sysfunc.max(); break;
			case 'min': res = sysfunc.min(); break;
			default: throw"\nFunction error: the function name "+sysfunc.fname+" not found";
		}
		return res;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}
SysFun.prototype.len = function()
{
	var v = new Variable();
	if(this.param[0].Type == "string" || this.param[0].Type == "list")
	{
		
		v.Value = (this.param[0].Value).length;
		v.Type = 'int';
	}
	else if(this.param[0].Type == "dictionary")
	{
		var i,cnt;
		cnt = 0;
		//var v = new Variable();
		var dict = this.param[0].Value;
		for(i in dict)
		{
			cnt++;
		}
		v.Value = cnt;
		v.Type = 'int';
	}
	return v;
}

SysFun.prototype.max = function()
{
	var v = new Variable();
	var i;
	if(this.param[0].Type == "list")
	{
		var list = this.param[0].Value;
		if(list.length==0)
		{
			return v;
		}
		v.Value = list[0].Value;
		v.Type = list[0].Type;
		for(i=0;i<list.length;i++)
		{
			if(list[i].Value > v.Value)
			{
				v.Value = list[i].Value;
				v.Type = list[i].Type;
			}
		}	
	}
	return v;
}

SysFun.prototype.min = function()
{
	var v = new Variable();
	var i;
	if(this.param[0].Type == "list")
	{
		var list = this.param[0].Value;
		if(list.length==0)
		{
			return v;
		}
		v.Value = list[0].Value;
		v.Type = list[0].Type;
		for(i=0;i<list.length;i++)
		{
			if(list[i].Value < v.Value)
			{
				v.Value = list[i].Value;
				v.Type = list[i].Type;
			}
		}	
	}
	return v;
}

SysFun.prototype.print = function()
{
	var result = "\n"
	for(var i=0; i<this.param.length; i++){
		var temp = SysFun.prototype.printvar(this.param[i]);
		if(temp[0] == "'"&&temp[temp.length-1] == "'"){
			result += temp.substring(1, temp.length-1);
		}
		else{
			result += temp;
		}
		if(i == this.param.length){
			result += "\n";
		}
		else{
			result += " ";
		}
	}
	document.getElementById("result").value+=result;
	//return re;
}
SysFun.prototype.printvar = function(variable){
	var result = "";
	if(variable.Type == "list"){
		result += "[";
		for(var i = 0; i<variable.Value.length; i++){
			result += SysFun.prototype.printvar(variable.Value[i]);
			if(i == variable.Value.length-1){
				result += "]";
			}
			else{
				result +=", ";
			}
		}
		return result;
	}
	else if(variable.Type == "tuple"){
		result += "(";
		for(var i = 0; i<variable.Value.length; i++){
			result += SysFun.prototype.printvar(variable.Value[i]);
			if(i == variable.Value.length-1){
				result += ")";
			}
			else{
				result += ", ";
			}
		}
		return result;
	}
	else if(variable.Type == "dictionary"){
		result += "{";
		for(key in variable.Value){
			result += SysFun.prototype.printvar(exc.prototype.toValue(key));
			result +=": ";
			result += SysFun.prototype.printvar(variable.Value[key]);
			result += ", ";
		}
		result =result.substring(0,result.length-2)+"}";
	}
	else if(variable.Type == "string"){
		result +="'"+variable.Value+"'";
	}
	else{
		result += variable.Value.toString();
	}
	return result;
}

