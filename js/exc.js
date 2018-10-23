var Vartable = function(){
	
};
var Variable = function(){
	this.Value = 0;
	this.Type = "int";
};
Variable.prototype.toString = function(){
	return this.Value.toString() + this.Type;//for hash
}

var Deffun = function(){
	this.funname = new Array();
	this.localvar = new Array();
	this.Code = new Array();
};
 
var iteration = 0;
var infunction = 0;

var exc = function(){

};
exc.prototype.toValue = function(key){
	var x = new Variable();
	if(key.indexOf("string") != -1){
		x.Value = key.substring(0,key.length-6);
		x.Type = "string";
	}
	else if(key.indexOf("double") != -1){
		x.Value = eval(key.substring(0,key.length-6));
		x.Type = "double";
	}
	else{
		x.Value = eval(key.substring(0,key.length-3));
		x.Type = "int"
	}
	return x;
}
exc.prototype.judgetype = function(type1, type2){
    if(type1 == "double"||type2 == "double"){
		return "double";
	}
	else{
		return "int";
	}
}
exc.prototype.cmp = function(var1, conoperand, var2){
	try{
		if(var1.Type == "dictionary"||var2.Type == "dictionary"){
			throw "\nType error: it can't be dictionary";
		}
		else if(var1.Type == "list"||var1.Type == "tuple"){
			x1 = new Variable();
			x2 = new Variable();
			x1.Type = x2.Type = "string";
			x1.Value = var1.Type;
			x2.Value = var2.Type;
			return exc.prototype.cmp(x1, conoperand, x2);
		}
		else if(var1.Type == "string"){
			if(var2.Type == var1.Type){
				return eval("'"+var1.Value+"'"+conoperand+"'"+var2.Value+"'");
			}
			else{
				x1 = new Variable();
				x2 = new Variable();
				x1.Type = x2.Type = "string";
				x1.Value = var1.Type;
				x2.Value = var2.Type;
				return exc.prototype.cmp(x1, conoperand, x2);
			}
		}
		else{
			if(var2.Type == "list"||var2.Type == "tuple"||var2.Type == "string"){
				x1 = new Variable();
				x2 = new Variable();
				x1.Type = x2.Type = "string";
				x1.Value = var1.Type;
				x2.Value = var2.Type;
				return exc.prototype.cmp(x1, conoperand, x2);
			}
			else{
				return eval(var1.Value.toString()+conoperand+var2.Value.toString());
			}
		}
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}
exc.prototype.tobool = function(variable){
    if(variable.Type == "double"||variable.Type == "int"){
		return !(variable.Value == 0);
	}
	else if(variable.Type == "tuple"||variable.Type == "list"||variable.Type == "string"){
		return !(variable.Value.length == 0);
	}
	else if(variable.Type == "bool"){
		return variable.Value;
	}
	else if(variable.Type == "dictionary"){
		var i = 0;
		for(x in variable.Value){
			i++;
		}
		return !(i == 0);
	}
}
exc.prototype.getvar = function(variable){
	try{
		var tableindex;
		if(typeof(global[infunction])!='undefined'&&global[infunction].indexOf(variable) != -1 && infunction != 0){
			tableindex = 0;
		}
		else{
			tableindex = infunction;
		}
		if(Object.prototype.toString.call(variable) === '[object Array]'){
			var name = variable[0];
			name = localvartable[tableindex][name];
			if(typeof(name) == 'undefined'){
				throw "\nNot define Error: the variable "+name+" is not defined";
			}
			for(var i = 1; i < variable.length; i++){
				var index = variable[i].Value;
				if(name.Type == "list"||name.Type == "tuple"){
					if(variable[i].Type!="int"){
						throw "\nType error: the list/tuple needs a int index";
					}
					name = (name.Value)[index];
				}
				else if(name.Type == "dictionary"){
					name = (name.Value)[variable[i]];
				}
				else if(name.Type == "string"){
					if(variable[i].Type!="int"){
						throw "\nType error: the string needs a int index";
					}
					var stringvar = new Variable();
					stringvar.Type = "string";
					if(index <(name.Value).length){
						stringvar.Value = (name.Value)[index];
					}
					else{
						throw "\nIndex error: Index out of bound error";//return error
					}
					name = stringvar;
				}
				else{
					throw "\nType error: This type can't be splitted";//return error;
				}
			}
			return name;
		}
		else{
			var name = localvartable[tableindex][variable];
			if(typeof(name) == 'undefined'){
				throw "\nNot define Error: the variable "+name+" is not defined";
			}
			return name;
		}
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}
exc.prototype.setvar = function(variable, value){
	try{
		var tableindex;
		if(typeof(global[infunction])!='undefined'&&global[infunction].indexOf(variable) != -1 && infunction != 0){
			tableindex = 0;
		}
		else{
			tableindex = infunction;
		}
		if(Object.prototype.toString.call(variable) === '[object Array]'){
			var name = variable[0];
			name = localvartable[tableindex][name];
			for(var i = 1; i < variable.length-1; i++){
				var index = variable[i].Value;
				name = name.Value[index];
			}
			if(name.Type == "list"||name.Type == "tuple"){
				index = variable[i].Value;
				if(variable[i].Type != "int"){
					throw "\nIndex error: the index should be a integer";//return error
				}
				(name.Value)[index] = new Variable();
				(name.Value)[index].Value = value.Value;
				(name.Value)[index].Type = value.Type;  
			}
			else if(name.Type == "dictionary"){
				index = variable[i];
				(name.Value)[index] = new Variable();
				(name.Value)[index].Value = value.Value;
				(name.Value)[index].Type = value.Type; 
			}
			else{
				throw "\nType error: It can't be splitted";//return error;
			}
		}
		else{
			localvartable[tableindex][variable] = new Variable();
			localvartable[tableindex][variable].Value = value.Value;
			localvartable[tableindex][variable].Type = value.Type;
		}
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}
exc.prototype.execute = function(node){
	var nownode = node;
	if(nownode.type == "Program"){
		nownode = nownode.list[0];
	}
	if(nownode.type == "StmtList"){
		if(nownode.list[1] == '\n'){
			var endloop = exc.prototype.execute(nownode.list[0]);
			if(typeof(endloop) != 'undefined'){
				return endloop;
			}
			else{
				return exc.prototype.execute(nownode.list[2]);
			}
		}
		else{
			var endloop = exc.prototype.execute(nownode.list[0]);
			if(typeof(endloop) != 'undefined'){
				return endloop;
			}
		}
	}
	else if(nownode.type == "Stmt"){
		if(nownode.list[0].type == "Assignment"){
			exc.prototype.execute(nownode.list[0]);
		}
		// else if(nownode.list[0].type == "Return"){
		// 	return exc.prototype.execute(nownode.list[0]);
		// }
		else{
			return exc.prototype.execute(nownode.list[0]);
		}
	}
	else if(nownode.type == "Assignment"){
		var varname = exc.prototype.execute(nownode.list[0]);
		var value = exc.prototype.execute(nownode.list[2]);
		exc.prototype.setvar(varname, value);
		return value;
	}
	else if(nownode.type == "Var"){
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "Varname"){
		return nownode.list[0];
	}
	else if(nownode.type == "Listdic"){ 
		var varname = exc.prototype.execute(nownode.list[0]);
		if(Object.prototype.toString.call(varname) === '[object Array]'){
			var listdic = varname;
		}
		else{
			var listdic = new Array();
			listdic.push(varname);
		}
		listdic.push(exc.prototype.execute(nownode.list[2]));
		return listdic;
	}
	else if(nownode.type == "Expr"){
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "Equation"){
		var cal = exc.prototype.execute(nownode.list[0]);
		var result = new Variable(); 
		if(cal.Value.length == 1){
			result.Value = cal.Value[0];
		}
		else if(cal.Type == "string"){
			result.Value = ""; 
			for(var i = 0; typeof(cal.Value[i])!='undefined'; i=i+2){
				result.Value += cal.Value[i];
			}
		}
		else if(cal.Type == "tuple"||cal.Type =="list"){
			result.Value = [];
			for(var i = 0; typeof(cal.Value[i])!='undefined'; i=i+2){
				result.Value = result.Value.concat(cal.Value[i]);
			}
		}
		else{
			result.Value = "";
			for(var i = 0; typeof(cal.Value[i])!='undefined'; i=i+1){
				result.Value += (cal.Value[i]).toString();
			}
			result.Value = eval(result.Value);
		}
		result.Type = cal.Type;
		return result;
	}
	else if(nownode.type == "Terms"){
		try{
			var result = new Variable();
			if(nownode.list[0]=='('&&nownode.list[2]==')'){
				var x = exc.prototype.execute(nownode.list[1]);
				if(x.Type != "int"&&x.Type != "double"&&x.Type != "bool"){
					return x;
				}
				else{
					x.Value.splice(0,0,"(");
					x.Value.push(")");
					return x;
				}
			}
			else if(typeof(nownode.list[1]) == 'undefined'){
				var x = exc.prototype.execute(nownode.list[0]);
				result.Value = new Array();
				result.Value.push(x.Value);
				result.Type = x.Type;
			}
			else{
				var x1 = exc.prototype.execute(nownode.list[0]);
				if(nownode.list[2]=="("){
					var x2 = exc.prototype.execute(nownode.list[3]);
				}
				else{
					var x2 = exc.prototype.execute(nownode.list[2]);
				}
				var operand = exc.prototype.execute(nownode.list[1]);
				if(x1.Type == "dictionary"||x2.Type == "dictionary"){
					throw "\nType error: The dictionary can't be operated";//return error;
				}
				else if(x1.Type == "string"||x1.Type == "tuple"||x1.Type == "list"){
					if(operand != "+"){
						throw "\nType error: The string/tuple/list can only be operated by +";//return error;
					}
					if(x2.Type != x1.Type){
						throw "\nType error: The string/tuple/list can only be operated with the same type";//return error;
					}
					else{
						result.Value = [];
						result.Value = result.Value.concat(x1.Value);
						result.Value.push(operand);
						result.Value.push(x2.Value);
						result.Type = x1.Type;
					}
				}
				else{
					if(x2.Type == "string"||x2.Type == "tuple"||x2.Type == "list"){
						throw "\nType error: The string/tuple/list can only be operated with the same type";//return error;
					}
					else{
						result.Value = [];
						result.Value = result.Value.concat(x1.Value);
						result.Value.push(operand);
						if(nownode.list[2]=="("){
							result.Value.push("(");
							result.Value = result.Value.concat(x2.Value);
							result.Value.push(")");
						}
						else{
							result.Value.push(x2.Value);
						}
						result.Type = exc.prototype.judgetype(x1.Type, x2.Type);
					}
				}	
			}
			return result;
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	}
	else if(nownode.type == "Term"){
		if(nownode.list[0].type == "Var"){
			return  exc.prototype.getvar(exc.prototype.execute(nownode.list[0]));
		}
		else{ 
			return exc.prototype.execute(nownode.list[0]);
		}
			
	}
	else if(nownode.type == "Const"){
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "Number"){
		var variable = new Variable(); 
		if(nownode.list[0].indexOf(".")!=-1){
			variable.Type = "double";
		}
		else{
			variable.Type = "int";
		}
		variable.Value = eval(nownode.list[0]);
		return variable;
	}
	else if(nownode.type == "String"){
		var variable = new Variable(); 
		variable.Type = "string";
		variable.Value = nownode.list[0].substring(1,nownode.list[0].length-1);
		return variable;
	}
	else if(nownode.type == "Operand"){
		return nownode.list[0];
	}
	else if(nownode.type == "Conditional"){
		var ifstate = exc.prototype.execute(nownode.list[0]);
		if(ifstate == 'true'){
			return;
		}
		else if(ifstate == 'false'){
			var i = 1;
			while(typeof(nownode.list[i]) != 'undefined'){
				if(nownode.list[i].type == "Elif"){
					var elifstate = exc.prototype.execute(nownode.list[i]);
					if(elifstate == 'false'){
						i++;
					}
					else if(elifstate == 'true'){
						return;
					}
					else{
						return elifstate;
					}
				}
				else if(nownode.list[i].type == "Else"){
					var elsestate = exc.prototype.execute(nownode.list[i]);
					return elsestate;
				}
			}
		}
		else{
			return ifstate;
		}
	}
	else if(nownode.type == "If"){
		if(exc.prototype.execute(nownode.list[2])){
			var endloop = exc.prototype.execute(nownode.list[6]);
			if(typeof(endloop)!='undefined'){
				return endloop;
			}
			return "true";
		}
		else{
			return "false";
		}
	}
	else if(nownode.type == "Elif"){
		if(exc.prototype.execute(nownode.list[2])){
			var endloop = exc.prototype.execute(nownode.list[6]);
			if(typeof(endloop)!='undefined'){
				return endloop;
			}
			return "true";
		}
		else{
			return "false";
		}
	}
	else if(nownode.type == "Else"){
		var endloop = exc.prototype.execute(nownode.list[3]);
		if(typeof(endloop)!='undefined'){
			return endloop;
		}
	}
	else if(nownode.type == "Conds"){
		if(nownode.list[0] == "not"){
			return !exc.prototype.execute(nownode.list[1]);
		}
		else if(typeof(nownode.list[1]) == 'undefined'){
			return exc.prototype.execute(nownode.list[0]);
		}
		else if(nownode.list[1] == "and"){
			if(exc.prototype.execute(nownode.list[0])){
				return exc.prototype.execute(nownode.list[2]);
			}
			else{
				return false;
			}
		}
		else if(nownode.list[1] == "or"){
			if(exc.prototype.execute(nownode.list[0])){
				return true;
			}
			else{
				return exc.prototype.execute(nownode.list[2]);
			}
		}
	}
	else if(nownode.type == "Cond"){
		if(typeof(nownode.list[1]) == 'undefined'){
			var x = exc.prototype.execute(nownode.list[0]);
			return exc.prototype.tobool(x);
		}
		else{
			var x1 = exc.prototype.execute(nownode.list[0]);
			var conoperand = exc.prototype.execute(nownode.list[1]);
			var x2 = exc.prototype.execute(nownode.list[2]);
			return exc.prototype.cmp(x1,conoperand,x2);
		}
	}
	else if(nownode.type == "ConOperand"){
		return nownode.list[0];
	}
	else if(nownode.type == "Iteration"){
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "For"){
		try{
			iteration+=1;
			var varname = exc.prototype.execute(nownode.list[1]);
			if(nownode.list[3].type == "Range"){
				var rangelist = exc.prototype.execute(nownode.list[3]);
			}
			else{
				if(nownode.list[3].type == "Var"){
					var x = exc.prototype.getvar(exc.prototype.execute(nownode.list[3]));
				}
				else{
					var x = exc.prototype.execute(nownode.list[3]);
				}
				var rangelist = new Array();
				if(x.Type == "dictionary"){
					for(attr in x.Value){
						rangelist.push(exc.prototype.toValue(attr));
					}
				}
				else if(x.Type == "tuple"||x.Type =="list"){
					rangelist = x.Value;
				}
				else if(x.Type == "string"){
					var temp = x.Value.split("");
					for(var i=0; i<temp.length; i++){
						var chr = new Variable();
						chr.Type = "string";
						chr.Value = temp[i];
						rangelist.push(chr);
					}
				}
				else{
					throw "\nType error: This type can't be splitted";//return error;
				}
			}
			for(var i=0; i<rangelist.length; i++){
				exc.prototype.setvar(varname,rangelist[i]);
				var endloop = exc.prototype.execute(nownode.list[6]);
				if(typeof(endloop)!='undefined'){
					if(typeof(endloop)!='boolean'){
						iteration-=1;
						return endloop;
					}
					else{
						if(endloop){
							break;
						}
						else{
							continue;
						}
					}
				}
			}
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
		finally{
			iteration-=1;
		}
	}
	else if(nownode.type == "Range"){
		try{
			var rangelist = new Array();
			if(typeof(nownode.list[6])!='undefined'&&nownode.list[6].type == "Number"){
				var z = exc.prototype.execute(nownode.list[6]);
				if(z.Type != "int"){
					throw "\nType error: The parameter needs the int type";//return error;
				}
				z = z.Value;
			}
			else{
				var z = 1;
			}
			if(typeof(nownode.list[4])!='undefined'&&nownode.list[4].type == "Number"){
				var x = exc.prototype.execute(nownode.list[2]);
				var y = exc.prototype.execute(nownode.list[4]);
				if(x.Type != "int"||y.Type != "int"){
					throw "\nType error: The parameter needs the int type";//return error;
				}
				x = x.Value;
				y = y.Value;
			}
			else{
				var x = 0;
				var y = exc.prototype.execute(nownode.list[2]);
				if(y.Type != "int"){
					throw "\nType error: The parameter needs the int type";//return error;
				}
				y = y.Value;
			}
			for(var i = x; i < y; i += z){
				var temp = new Variable();
				temp.Value = i;
				temp.Type = "int";
				rangelist.push(temp);
			}
			return rangelist;
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	}
	else if(nownode.type == "While"){
		iteration+=1;
		while(exc.prototype.execute(nownode.list[2])){
			var endloop = exc.prototype.execute(nownode.list[6]);
			if(typeof(endloop)!='undefined'){
				if(typeof(endloop)!='boolean'){
					iteration-=1;
					return endloop;
				}
				else{
					if(endloop){
						break;
					}
					else{
						continue;
					}
				}
			}
		}
		iteration-=1;
	}
	else if(nownode.type == "DefFunc"){
		deffunc.funname.push(exc.prototype.execute(nownode.list[1]));
		deffunc.localvar.push(nownode.list[3]);
		deffunc.Code.push(nownode.list[7]);
	}
	else if(nownode.type == "FuncCall"){
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "Func"){
		var funcname = exc.prototype.execute(nownode.list[0]);
		var index = deffunc.funname.indexOf(funcname);
		if(index == -1){
			var para = new Array();
			for(var i=2; typeof(nownode.list[i])!='undefined'; i+=2){
			    para.push(exc.prototype.execute(nownode.list[i]));//need judge 
			}
			var result = func(funcname,para);
			if(typeof(result)!='undefined'){
				return result;
			}
		}
		else{
			try{
				var localvar = exc.prototype.execute(deffunc.localvar[index]);//return a array
				var localtable = new Vartable();
				for(var i=0; i<localvar.length; i++){
					if(typeof(nownode.list[2+i*2])!='undefined'){
				    	localtable[localvar[i]] = exc.prototype.execute(nownode.list[2+i*2]);//need judge 
				    }
				    else{
				    	throw "\nParameter error it needs "+localvar.length+" parameters";//return error;
				    }
				}
				var oldinfluction = infunction;
				infunction = index+1;
				while(typeof(localvartable[infunction])!='undefined'){
					infunction +=1;
				}
				localvartable[infunction] = localtable;
				var result = exc.prototype.execute(deffunc.Code[index]);
				localvartable[infunction] = undefined;
				global[infunction]=[];
				infunction = oldinfluction;
				if(typeof(result)!='undefined'){
					return result;
				}
			}
			catch(error)
			{
				document.getElementById("result").value += error;		
			}
		}
	
	}
	else if(nownode.type == "SubFuncCall"){
		try{
			var num = 0;
			var name = exc.prototype.execute(nownode.list[num]);
			var caller = exc.prototype.getvar(name);
			num++;
			while(typeof(nownode.list[num]) != 'undefined'){
				if(typeof(caller) =='undefined'){
					throw"\nUndefined error: the function doesn't have a return value."//return error;
				}
				var fname  = exc.prototype.execute(nownode.list[num+1]);
				var param = new Array(); 
				for(var i = num+3; i<nownode.list.length; i+=2){
					if(nownode.list[i].type == "Element"){
						param.push(exc.prototype.execute(nownode.list[i]));
					}
					else{
						break;
					}
				}
				if(nownode.list[i] == ")"){
					num = i+1;
				}
				else{
					num = i;
				}
				var result = subfunc(caller, fname, param);
				if(typeof(result[0]) !='undefined'){
					if(typeof(name) !='undefined'){
						exc.prototype.setvar(name,result[0]);
					}
				}
				if(typeof(result[1]) !='undefined'){
					caller = result[1];
				}
				else{
					caller = undefined;
				}
				name = undefined;
			}
			return caller;
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	}
	else if(nownode.type == "Argument"){
		var argulist = new Array();
		argulist.push(exc.prototype.execute(nownode.list[0]));
		var i = 1;
		while(typeof(nownode.list[i]) != 'undefined'){
			argulist.push(exc.prototype.execute(nownode.list[i+1]));
			i = i+2;
		}
		return argulist;
	}
	else if(nownode.type == "Element"){ 
		return exc.prototype.execute(nownode.list[0]);
	}
	else if(nownode.type == "Endloop"){
		try{
			if(iteration == 0){
				throw "\nEndloop error: It's not in the iteration";//return error;
			}
			if(nownode.list[0] == "break"){
				return true;
			}
			else{
				return false;//continue
			}
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	} 
	else if(nownode.type == "Global"){
		try{
			if(infunction == 0){
				throw "\nGlobal error: It's not in a function";//return error;
			}
			else{
				var varname = exc.prototype.execute(nownode.list[1]);
				if(varname in localvartable[infunction]){
					throw "\nGlobal error: the local variable "+varname+" has been defined";//return error;
				}
				if(varname in localvartable[0]){
					global[infunction]=new Array();
					global[infunction].push(varname);
				}
				else{
					throw "\nGlobal error: the global variable doesn't exist."//return error;
				}
			}
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	}
	else if(nownode.type == "List"){
		var listvar = new Variable();
		listvar.Type = "list";
		var list = new Array();
		for(var i=1; typeof(nownode.list[i]) != 'undefined'&&nownode.list[i] != "]"; i=i+2){
			var variable = exc.prototype.execute(nownode.list[i]);
			list.push(variable);
		}
		listvar.Value = list;
		return listvar;
	}
	else if(nownode.type == "Tuple"){
		var tuplevar = new Variable();
		tuplevar.Type = "tuple";
		var tuple = new Array();
		for(var i=1; typeof(nownode.list[i]) != 'undefined'; i=i+2){
			var variable = exc.prototype.execute(nownode.list[i]);
			tuple.push(variable);
		}
		tuplevar.Value = tuple;
		return tuplevar;
	}
	else if(nownode.type == "Dictionary"){
		try{
			var dictvar = new Variable();
			dictvar.Type = "dictionary";
			var dictionary = new Vartable();
			for(var i=1; typeof(nownode.list[i]) != 'undefined'&&nownode.list[i] != "}"; i=i+4){
				var key = exc.prototype.execute(nownode.list[i]); 
				if(key.Type == "tuple"||key.Type == "list"||key.Type == "dictionary"){
					throw "\nKey error: the "+key.Type+" can't be hashable"//return error;
				} 
				else{
					var variable = exc.prototype.execute(nownode.list[i+2]);
					dictionary[key] = variable;
				}
			}
			dictvar.Value = dictionary;
			return dictvar;
		}
		catch(error)
		{
			document.getElementById("result").value += error;		
		}
	}
	else if(nownode.type == "Return"){
		if(typeof(nownode.list[1]) == 'undefined'){
			return null;
		}
		else{
			return exc.prototype.execute(nownode.list[1]);
		}
	}
};   