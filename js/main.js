function codeSubmit()
{
	var code;
	code = document.getElementById("code").value;
	code.replace('<br/>','\n');
	//debug

	pythonInterpret(code);
}
			
function pythonInterpret(pythonCode)
{
	document.getElementById("result").value = "";
	var output = '';
	var tokens = new Array();
	tokens = (new lexer()).parse(pythonCode);
	var root = new treeNode();
	var tokens_formal = new Array();
	varTable = new Vartable();
	deffunc = new Deffun();	
	localvartable = new Array();
	global = new Array();
	localvartable[0] = varTable;	
	tokens_formal = (new parser()).preprocess(tokens);
	root = (new parser()).tree_Program(tokens_formal);
	(new exc()).execute(root);
	//root为建好的树。没有对应的输出函数，可以设置断点查看root的值。
	//alert("root finish");
	var i,j;
	for(i=0;i<tokens_formal.length;i++)
	{
		output = output + tokens_formal[i].type + ' ';	
	}
				//generate output with pythonCode
	//document.getElementById("result").innerHTML=output;
}

function change(){
	//document.getElementById("code").innerHTML = "";
	var selectedFile = document.getElementById("myfile").files[0];

    var reader = new FileReader();
    var i = 1;

    reader.readAsText(selectedFile);
    reader.onload = function(){
        document.getElementById("code").value = this.result;
    }
   
}