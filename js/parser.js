var parser = function(){
}

var treeNode = function () {
    this.list = new Array();
    this.type = "leaf";
    this.tokenNum = 0;
};

parser.prototype.preprocess = function(tokens)
{
	var newTokens = new Array();
	var j = 0;
	var indentNum = 0;
	//将indent和unindent前多余的NEWLINE标记去除
	for(var i = 0; i < tokens.length; i++)
	{
		//去除最后一个换行符
		if(i == tokens.length - 1 && tokens[i].type == "TOKEN_OP_NEWLINE")
			break;
		if(i + 1 < tokens.length 
		&& tokens[i].type == "TOKEN_OP_NEWLINE" 
		&& (tokens[i + 1].type == "TOKEN_OP_INDENT" || tokens[i + 1].type == "TOKEN_OP_DEDENT" ))
		{
			newTokens[j++] = tokens[i + 1];
			i++;
		}
		else
		{			
			newTokens[j++] = tokens[i];
		}
		
	}
	
	var newTokens1 = new Array();	
	var newlineToken = new Token();
	newlineToken.type = "TOKEN_OP_NEWLINE";
	j = 0;
	//对于unindent，如果之后是一个unindent、elif、else或为末尾，不处理；反之，加上换行符
	for(i = 0; i < newTokens.length; i++)
	{
		if(i + 1 < newTokens.length 
		&& newTokens[i].type == "TOKEN_OP_DEDENT"
		&& newTokens[i + 1].type != "TOKEN_OP_DEDENT"
		&& newTokens[i + 1].type != "TOKEN_RSRVD_ELSE"
		&& newTokens[i + 1].type != "TOKEN_RSRVD_ELIF")
		{
			newTokens1[j] = newTokens[i];
			newTokens1[j + 1] = newlineToken;
			j += 2;
		}
		else
		{
			newTokens1[j] = newTokens[i];
			j++;
		}		
		if(newTokens[i].type == "TOKEN_OP_INDENT")
		{
			indentNum++;
		}
		if(newTokens[i].type == "TOKEN_OP_DEDENT")
		{
			indentNum--;
		}
	}	
		
	//补全末尾的unindent
	var unindentToken = new Token();
	unindentToken.type = "TOKEN_OP_DEDENT";
	for(var m = 0; m < indentNum; m++)
	{
		newTokens1.push(unindentToken);
	}
	
	return newTokens1;
}
	
//<Program> -> <Stmtlist>
parser.prototype.tree_Program = function(tokens)
{
	var root = new treeNode();
	root.type = "Program";	

	root.list[0] = parser.prototype.tree_StmtList(tokens);
	
	root.tokenNum = root.list[0].tokenNum;
	return root;
}

//<StmtList> -> <Stmt> \n <StmtList> | <Stmt>
//**Error Detection
parser.prototype.tree_StmtList = function(tokens)
{
	var root = new treeNode();
	root.type = "StmtList";
	root.list[0] = parser.prototype.tree_Stmt(tokens);
	if(root.list[0].tokenNum < tokens.length)//防范越界
	{
		try
		{
			if(tokens[root.list[0].tokenNum].type != "TOKEN_OP_NEWLINE"
			&& tokens[root.list[0].tokenNum].type != "TOKEN_OP_DEDENT"
			&& tokens[root.list[0].tokenNum].type != "TOKEN_OP_INDENT")
				throw  "line " + tokens[0].line + " starts with illegal token\n";
			else if(tokens[root.list[0].tokenNum].type == "TOKEN_OP_NEWLINE")
				root.list[1] = '\n';
			else
			{
				root.tokenNum = root.list[0].tokenNum;
				
				return root;
			}
		}
		catch(error)
		{
			document.getElementById("result").value += error;	
		}	
		root.list[2] = parser.prototype.tree_StmtList(tokens.slice(root.list[0].tokenNum + 1));
		root.tokenNum = root.list[0].tokenNum + root.list[2].tokenNum + 1;
		
		return root;
	}
	else
	{
		root.tokenNum = root.list[0].tokenNum;
		
		return root;
	}
}

//<Stmt> -> <Assignment> | <Conditional> | <Iteration> | <DefFunc> | <FuncCall> | <endloop>|<global>|<return>|e
parser.prototype.tree_Stmt = function(tokens)
{
	var root = new treeNode();
	root.type = "Stmt";		
	switch (tokens[0].type)
	{
		case 'TOKEN_RSRVD_GLOBAL'	: root.list[0] = parser.prototype.tree_global(tokens)	  ;	 break;
		case 'TOKEN_RSRVD_BREAK'	: root.list[0] = parser.prototype.tree_endloop(tokens)	  ;	 break;
		case 'TOKEN_RSRVD_CONTINUE'	: root.list[0] = parser.prototype.tree_endloop(tokens)	  ;	 break;
		case 'TOKEN_RSRVD_DEF'		: root.list[0] = parser.prototype.tree_DefFunc(tokens)	  ;	 break;
		case 'TOKEN_RSRVD_FOR'		: root.list[0] = parser.prototype.tree_Iteration(tokens)  ;	 break;
		case 'TOKEN_RSRVD_WHILE'	: root.list[0] = parser.prototype.tree_Iteration(tokens)  ;	 break;
		case 'TOKEN_RSRVD_IF'		: root.list[0] = parser.prototype.tree_Conditional(tokens);	 break;
		case 'TOKEN_RSRVD_ELIF'		: root.list[0] = parser.prototype.tree_Conditional(tokens);	 break;
		case 'TOKEN_RSRVD_ELSE'		: root.list[0] = parser.prototype.tree_Conditional(tokens);	 break;
		case 'TOKEN_RSRVD_RETURN'	: root.list[0] = parser.prototype.tree_return(tokens)	  ;	 break;
		case 'TOKEN_VAR_VARNAME'	: 
		{
			root.list[0] = parser.prototype.tree_Var(tokens);
			if(tokens[root.list[0].tokenNum].value == '=')
			{
				root.list[0] = parser.prototype.tree_Assignment(tokens);
			}
			else
			{
				root.list[0] = parser.prototype.tree_FuncCall(tokens);
			}
			break;
		}	
		default : root.list[0] = '';
	}
	if(root.list[0] == '')
		root.tokenNum = 0;
	else
		root.tokenNum = root.list[0].tokenNum;
	return root;
}

//<global>->global <varname>
//**Error Detection
parser.prototype.tree_global = function(tokens)
{
	var root = new treeNode();
	root.type = "Global";	
	root.list[0] = "global";
	try
	{
		if(1 < tokens.length && tokens[1].type == "TOKEN_VAR_VARNAME")
		{
			root.list[1] = parser.prototype.tree_Var(tokens.slice(1));
		}
		else throw "line " + tokens[0].line + "  global with illegal varname\n";
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}	
	
	root.tokenNum = 1 + root.list[1].tokenNum;	
	return root;
}

//<endloop>->break|continue
parser.prototype.tree_endloop = function(tokens)
{
	var root = new treeNode();
	root.type = "Endloop";	
	if(tokens[0].type == "TOKEN_RSRVD_BREAK")
		root.list[0] = "break";
	if(tokens[0].type == "TOKEN_RSRVD_CONTINUE")
		root.list[0] = "continue";
	root.tokenNum = 1;
	
	return root;
}

//<Assignment> -> <Var> = <Expr>
parser.prototype.tree_Assignment = function(tokens)
{
	var root = new treeNode();
	root.type = "Assignment";	
	root.list[0] = parser.prototype.tree_Var(tokens);
	root.list[1] = "=";				
	root.list[2] = parser.prototype.tree_Expr(tokens.slice(root.list[0].tokenNum + 1));
	
	root.tokenNum = root.list[0].tokenNum + root.list[2].tokenNum + 1;	
	return root;
}

//<Iteration>-> <for> | <while>
parser.prototype.tree_Iteration = function(tokens)
{
	var root = new treeNode();
	root.type = "Iteration";	
	if(tokens[0].type == "TOKEN_RSRVD_FOR")
		root.list[0] = parser.prototype.tree_for(tokens);
	else if(tokens[0].type == "TOKEN_RSRVD_WHILE")
		root.list[0] = parser.prototype.tree_while(tokens);

	root.tokenNum = root.list[0].tokenNum;
	return root;
}

//<DefFunc> ->def <varname>(<Argument>):<indent> <StmtList><unindent>
//**Error Detection
parser.prototype.tree_DefFunc = function(tokens)
{
	var root = new treeNode();
	root.type = "DefFunc";	
	root.list[0] = "def";
	try
	{
		if(1 < tokens.length && tokens[1].type == "TOKEN_VAR_VARNAME")
		{
			root.list[1] = parser.prototype.tree_varname(tokens.slice(1));
		}
		else throw  "line " + tokens[0].line + " def missing varname\n";
		var currentTokenPos = 2;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[2] = "(";		
		}
		else throw  "line " + tokens[0].line + " def missing \"(\"\n";
		root.list[3] = parser.prototype.tree_Argument(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[3].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[4] = ")";		
		}	
		else throw  "line " + tokens[0].line + " def missing \")\"\n";
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[5] = ":";		
		}
		else throw  "line " + tokens[0].line + " def missing \":\"\n";
		root.list[6] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[7] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[7].tokenNum;	
		root.list[8] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}	

	root.tokenNum = 6 + root.list[1].tokenNum + root.list[3].tokenNum + root.list[7].tokenNum;
	return root;
}

//<Argument> -> <Var>{,<Var>} | e
//**Error Detection
parser.prototype.tree_Argument = function(tokens)
{
	var root = new treeNode();
	root.type = "Argument";	
	try
	{
		if(tokens.length > 0 && tokens[0].type != "TOKEN_VAR_VARNAME")
		{
			root.list[0] = "";		
			root.tokenNum = 0;
			
			return root;
		}
		else if(tokens.length > 0 && tokens[0].type == "TOKEN_VAR_VARNAME")
		{
			root.list[0] = parser.prototype.tree_Var(tokens);
			var currentTokenPos = root.list[0].tokenNum;
			var currentListPos = 1;
			while(tokens[currentTokenPos] == "TOKEN_OP_COMMA")
			{		
				root.list[currentListPos++] = ",";
				currentTokenPos++;
				root.list[currentListPos] = parser.prototype.tree_Var(tokens.slice(currentTokenPos));
				currentTokenPos += root.list[currentListPos++].tokenNum;
			}		
			root.tokenNum = currentTokenPos;

			return root;
		}		
		else throw  "line " + tokens[0].line + " def missing \")\"\n";
	}
	catch(error)
	{
		document.getElementById("result").value += error;
	}	
}

//<SubFuncCall> -> <varname>.<varname>(<element>{,<element>} | e){.<varname>(<element>{,<element>} | e)} 
//**Error Detection 
parser.prototype.tree_SubFuncCall = function(tokens)
{
	var root = new treeNode();
	root.type = "SubFuncCall";
	root.list[0] = parser.prototype.tree_Var(tokens);
	
	var currentTokenPos = root.list[0].tokenNum;
	var currentListPos = 1;
	try
	{
		while(typeof(tokens[currentTokenPos]) !='undefined' && tokens[currentTokenPos].type == "TOKEN_OP_CHILD")
		{
			root.list[currentListPos++] = ".";
			currentTokenPos += 1;
			root.list[currentListPos] = parser.prototype.tree_varname(tokens.slice(currentTokenPos));
			currentTokenPos += root.list[currentListPos++].tokenNum;
			
			if(currentTokenPos < tokens.length && tokens[currentTokenPos].type == "TOKEN_OP_PR")
			{		
				root.list[currentListPos++] = "(";	
				currentTokenPos += 1;
			}	
			else throw  "line " + tokens[0].line + " SubFuncCall missing \"(\"\n";
			
			if(currentTokenPos < tokens.length && tokens[currentTokenPos].type == "TOKEN_OP_PR")
			{		
				root.list[currentListPos++] = ")";
				currentTokenPos = currentTokenPos + 1;			
			}
			else
			{
				root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
				currentTokenPos += root.list[currentListPos++].tokenNum;
				while(tokens[currentTokenPos].type == "TOKEN_OP_COMMA")
				{		
					currentTokenPos++;
					root.list[currentListPos++] = ",";
					root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
					currentTokenPos += root.list[currentListPos++].tokenNum;
				}
				if(currentTokenPos < tokens.length && tokens[currentTokenPos].type == "TOKEN_OP_PR")
				{		
					root.list[currentListPos++] = ")";
					currentTokenPos = currentTokenPos + 1;			
				}
				else throw  "line " + tokens[0].line + " SubFuncCall missing \")\"\n";
			}
		}
		root.tokenNum = currentTokenPos;		
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}	
	
	return root;
}

//<for> -> for <varname> in <Var>|<string>|<tuple>|<list>|<dictionary>|<range> : <indent> <StmtList> <unindent>
//**Error Detection 
parser.prototype.tree_for = function(tokens)
{
	var root = new treeNode();
	root.type = "For";	
	root.list[0] = "for";
	root.list[1] = parser.prototype.tree_varname(tokens.slice(1));
	var currentTokenPos = 2;
	try
	{
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_RSRVD_IN")
		{
			root.list[2] = "in";		
		}
		else throw  "line " + tokens[0].line + " for missing \"in\"\n";
		switch (tokens[3].type)
		{
			case 'TOKEN_RSRVD_RANGE': root.list[3] = parser.prototype.tree_range(tokens.slice(currentTokenPos))		; break;
			case 'TOKEN_OP_BR'		: root.list[3] = parser.prototype.tree_dictionary(tokens.slice(currentTokenPos)); break;
			case 'TOKEN_OP_BK'		: root.list[3] = parser.prototype.tree_list(tokens.slice(currentTokenPos))		; break;
			case 'TOKEN_OP_PR'		: root.list[3] = parser.prototype.tree_tuple(tokens.slice(currentTokenPos))		; break;
			case 'TOKEN_VAR_STRING'	: root.list[3] = parser.prototype.tree_String(tokens.slice(currentTokenPos))	; break;
			case 'TOKEN_VAR_VARNAME': root.list[3] = parser.prototype.tree_Var(tokens.slice(currentTokenPos));		; break;
			default: throw  "line " + tokens[0].line + " for with invalid container\n";
		}
		currentTokenPos += root.list[3].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[4] = ":";		
		}
		else throw  "line " + tokens[0].line + " for missing \":\"\n";
		root.list[5] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[6] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[6].tokenNum;	
		root.list[7] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));
		
		root.tokenNum = 5 + root.list[1].tokenNum + root.list[3].tokenNum + root.list[6].tokenNum;	
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}
}

//<range> -> range(<element>) | range(<element>,<element>) | range(<element>,<element>,<element>)
//**Error Detection 
parser.prototype.tree_range = function(tokens)
{
	var root = new treeNode();
	root.type = "Range";	
	root.list[0] = "range";	
	try
	{
		if(1 < tokens.length && tokens[1].type == "TOKEN_OP_PR")
		{
			root.list[1] = "(";		
		}	
		else throw  "line " + tokens[0].line + " for, range missing \"(\"\n";
		root.list[2] = parser.prototype.tree_element(tokens.slice(2));
		if(3 < tokens.length && tokens[3].type == "TOKEN_OP_PR")
		{
			root.list[3] = ")";	
			root.tokenNum = 3 + root.list[2].tokenNum;		
		}
		else if(3 < tokens.length && tokens[3].type == "TOKEN_OP_COMMA")
		{
			root.list[3] = ",";
			root.list[4] = parser.prototype.tree_element(tokens.slice(4));		
			if(5 < tokens.length && tokens[5].type == "TOKEN_OP_PR")
			{
				root.list[5] = ")";	
				root.tokenNum = 4 + root.list[2].tokenNum + root.list[4].tokenNum;		
			}
			else if(5 < tokens.length && tokens[5].type == "TOKEN_OP_COMMA")
			{
				root.list[5] = ",";
				root.list[6] = parser.prototype.tree_element(tokens.slice(6));	
				if(7 < tokens.length && tokens[7].type == "TOKEN_OP_PR")
				{
					root.list[7] = ")";				
					root.tokenNum = 5 + root.list[2].tokenNum + root.list[4].tokenNum + root.list[6].tokenNum;
				}			
				else throw  "line " + tokens[0].line + " for, range missing \")\"\n";
			}
			else throw  "line " + tokens[0].line + " for, range missing \")\"\n";
		}
		else throw  "line " + tokens[0].line + " for, range missing \")\"\n";
			
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<while> -> while(<conds>):<indent><StmtList><unindent>
//**Error Detection 
parser.prototype.tree_while = function(tokens)
{
	var root = new treeNode();
	root.type = "While";	
	root.list[0] = "while";
	var currentTokenPos = 1;
	try
	{
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[1] = "(";		
		}
		else throw  "line " + tokens[0].line + " while missing \"(\"\n";
		root.list[2] = parser.prototype.tree_conds(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[2].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[3] = ")";		
		}	
		else throw  "line " + tokens[0].line + " while missing \")\"\n";
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[4] = ":";		
		}
		else throw  "line " + tokens[0].line + " while missing \":\"\n";
		root.list[5] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[6] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[6].tokenNum;	
		root.list[7] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));
		
		root.tokenNum = 6 + root.list[2].tokenNum + root.list[6].tokenNum;	
		return root;
	}
	catch(error)
	{		
		document.getElementById("result").value += error;
	}	
}

//<Conditional>-> <if> {<elif>} <else>|e
parser.prototype.tree_Conditional = function(tokens)
{
	var root = new treeNode();
	root.type = "Conditional";	
	root.list[0] = parser.prototype.tree_if(tokens);
	var currentTokenPos = root.list[0].tokenNum;
	var currentListPos = 1;	
	while(currentTokenPos <tokens.length - 1 
	&& tokens[currentTokenPos].type == "TOKEN_RSRVD_ELIF")
	{
		root.list[currentListPos] = parser.prototype.tree_elif(tokens.slice(currentTokenPos));	
		currentTokenPos += root.list[currentListPos++].tokenNum;
	}	
	if(currentTokenPos <tokens.length - 1 
	&& tokens[currentTokenPos].type == "TOKEN_RSRVD_ELSE")
	{
		root.list[currentListPos] = parser.prototype.tree_else(tokens.slice(currentTokenPos));	
		currentTokenPos += root.list[currentListPos].tokenNum;
	}
	
	root.tokenNum = currentTokenPos;	
	return root;
}

//<if> -> if(<conds>):<indent><StmtList><unindent>
//**Error Detection
parser.prototype.tree_if = function(tokens)
{
	var root = new treeNode();
	root.type = "If";	
	root.list[0] = "if";
	var currentTokenPos = 1;
	try
	{
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[1] = "(";		
		}
		else throw  "line " + tokens[0].line + " if missing \"(\"\n";
		root.list[2] = parser.prototype.tree_conds(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[2].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[3] = ")";		
		}	
		else throw  "line " + tokens[0].line + " if missing \")\"\n";
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[4] = ":";		
		}
		else throw  "line " + tokens[0].line + " if missing \":\"\n";
		root.list[5] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[6] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[6].tokenNum;	
		root.list[7] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));		
		
		root.tokenNum = 6 + root.list[2].tokenNum + root.list[6].tokenNum;
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<elif> -> elif(<conds>):<indent><StmtList><unindent>
//**Error Detection
parser.prototype.tree_elif = function(tokens)
{
	var root = new treeNode();
	root.type = "Elif";	
	root.list[0] = "elif";
	var currentTokenPos = 1;
	try
	{
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[1] = "(";		
		}
		else throw  "line " + tokens[0].line + " if, elif missing \"(\"\n";
		root.list[2] = parser.prototype.tree_conds(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[2].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_PR")
		{
			root.list[3] = ")";		
		}	
		else throw  "line " + tokens[0].line + " if, elif missing \")\"\n";
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[4] = ":";		
		}
		else throw  "line " + tokens[0].line + " if, elif missing \":\"\n";
		root.list[5] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[6] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[6].tokenNum;	
		root.list[7] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));
		
		root.tokenNum = 6 + root.list[2].tokenNum + root.list[6].tokenNum;	
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<else> -> else:<indent><StmtList><unindent>
//**Error Detection
parser.prototype.tree_else = function(tokens)
{
	var root = new treeNode();
	root.type = "Else";	
	root.list[0] = "else";
	var currentTokenPos = 1;
	try
	{		
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
		{
			root.list[1] = ":";		
		}
		else throw  "line " + tokens[0].line + " if, else missing \":\"\n";
		root.list[2] = parser.prototype.tree_indent(tokens.slice(currentTokenPos++));
		root.list[3] = parser.prototype.tree_StmtList(tokens.slice(currentTokenPos));
		currentTokenPos += root.list[3].tokenNum;	
		root.list[4] = parser.prototype.tree_unindent(tokens.slice(currentTokenPos));
		
		root.tokenNum = 4 + root.list[3].tokenNum;
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}	
}

//<indent>:\n,之后每一行起始缩进+1\t或4\s
//**Error Detection
parser.prototype.tree_indent = function(tokens)
{
	var root = new treeNode();
	root.type = "Indent";	
	try
	{
		if(tokens.length > 0 && tokens[0].type == "TOKEN_OP_INDENT")
		{
			root.list[0] = "indent";
			root.tokenNum = 1;
		}
		else throw  "line " + tokens[0].line + " missing INDENT\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}			
}

//<unindent>:\n,之后每一行起始缩进-1\t或4\s
//**Error Detection
parser.prototype.tree_unindent = function(tokens)
{
	var root = new treeNode();
	root.type = "Unindent";	
	try
	{
		if(tokens.length > 0 && tokens[0].type == "TOKEN_OP_DEDENT")
		{
			root.list[0] = "unindent";
			root.tokenNum = 1;
		}
		else throw  "line " + tokens[0].line + " missing DEDENT\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;	
	}	
}

//<conds> -> not <conds> | <cond> | <cond> and <conds> | <cond> or <conds> | (<conds>)
//**Error Detection
parser.prototype.tree_conds = function(tokens)
{
	var root = new treeNode();
	root.type = "Conds";
	try
	{
		if(0 < tokens.length && tokens[0].value == "(")
		{
			root.list[0] = "(";
			root.list[1] = parser.prototype.tree_conds(tokens.slice(1));	
			if(tokens[root.list[1].tokenNum + 1].value == ")")
			{
				root.list[2] = ")";				
			}
			else throw  "line " + tokens[0].line + " condition missing \")\"\n";
			
			root.tokenNum = 2 + root.list[1].tokenNum;
			return root;
		}
		if(0 < tokens.length && tokens[0].type == "TOKEN_RSRVD_NOT")
		{
			root.list[0] = "not";
			root.list[1] = parser.prototype.tree_conds(tokens.slice(1));
			root.tokenNum = 1 + root.list[1].tokenNum;
		}
		else 		
		{
			root.list[0] = parser.prototype.tree_cond(tokens);
			if(root.list[0].tokenNum < tokens.length && tokens[root.list[0].tokenNum].type == "TOKEN_RSRVD_AND")
			{
				root.list[1] = "and";
				root.list[2] = parser.prototype.tree_conds(tokens.slice(1 + root.list[0].tokenNum));
				root.tokenNum = root.list[0].tokenNum + root.list[2].tokenNum + 1;
			}
			else if(root.list[0].tokenNum < tokens.length && tokens[root.list[0].tokenNum].type == "TOKEN_RSRVD_OR")
			{
				root.list[1] = "or";
				root.list[2] = parser.prototype.tree_conds(tokens.slice(1 + root.list[0].tokenNum));	
				root.tokenNum = root.list[0].tokenNum + root.list[2].tokenNum + 1;			
			}
			else
				root.tokenNum = root.list[0].tokenNum;			
		}
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<cond> -> not <cond> | <equation> <ConOperand> <equation> | <equation>
parser.prototype.tree_cond = function(tokens)
{
	var root = new treeNode();
	root.type = "Cond";	
	if(tokens[0].type == "TOKEN_RSRVD_NOT")
	{
		root.list[0] = "not";
		root.list[1] = parser.prototype.tree_cond(tokens.slice(1));
		root.tokenNum = 1 + root.list[1].tokenNum;
	}
	else
	{
		var i = 0;
		var FirstConOperandPos = -1;
		var entrypr = 0, entrybr = 0, entrybk = 0;
		while(i < tokens.length //越界危险
		&& tokens[i].type != "TOKEN_OP_NEWLINE"
		&& tokens[i].type != "TOKEN_OP_DEDENT"
		&& tokens[i].type != "TOKEN_OP_INDENT")
		{
			if(tokens[i].value == "(" || tokens[i].value == "[" || tokens[i].value == "{")
			{
				if(tokens[i].value == "(")
					entrypr = 1;
				else if(tokens[i].value == "[")
					entrybr = 1;
				else if(tokens[i].value == "{")
					entrybk = 1;
				i++;
				while(i < tokens.length
				&& (entrypr != 0 || entrybr != 0 || entrybk != 0)
				&& tokens[i].type != "TOKEN_OP_NEWLINE"
				&& tokens[i].type != "TOKEN_OP_DEDENT"
				&& tokens[i].type != "TOKEN_OP_INDENT")
				{
					if(tokens[i].value == "(")
						entrypr++;
					else if(tokens[i].value == "[")
						entrybr++;
					else if(tokens[i].value == "{")
						entrybk++;
					else if(tokens[i].value == ")")
						entrypr--;
					else if(tokens[i].value == "]")
						entrybr--;
					else if(tokens[i].value == "}")
						entrybk--;
					i++;
				}				
				//括号未对齐
				if(i == tokens.length
				|| tokens[i].type == "TOKEN_OP_NEWLINE"
				|| tokens[i].type == "TOKEN_OP_DEDENT"
				|| tokens[i].type == "TOKEN_OP_INDENT")
				{
					if(entrypr != 0)
						throw  "line " + tokens[0].line + " Terms missing \")\"\n"; 
					else if(entrybr != 0)
						throw  "line " + tokens[0].line + " Terms missing \"]\"\n"; 
					else if(entrybk != 0)
						throw  "line " + tokens[0].line + " Terms missing \"}\"\n";
					break;
				}
			}
			if(i < tokens.length && tokens[i].type == "TOKEN_OP_CMP")
			{
				FirstConOperandPos = i;
				break;
			}
			i++;
		}		
		//<cond> -> <equation> <ConOperand> <equation> 
		if(FirstConOperandPos > 0)
		{
			root.list[0] = parser.prototype.tree_equation(tokens.slice(0, FirstConOperandPos));
			root.list[1] = parser.prototype.tree_ConOperand(tokens.slice(FirstConOperandPos, FirstConOperandPos + 1));
			root.list[2] = parser.prototype.tree_equation(tokens.slice(FirstConOperandPos + 1));
			root.tokenNum = 1 + root.list[0].tokenNum + root.list[2].tokenNum;
		}
		//<cond> -> <equation>
		else
		{
			root.list[0] = parser.prototype.tree_equation(tokens);			
			root.tokenNum = root.list[0].tokenNum;
		}		
	}
	
	return root;
}

//<ConOperand> -> == | != | >= | > | <= | <
//**Error Detection
parser.prototype.tree_ConOperand = function(tokens)
{
	var root = new treeNode();
	root.type = "ConOperand";	
	try
	{
		if(0 < tokens.length 
		&& (tokens[0].value == "=="
			|| tokens[0].value == "!="
			|| tokens[0].value == ">="
			|| tokens[0].value == ">"
			|| tokens[0].value == "<="
			|| tokens[0].value == "=="
			|| tokens[0].value == "<"))
		{
			root.list[0] = tokens[0].value;
			root.tokenNum = 1;				
		}
		else throw  "line " + tokens[0].line + " invalid Conditional operator\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}		
}

//<Expr> -> <Terms> | <Assignment>
parser.prototype.tree_Expr = function(tokens)
{
	var root = new treeNode();
	root.type = "Expr";	
	var i = 0;
	while(i < tokens.length 
	&& tokens[i].type != "TOKEN_OP_NEWLINE"
	&& tokens[i].type != "TOKEN_OP_DEDENT"
	&& tokens[i].type != "TOKEN_OP_INDENT")
	{
		if(tokens[i].type == "TOKEN_OP_ASSIGN")
		{
			root.list[0] = parser.prototype.tree_Assignment(tokens);
			break;
		}
		i++;
	}
	if(i == tokens.length 
	|| tokens[i].type == "TOKEN_OP_NEWLINE"
	|| tokens[i].type == "TOKEN_OP_DEDENT"
	|| tokens[i].type == "TOKEN_OP_INDENT")
	{
		root.list[0] = parser.prototype.tree_equation(tokens);			
	}
	
	root.tokenNum = root.list[0].tokenNum;	
	return root;
}

//<Var> -><varname>|<listdic>
parser.prototype.tree_Var = function(tokens)
{
	var root = new treeNode();
	root.type = "Var";	
	if(tokens.length > 1 && tokens[1].value == "[")//越界危险
	{
		root.list[0] = parser.prototype.tree_listdic(tokens);
	}
	else
	{
		root.list[0] = parser.prototype.tree_varname(tokens);		
	}
	
	root.tokenNum = root.list[0].tokenNum;	
	return root;
}

//<varname> -> [A-Za-z_][A-za-z0-9_]*
//**Error Detection
parser.prototype.tree_varname = function(tokens)
{
	var root = new treeNode();
	root.type = "Varname";
	try
	{
		if(0 < tokens.length && tokens[0].type == "TOKEN_VAR_VARNAME")
		{			
			root.list[0] = tokens[0].value;
			root.tokenNum = 1;	
		}
		else throw  "line " + tokens[0].line + " invalid varname\n";
		
		return root;		
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<listdic>-><Var>[<element>]
//**Error Detection
parser.prototype.tree_listdic = function(tokens)
{
	var root = new treeNode();
	root.type = "Listdic";
	var i = 0;
	var LastLeft_BK_Pos = 0;	
	try
	{
		while(i < tokens.length //越界危险
		&& tokens[i].type != "TOKEN_OP_NEWLINE"
		&& tokens[i].type != "TOKEN_OP_DEDENT"
		&& tokens[i].type != "TOKEN_OP_INDENT")
		{
			if(tokens[i].value == "[")
			{
				LastLeft_BK_Pos = i;
				i++;
				var entry = 1;
				while(i < tokens.length //越界危险
				&& tokens[i].type != "TOKEN_OP_NEWLINE"
				&& tokens[i].type != "TOKEN_OP_DEDENT"
				&& tokens[i].type != "TOKEN_OP_INDENT")
				{
					if(tokens[i].value == "[")
						entry++;
					else if(tokens[i].value == "]")
						entry--;
					if(entry == 0)
						break;
					i++;
				}
				//括号未对齐
				if(entry != 0 
				&&(i < tokens.length
					|| tokens[i].type == "TOKEN_OP_NEWLINE"
					|| tokens[i].type == "TOKEN_OP_DEDENT"
					|| tokens[i].type == "TOKEN_OP_INDENT"))
				throw  "line " + tokens[0].line + " listdic missing \"]\"\n"; 
				if((i + 1 >= tokens.length) || (tokens[i + 1].value != "["))
				{
					break;
				}
				else
				{
					LastLeft_BK_Pos = i + 1;
				}
			}
			i++;
		}
		root.list[0] = parser.prototype.tree_Var(tokens.slice(0, LastLeft_BK_Pos));
		var currentTokenPos = root.list[0].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_BK")
		{
			root.list[1] = "[";
		}
		else throw  "line " + tokens[0].line + " listdic missing \"[\"\n";
		root.list[2] = parser.prototype.tree_element(tokens.slice(LastLeft_BK_Pos+1));
		currentTokenPos += root.list[2].tokenNum;
		if(currentTokenPos < tokens.length && tokens[currentTokenPos++].type == "TOKEN_OP_BK")
		{
			root.list[3] = "]";
		}
		else throw  "line " + tokens[0].line + " listdic missing \"]\"\n";
		
		root.tokenNum = 2 + root.list[0].tokenNum + root.list[2].tokenNum;	
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<element> -> <const>|<equation>|<tuple>|<list>|<dictionary>
parser.prototype.tree_element = function(tokens)
{
	var root = new treeNode();
	root.type = "Element";	
	if(tokens[0].type == "TOKEN_VAR_INTNUM" 
	|| tokens[0].type == "TOKEN_VAR_FLOATNUM" 
	|| tokens[0].type == "TOKEN_VAR_STRING")
	   root.list[0] = parser.prototype.tree_const(tokens);	
	else if(tokens[0].type == "TOKEN_OP_BK")
	   root.list[0] = parser.prototype.tree_list(tokens);		
	else if(tokens[0].type == "TOKEN_OP_PR")
	   root.list[0] = parser.prototype.tree_tuple(tokens);	
	else if(tokens[0].type == "TOKEN_OP_BR")
	   root.list[0] = parser.prototype.tree_dictionary(tokens);
	else 
	   root.list[0] = parser.prototype.tree_equation(tokens);
	
	root.tokenNum = root.list[0].tokenNum;
	return root;
}

//<equation> -><Terms>
parser.prototype.tree_equation = function(tokens)
{	
	var root = new treeNode();
	root.type = "Equation";
	root.list[0] = parser.prototype.tree_Terms(tokens);
	root.tokenNum = root.list[0].tokenNum;
	return root;
}

//<Terms> -> <Terms> <Operand> <Term> | <Terms> <Operand> (<Terms>) | <Term> | (<Terms>)
//**Error Detection
parser.prototype.tree_Terms = function(tokens)
{
	var root = new treeNode();
	root.type = "Terms";
	var LastOperandPos = 0;
	var i = 0;
	try
	{
		//Terms第一个token为“(”时，有两种情况：括号包含整个Terms；括号包含前一部分。区分这两种情况：
		if(tokens[0].value == "(")
		{
			var entrypr = 1, entrybr = 0, entrybk = 0;
			var tuple = 0;
			i = 1;
			while(i < tokens.length //越界危险
			&& entrypr != 0
			&& tokens[i].type != "TOKEN_OP_NEWLINE"
			&& tokens[i].type != "TOKEN_OP_DEDENT"
			&& tokens[i].type != "TOKEN_OP_INDENT")
			{
				if(tokens[i].value == "(")
					entrypr++;
				else if(tokens[i].value == "[")
					entrybr++;
				else if(tokens[i].value == "{")
					entrybk++;
				else if(tokens[i].value == ")")
					entrypr--;
				else if(tokens[i].value == "]")
					entrybr--;
				else if(tokens[i].value == "}")
					entrybk--;
				else if(tokens[i].type == "TOKEN_OP_COMMA" 
					&& entrypr == 1 && entrybr == 0 && entrybk == 0)
					tuple = 1;
				i++;
			}
			//括号未对齐
			if(entrypr != 0 
			&&(i == tokens.length
				|| tokens[i].type == "TOKEN_OP_NEWLINE"
				|| tokens[i].type == "TOKEN_OP_DEDENT"
				|| tokens[i].type == "TOKEN_OP_INDENT"))
			throw  "line " + tokens[0].line + " Terms missing \")\"\n"; 
			if(tuple != 1)
			{
				if(i < tokens.length && tokens[i].type == "TOKEN_OP_EXE")	
				{
					LastOperandPos = i;
				}		
				else//括号包含整个Terms
				{
					root.list[0] = "(";
					root.list[1] = parser.prototype.tree_Terms(tokens.slice(1));	
					if(root.list[1].tokenNum + 1 < tokens.length && tokens[root.list[1].tokenNum + 1].value == ")")
						root.list[2] = ")";
					else throw  "line " + tokens[0].line + " Terms missing \")\"\n";					
				
					root.tokenNum = 2 + root.list[1].tokenNum;
					return root;
				}		
			}
		}
		
		i = LastOperandPos;
		var entrypr = 0, entrybr = 0, entrybk = 0;
		while(i < tokens.length //越界危险
		&& tokens[i].type != "TOKEN_OP_NEWLINE"
		&& tokens[i].type != "TOKEN_OP_DEDENT"
		&& tokens[i].type != "TOKEN_OP_INDENT")
		{
			if(tokens[i].value == "("||tokens[i].value == "["||tokens[i].value == "{")
			{
				if(tokens[i].value == "(")
					entrypr = 1;
				else if(tokens[i].value == "[")
					entrybr = 1;
				else if(tokens[i].value == "{")
					entrybk = 1;
				i++;
				while(i < tokens.length
				&& (entrypr != 0 || entrybr != 0 || entrybk != 0)
				&& tokens[i].type != "TOKEN_OP_NEWLINE"
				&& tokens[i].type != "TOKEN_OP_DEDENT"
				&& tokens[i].type != "TOKEN_OP_INDENT")
				{
					if(tokens[i].value == "(")
						entrypr++;
					else if(tokens[i].value == "[")
						entrybr++;
					else if(tokens[i].value == "{")
						entrybk++;
					else if(tokens[i].value == ")")
						entrypr--;
					else if(tokens[i].value == "]")
						entrybr--;
					else if(tokens[i].value == "}")
						entrybk--;
					i++;
				}				
				//括号未对齐
				if(i == tokens.length
				|| tokens[i].type == "TOKEN_OP_NEWLINE"
				|| tokens[i].type == "TOKEN_OP_DEDENT"
				|| tokens[i].type == "TOKEN_OP_INDENT")
				{
					if(entrypr != 0)
						throw  "line " + tokens[0].line + " Terms missing \")\"\n"; 
					else if(entrybr != 0)
						throw  "line " + tokens[0].line + " Terms missing \"]\"\n"; 
					else if(entrybk != 0)
						throw  "line " + tokens[0].line + " Terms missing \"}\"\n";
					break;
				}
			}
			if(i < tokens.length && tokens[i].type == "TOKEN_OP_EXE")
			{
				LastOperandPos = i;
			}
			i++;
		}
		if(LastOperandPos == 0)
		{		
			root.list[0] = parser.prototype.tree_Term(tokens);
			root.tokenNum = root.list[0].tokenNum;	
		}
		else	
		{	
			root.list[0] = parser.prototype.tree_Terms(tokens.slice(0, LastOperandPos));
			root.list[1] = parser.prototype.tree_Operand(tokens.slice(LastOperandPos));
			//(<Terms>)
			if(LastOperandPos + 1 < tokens.length && tokens[LastOperandPos + 1].type == "TOKEN_OP_PR")
			{		
				var entrypr = 1, entrybr = 0, entrybk = 0;
				var tuple = 0;
				i = LastOperandPos + 2;
				while(i < tokens.length //越界危险
				&& entrypr != 0
				&& tokens[i].type != "TOKEN_OP_NEWLINE"
				&& tokens[i].type != "TOKEN_OP_DEDENT"
				&& tokens[i].type != "TOKEN_OP_INDENT")
				{
					if(tokens[i].value == "(")
						entrypr++;
					else if(tokens[i].value == "[")
						entrybr++;
					else if(tokens[i].value == "{")
						entrybk++;
					else if(tokens[i].value == ")")
						entrypr--;
					else if(tokens[i].value == "]")
						entrybr--;
					else if(tokens[i].value == "}")
						entrybk--;
					else if(tokens[i].type == "TOKEN_OP_COMMA" 
							&& entrypr == 1 
							&& entrybr == 0 
							&& entrybk == 0)
						tuple = 1;
					i++;
				}
				//括号未对齐
				if(entrypr != 0 
				&&(i == tokens.length
					|| tokens[i].type == "TOKEN_OP_NEWLINE"
					|| tokens[i].type == "TOKEN_OP_DEDENT"
					|| tokens[i].type == "TOKEN_OP_INDENT"))
				{
					throw  "line " + tokens[0].line + " Terms missing \")\"\n"; 						
				}
				if(tuple == 1)
				{
					root.list[2] = parser.prototype.tree_Term(tokens.slice(LastOperandPos + 1));
					root.tokenNum = root.list[0].tokenNum + root.list[1].tokenNum+ root.list[2].tokenNum;	
				}
				else
				{
					root.list[2] = "(";
					root.list[3] = parser.prototype.tree_Terms(tokens.slice(root.list[0].tokenNum + 2, tokens.length - 1));	
					if(root.list[1].tokenNum + root.list[3].tokenNum + 2 < tokens.length
					&& tokens[root.list[1].tokenNum + root.list[3].tokenNum + 2].value == ")")
						root.list[4] = ")";
						else throw  "line " + tokens[0].line + " Terms missing \")\"\n"; 
					root.tokenNum = root.list[0].tokenNum + root.list[3].tokenNum + 3;   
				}   
				return root;
			}
			else
			{
				root.list[2] = parser.prototype.tree_Term(tokens.slice(LastOperandPos + 1));
				root.tokenNum = root.list[0].tokenNum + root.list[1].tokenNum+ root.list[2].tokenNum;	
			}	
		}
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<Operand> -> + | - | * | / | // | ** | %
//**Error Detection
parser.prototype.tree_Operand = function(tokens)
{
	var root = new treeNode();
	root.type = "Operand";
	try
	{
		if(0 < tokens.length 
		&& (tokens[0].value == "+"
			|| tokens[0].value == "-"
			|| tokens[0].value == "*"
			|| tokens[0].value == "/"
			|| tokens[0].value == "//"
			|| tokens[0].value == "**"
			|| tokens[0].value == "%"))
		{			
			root.list[0] = tokens[0].value;
			
			root.tokenNum = 1;				
			return root;
		}
		else throw  "line " + tokens[0].line + " invalid Operator\n";
		
		return root;		
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<Term> -> <Var> | <FuncCall> | <const> | <list> | <tuple> |<dictionary>
parser.prototype.tree_Term = function(tokens)
{
	var root = new treeNode();
	root.type = "Term";	
	if(tokens[0].type == "TOKEN_VAR_INTNUM"	
	|| tokens[0].type == "TOKEN_VAR_FLOATNUM"
	|| tokens[0].type == "TOKEN_VAR_STRING")
		root.list[0] = parser.prototype.tree_const(tokens);
	else if(tokens[0].type == "TOKEN_OP_BK")
		root.list[0] = parser.prototype.tree_list(tokens);		
	else if(tokens[0].type == "TOKEN_OP_PR")
		root.list[0] = parser.prototype.tree_tuple(tokens);	
	else if(tokens[0].type == "TOKEN_OP_BR")
		root.list[0] = parser.prototype.tree_dictionary(tokens);
	else 
	{
		root.list[0] = parser.prototype.tree_Var(tokens);
		if(root.list[0].tokenNum < tokens.length &&
		(tokens[root.list[0].tokenNum].value == "("	|| tokens[root.list[0].tokenNum].type == "TOKEN_OP_CHILD"))
		{
			root.list[0] = parser.prototype.tree_FuncCall(tokens);
		}		
	}
		
	root.tokenNum = root.list[0].tokenNum;   
	return root;
}

//<dictionary>->{e|<element>:<element>{,<element>:<element>}}
//**Error Detection
parser.prototype.tree_dictionary = function(tokens)
{
	var root = new treeNode();
	root.type = "Dictionary";
	root.list[0] = "{";	
	try
	{
		if(1 < tokens.length && tokens[1].type == "TOKEN_OP_BR")
		{
			root.list[1] = "}";	
			root.tokenNum = 2;
		
			return root;
		}
		root.list[1] = parser.prototype.tree_element(tokens.slice(1));
		if(root.list[1].tokenNum + 1 < tokens.length 
		&& tokens[root.list[1].tokenNum + 1].type == "TOKEN_OP_COLON")
		{
			root.list[2] = ":";		
		}
		else throw  "line " + tokens[0].line + " dictionary missing \":\"\n";	

		root.list[3] = parser.prototype.tree_element(tokens.slice(root.list[1].tokenNum + 2));
		var currentTokenPos = root.list[1].tokenNum + root.list[3].tokenNum + 2;
		var currentListPos = 4;
		while(tokens[currentTokenPos].type == "TOKEN_OP_COMMA")
		{		
			currentTokenPos++;
			root.list[currentListPos++] = ",";
			root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
			currentTokenPos += root.list[currentListPos++].tokenNum;
			if(currentTokenPos < tokens.length 
			&& tokens[currentTokenPos++].type == "TOKEN_OP_COLON")
			{
				root.list[currentListPos++] = ":";					
			}
			else throw  "line " + tokens[0].line + " dictionary missing \":\"\n";
			root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
			currentTokenPos += root.list[currentListPos++].tokenNum;
		}	
		if(currentTokenPos < tokens.length 
		&& tokens[currentTokenPos].type == "TOKEN_OP_BR")
		{
			root.list[currentListPos] = "}";		
		}
		else throw  "line " + tokens[0].line + " dictionary missing \"}\"\n";
		root.tokenNum = currentTokenPos + 1;
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<Func> -><varname>(<element>{,<element>} | e)
//**Error Detection
parser.prototype.tree_Func = function(tokens)
{
	var root = new treeNode();
	root.type = "Func";
	root.list[0] = parser.prototype.tree_varname(tokens);
	try
	{
		if(root.list[0].tokenNum < tokens.length 
		&& tokens[root.list[0].tokenNum].value == "(")
		{		
			root.list[1] = "(";	
		}	
		else throw  "line " + tokens[0].line + " function call missing \"(\"\n";
		if(2 < tokens.length && tokens[2].value == ")")
		{
			root.list[2] = ")";
			root.tokenNum = root.list[0].tokenNum + 2;			
		}
		else
		{
			root.list[2] = parser.prototype.tree_element(tokens.slice(2));
			var currentTokenPos = root.list[0].tokenNum + root.list[2].tokenNum + 1;
			var currentListPos = 3;
			while(tokens[currentTokenPos].type == "TOKEN_OP_COMMA")
			{		
				currentTokenPos++;
				root.list[currentListPos++] = ",";
				root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
				currentTokenPos += root.list[currentListPos++].tokenNum;
			}
			if(currentTokenPos < tokens.length && tokens[currentTokenPos].type == "TOKEN_OP_PR")
			{		
				root.list[currentListPos] = ")";
				root.tokenNum = currentTokenPos + 1;			
			}
			else throw  "line " + tokens[0].line + " function call missing \")\"\n";
		}
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}			

//<FuncCall> -> <Func>|<SubFuncCall>
parser.prototype.tree_FuncCall = function(tokens)
{
	var root = new treeNode();
	root.type = "FuncCall";
	var i = 0;
	root.list[0] = parser.prototype.tree_Var(tokens);
	if(root.list[0].tokenNum < tokens.length && tokens[root.list[0].tokenNum].value == '.')
	{
		root.list[0] = parser.prototype.tree_SubFuncCall(tokens);
	 	root.tokenNum = root.list[0].tokenNum;
	}
	else
	{
		root.list[0] = parser.prototype.tree_Func(tokens);
	 	root.tokenNum = root.list[0].tokenNum;
	}
	return root;
}

//<tuple> ->(<element>{,<element>})
//**Error Detection
parser.prototype.tree_tuple = function(tokens)
{
	var root = new treeNode();
	root.type = "Tuple";	
	root.list[0] = "(";
	root.list[1] = parser.prototype.tree_element(tokens.slice(1));
	var currentTokenPos = root.list[1].tokenNum + 1;
	var currentListPos = 2;
	try
	{
		while(tokens[currentTokenPos].type == "TOKEN_OP_COMMA")
		{		
			currentTokenPos++;
			root.list[currentListPos++] = ",";
			root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
			currentTokenPos += root.list[currentListPos++].tokenNum;
		}		
		if(currentTokenPos < tokens.length && tokens[currentTokenPos].type == "TOKEN_OP_PR")
		{		
			root.list[currentListPos] = ")";
			root.tokenNum = currentTokenPos + 1;			
		}
		else throw  "line " + tokens[0].line + " tuple missing \")\"\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<list> -> [e|<element>{,<element>}]
//**Error Detection
parser.prototype.tree_list = function(tokens)
{
	var root = new treeNode();
	root.type = "List";	
	root.list[0] = "[";	
	try
	{
		if(1 < tokens.length && tokens[1].value == "]")
		{
			root.list[1] = "]";	
			root.tokenNum = 2;
		
			return root;
		}
		root.list[1] = parser.prototype.tree_element(tokens.slice(1));
		var currentTokenPos = root.list[1].tokenNum + 1;
		var currentListPos = 2;
		while(tokens[currentTokenPos].type == "TOKEN_OP_COMMA")
		{		
			currentTokenPos++;
			root.list[currentListPos++] = ",";
			root.list[currentListPos] = parser.prototype.tree_element(tokens.slice(currentTokenPos));
			currentTokenPos += root.list[currentListPos++].tokenNum;
		}		
		if(tokens[currentTokenPos].type == "TOKEN_OP_BK")
		{		
			root.list[currentListPos] = "]";
			root.tokenNum = currentTokenPos + 1;			
		}
		else throw  "line " + tokens[0].line + " list missing \"]\"\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<const> -><number>|<String>
//**Error Detection
parser.prototype.tree_const = function(tokens)
{
	var root = new treeNode();
	root.type = "Const";
	try
	{
		if(0 < tokens.length && tokens[0].type == "TOKEN_VAR_INTNUM"
		|| tokens[0].type == "TOKEN_VAR_FLOATNUM")
		   root.list[0] = parser.prototype.tree_number(tokens);
		else if(0 < tokens.length && tokens[0].type == "TOKEN_VAR_STRING")
		   root.list[0] = parser.prototype.tree_String(tokens);	   
		else throw  "line " + tokens[0].line + " invalid const\n";
		
		root.tokenNum = root.list[0].tokenNum;
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<number> -> (0x|0b|0)?[0-9]+(\.[0-9]+)?
//**Error Detection
parser.prototype.tree_number = function(tokens)
{
	var root = new treeNode();
	root.type = "Number";
	try
	{
		if(0 < tokens.length 
		&& (tokens[0].type == "TOKEN_VAR_INTNUM" || tokens[0].type == "TOKEN_VAR_FLOATNUM"))
		{
			root.list[0] = tokens[0].value;
			root.tokenNum = 1;			
		}  
		else throw  "line " + tokens[0].line + " invalid number\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}

//<String> -> ("|')[.]*("|')
//**Error Detection
parser.prototype.tree_String = function(tokens)
{
	var root = new treeNode();
	root.type = "String";	
	try
	{
		if(0 < tokens.length && tokens[0].type == "TOKEN_VAR_STRING")
		{
			root.list[0] = tokens[0].value;
			root.tokenNum = 1;
		}
		else throw  "line " + tokens[0].line + " invalid String\n";
		
		return root;
	}
	catch(error)
	{
		document.getElementById("result").value += error;		
	}
}	

//<return>->return <element> | e
parser.prototype.tree_return = function(tokens)
{
	var root = new treeNode();
	root.type = "Return";	
	root.list[0] = "return";
	
	if(tokens[1].type == "TOKEN_OP_DEDENT"
	&& tokens[1].type == "TOKEN_OP_NEWLINE")//return后为换行，说明return为空
	{
		root.tokenNum = 1;	
		return root;
	}
		
	root.list[1] = parser.prototype.tree_element(tokens.slice(1));
	
	root.tokenNum = 1 + root.list[1].tokenNum;	
	return root;
}
