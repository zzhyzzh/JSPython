var varname = /^[a-zA-Z_](\w|\\n)*$/g;
var intNum = /^[0-9]+$/g;
var floatNum = /^[0-9]+.[0-9]+$/g;
var str1 = /^(\")[\s\S]*(\")$/g;
var str2 = /^(\')[\s\S]*(\')$/g;
var indent = new Array();
var validline = new Array();
indent.push('');
var RESERVED = 
{
	'if' :       'TOKEN_RSRVD_IF',
	'else' :     'TOKEN_RSRVD_ELSE',
	'elif' :     'TOKEN_RSRVD_ELIF',
	'true'   :   'TOKEN_RSRVD_TRUE',  
    'false'  :   'TOKEN_RSRVD_FALSE',  
    'while'  :   'TOKEN_RSRVD_WHILE',  
    'break'  :   'TOKEN_RSRVD_BREAK',  
    'continue':  'TOKEN_RSRVD_CONTINUE',  
    'def'   :    'TOKEN_RSRVD_DEF',  
    'for'    :   'TOKEN_RSRVD_FOR',
    'in'    :    'TOKEN_RSRVD_IN',
    'and'   :    'TOKEN_RSRVD_AND',
    'or'   :     'TOKEN_RSRVD_OR',
    'not'   :    'TOKEN_RSRVD_NOT',
    'return' :   'TOKEN_RSRVD_RETURN',
    'range' :    'TOKEN_RSRVD_RANGE',
    'global' :    'TOKEN_RSRVD_GLOBAL'
}
//函数名不作为保留字，用函数调用处理

var ops =
{
	'*' :     'TOKEN_OP_EXE',
	'-' :     'TOKEN_OP_EXE',
	'+' :     'TOKEN_OP_EXE',
	'/' :     'TOKEN_OP_EXE',
	'%' :     'TOKEN_OP_EXE',
	'**' :    'TOKEN_OP_EXE',
	'//':     'TOKEN_OP_EXE',
	'|':      'TOKEN_OP_EXE',
	'&':      'TOKEN_OP_EXE',
	'^':      'TOKEN_OP_EXE',
	'~':      'TOKEN_OP_EXE',
	'<<':     'TOKEN_OP_EXE',
	'>>':     'TOKEN_OP_EXE',
	'=' :     'TOKEN_OP_ASSIGN',
	'+=':     'TOKEN_OP_ASSIGN',
	'-=':     'TOKEN_OP_ASSIGN',
	'*=':     'TOKEN_OP_ASSIGN',
	'/=':     'TOKEN_OP_ASSIGN',
	'%=':     'TOKEN_OP_ASSIGN',
	'**=':    'TOKEN_OP_ASSIGN',
	'//=':    'TOKEN_OP_ASSIGN',
	'==':     'TOKEN_OP_CMP',
	'!=':     'TOKEN_OP_CMP',
	'>':      'TOKEN_OP_CMP',
	'<':      'TOKEN_OP_CMP',
	'>=':     'TOKEN_OP_CMP',
	'<=':     'TOKEN_OP_CMP',
	'.':      'TOKEN_OP_CHILD',
	'(':      'TOKEN_OP_PR',
	')':      'TOKEN_OP_PR',
	'{':      'TOKEN_OP_BR',
	'}':      'TOKEN_OP_BR',
	'[':      'TOKEN_OP_BK',
	']':      'TOKEN_OP_BK',
	',':      'TOKEN_OP_COMMA',
	':':      'TOKEN_OP_COLON'
	//'\'':     'TOKEN_OP_SREF',
	//'\"':     'TOKEN_OP_DREF',
}

var lexer = function()
{
	this.stmt = null;
}

lexer.prototype.parse = function(Stmts)
{
	indent = new Array();
	validline = new Array();
	indent.push('');
	var i;
	var stmt;
	var tokens = new Array();
	stmt = '';
	var tmp = lexer.prototype.preprocess(Stmts);
	var newline = new Token();
	newline.value = '\n';
	newline.type = 'TOKEN_OP_NEWLINE';
	var line = 0;
	for(i=0;i<tmp.length;i++)
	{
		if(tmp[i] == '\n')
		{
			line++;
			//tokens.push(lexer.prototype.split(stmt));
			tokens = tokens.concat(lexer.prototype.split(stmt,validline[line-1]));
			tokens.push(newline);
			stmt = '';
			continue;
		}
		else if(i + 1 == tmp.length)
		{
			line++;
			stmt = stmt + tmp[i];

			tokens = tokens.concat(lexer.prototype.split(stmt,validline[line-1]));
			//tokens.push(lexer.prototype.split(stmt));
			
			stmt = '';
			continue;
		}
		stmt = stmt + tmp[i];
	}
	return tokens;
}

lexer.prototype.preprocess = function(stmts) //deal with note and multi-row 
{
	
	var newStmts = '';
	var stmt = '';
	var tmp = '';
	var i,j;
	var index,index2;
	var isNote = 0;
	var line = 0;
	for(i=0;i<stmts.length;i++)
	{
		if(stmts[i] == '\n' || i + 1 == stmts.length && stmts[i] != '\n')
		{
			line++;
			if(i + 1 == stmts.length && stmts[i] != '\n')
			{
				stmt = stmt + stmts[i];
			}

			if((index = stmt.indexOf('#')) >= 0)
			{
				if(index == 0)
				{
					stmt = '';
				}
				else
				{
					stmt = stmt.substring(0,index);
				}	
			}
			tmp = stmt.replace(/(^\s*)|(\s*$)|(^\t*)|(\t*$)/g, '');
			if(tmp.length == 0)
			{
				stmt = '';
				continue;
			}
			if(isNote == 0)
			{

				if(tmp.length >=3 && tmp.substring(0,3) == '\'\'\'')
				{
					if(tmp.length > 3)
					{
						index = tmp.indexOf('\'\'\'',3);
						if(index>0 && index + 3 == tmp.length)
						{
							stmt = '';
						}
						else if(index <0)
						{
							stmt = '';
							isNote = 1;
						}
					}
					else
					{
						stmt = '';
						isNote = 1;
					}
				}

			}
			else
			{
				if((index = tmp.indexOf('\'\'\'')) >= 0) //封闭注释
				{
					if(index + 3 == tmp.length)
					{
						stmt = '';
						isNote = 0;
					}
					else
					{
						isNote = 0;
					}
					
				}
				else
				{
					stmt = '';
				}
			}
			if(stmt.length ==0)
			{
				continue;
			}
			stmt = stmt.replace(/(\s*$)|(\t*$)/g, '');
			newStmts = newStmts + stmt + '\n';
			validline.push(line);
			stmt = '';
		}
		else
		{
			stmt = stmt + stmts[i];
		}
		
	}
	var stack = new Array();
	var sub = '';

	for(i=0;i<newStmts.length;i++)
	{
		if(newStmts[stack[stack.length-1]] == '\'' || newStmts[stack[stack.length-1]] == '\"')
		{
			if(newStmts[i] == newStmts[stack[stack.length-1]])
			{
				index = stack.pop();
				sub = newStmts.substring(index,i);
				sub = sub.replace(/ /g,'（');
				newStmts = newStmts.substring(0,index) + sub + newStmts.substring(i,newStmts.length);

			}
		}
		else if(newStmts[i] == '\'' || newStmts[i] == '\"' || newStmts[i] == '(' || newStmts[i] == '[' ||newStmts[i] == '{')
		{
			stack.push(i);
		}
		else if(newStmts[i] == ')' || newStmts[i] == ']' ||newStmts[i] == '}')
		{
			if(stack.length > 0 && (newStmts[i] ==  ')' && newStmts[stack[stack.length-1]] == '(' 
				|| newStmts[i] ==  ']' && newStmts[stack[stack.length-1]] == '['
				|| newStmts[i] ==  '}' && newStmts[stack[stack.length-1]] == '{'))
			{
				index = stack.pop();
				sub = newStmts.substring(index,i);
				//sub = sub.replace(/\n/g,' ');
				newStmts = newStmts.substring(0,index) + sub + newStmts.substring(i,newStmts.length);
			}
			else
			{
				//syntax error
			}
		}
	}
	if(stack.length>0)
	{
		//syntax error
		//return "syntax error";
	}
	return newStmts;

}

lexer.prototype.split = function(stmt,line)
{

	var i,j,k,start;
	var tokens = new Array();
	var token = new Token();
	token.line = line;
	
	var op = new Token();
	op.line = line;
	var word = '';
	var isStr = 0;
	var cnt = 0;
	start = 0;
	
	if(stmt[0] == ' ' || stmt[0] != ' ' && stmt[0] != '\t')//deal with space indent
	{
		i = 0;
		while(stmt[i] == ' ')
		{
			token.value = token.value + stmt[i];
			i++;
		}
		if(token.value.length > indent[indent.length-1].length)
		{
			indent.push(token.value);
			token.type = 'TOKEN_OP_INDENT';
			cnt++;
		}
		else if(token.value.length < indent[indent.length-1].length)
		{
			
			while(token.value.length < indent[indent.length-1].length)
			{
				indent.pop();
				cnt++;
			}
			if(token.value.length > indent[indent.length-1].length)
			{
				//error message
			}
			token.type = 'TOKEN_OP_DEDENT';
		}
		else
		{
			token.type = 'TOKEN_OP_SPACE';
		}
		if(i!= 0 && stmt[i] == '\t') //error dealing
		{
			//mix tab and space 
			return 'mix tab and space';
		}
		if(i!=0 || token.type== 'TOKEN_OP_DEDENT')
		{
			for(k=0;k<cnt;k++)
			{
				tokens.push(token);
			}
			token = new Token();
			token.line = line;
			start = i;
		}
	}
	else if(stmt[0] == '\t' || stmt[0] != ' ' && stmt[0] != '\t') //deal with tab indent
	{
		i = 0;
		token.type = 'TOKEN_OP_INDENT';
		while(stmt[i] == '\t')
		{
			token.value = token.value + stmt[i];
			i++;
		}
		if(token.value.length > indent[indent.length-1].length)
		{
			indent.push(token.value);
			token.type = 'TOKEN_OP_INDENT';
			cnt++;
		}
		else if(token.value.length < indent[indent.length-1].length)
		{
			while(token.value.length < indent[indent.length-1].length)
			{
				indent.pop();
				cnt++;
			}
			if(token.value.length > indent[indent.length-1].length)
			{
				//error message
			}
			token.type = 'TOKEN_OP_DEDENT';
		}
		else
		{
			token.type = 'TOKEN_OP_SPACE';
		}
		if(i!=0 && stmt[i] == ' ') //error dealing
		{
			//mix tab and space
			return 'mix tab and space';
		}
		if(i!=0 || token.type== 'TOKEN_OP_DEDENT')
		{
			for(k=0;k<cnt;k++)
			{
				tokens.push(token);
			}
			token = new Token();
			token.line = line;
			start = i;
		}
		
	}
	var words = stmt.substring(start,stmt.length);
	var wordlist = words.split(' ');

	for(i=0;i<wordlist.length;i++)
	{
		start = 0;
		var term = wordlist[i];
		if(term == '')
		{
			continue;
		}

		for(j=0;j<term.length;j++)
		{

			if(isStr)
			{
				if(term[j-1] != '\\' && term[j] == '\'' || term[j-1] != '\\' && term[j] == '\"')
				{
					isStr = 0;
				}
			}
			else if(term[j] == '\'' || term[j] == '\"')
			{
				isStr = 1;
			}

			if(isStr)
			{
				//do nothing
			}
			else if(j + 1 == term.length && !(term[j] in ops)) // space split
			{
				word = term.substring(start,j+1);		
			}
			else if(term[j] in ops || term[j] == '!')
			{
				if(j+1!=term.length && term[j] == '.' && term[j-1] >= '0' && term[j-1] <= '9' && term[j+1] >= '0' && term[j+1] <= '9') //float
				{
					continue;
				}
				
				if(j+1!=term.length && term.substring(j,j+2) in ops)  //op length 2
				{
					
					word = term.substring(start,j);
					
					if(j+2!=term.length && term.substring(j,j+3) in ops ) //op length 3 
					{
						op.value = term.substring(j,j+3);
						op.type = ops[op.value];
						j = j + 2;
						start = j + 1;
					}
					else
					{
						op.value = term.substring(j,j+2);
						op.type = ops[op.value];
						j = j + 1;
						start = j + 1;
					}
					

				}
				else if(term[j] != '!')
				{
					op.value = term.substring(j,j+1);
					op.type = ops[op.value];
					word = term.substring(start,j);
					
					
					start = j + 1;
				}
				
			}
			if(word != '')
			{
				//alert(word);
				if(word in RESERVED)
				{
					token.value = word;
					token.type = RESERVED[word];
				}
				else
				{
					if(word.match(varname))
					{
						token.value = word;
						token.type = 'TOKEN_VAR_VARNAME';
					}
					else if(word.match(intNum))
					{
						token.value = word;
						token.type = 'TOKEN_VAR_INTNUM';
					}
					else if(word.match(floatNum))
					{
						token.value = word;
						token.type = 'TOKEN_VAR_FLOATNUM';
					}
					else if(word.match(str1) || word.match(str2))
					{
						word = word.replace(/（/g,' ');
						token.value = word;
						token.type = 'TOKEN_VAR_STRING';
					}
					else //error: no matching
					{
						return "illegal identifier";
					}
				}
				tokens.push(token);
				token = new Token();
				token.line = line;
				word = '';
			}
			if(op.value!= '')
			{
				tokens.push(op);
				op = new Token();
				op.line = line;
			}
		}
	}

	return tokens;

}