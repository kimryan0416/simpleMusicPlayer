function simAjax(params, callback, errorCallback = null, printLog=false, returnType = 'application/json') {
	var url = params.url;
	var type = (params.type) ? params.type : 'POST';
	var data = (params.data) ? params.data : {};
	var contentType = (params.contentType) ? params.contentType : 'application/json';	// the format we're sending the data to.
	var dataType = (params.dataType) ? params.dataType : 'application/json';	// The format of the data we'ere receiving
	var dataToSend = (contentType == 'application/json' && typeof data === 'object') ? JSON.stringify(data) : encodeURI(data);
	
	var xhr = new XMLHttpRequest();
	xhr.open(type,url);
	xhr.setRequestHeader('Content-Type', contentType);
	xhr.onload = function() {
		if (xhr.status === 200) {
			var response = (dataType == 'application/json') ? JSON.parse(xhr.responseText) : xhr.responseText;
			console.log(response);
			if (dataType == 'application/json') {
				if (response.success) callback(response);
				else if (errorCallback != null) errorCallback(response);
				else alert(response.message);
			}
			else callback(response);
		}
		else {
			alert('XMLHttpRequest Error:\n'+url+'\n'+xhr.status);
		}
	};
	xhr.send(dataToSend);
}