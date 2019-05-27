var uploadScript = {
	form: document.getElementById('add_media_form'),
	fileList: document.getElementById('fileUploadList'),
	numFiles: document.getElementById('numFilesUpload'),
	input: document.getElementById('manualFileSelect'),
	filesToUpload: {},
	countFiles: function( n = null ) {
		uploadScript.numFiles.innerHTML = (n != null && n >= 0) ? n : Object.values(uploadScript.filesToUpload).length;
	},
	removeFiles: function(ids) {
		//ids is an array containing the 'id's of the files they want to remove, with the 'id's being the indexes of the files inside addMediaForm.files object list
		console.log(ids);
		console.log(uploadScript.filesToUpload);
		ids.forEach(id=>{
			uploadScript.filesToUpload[id].HTML.outerHTML = '';
			delete uploadScript.filesToUpload[id];
		});
		uploadScript.countFiles();
		console.log(uploadScript.filesToUpload);
	},
	previewFile: function(file) {
		var name = file.name;
		var modified = file.lastModified;
		var size = file.size;
		var type = file.type;
		var filteredName = name.replace(/[^a-z0-9]/gi,'');
		var typeImage = (type.startsWith('video')) ? 'assets/video.png' : 'assets/audio.png';
		var addMediaItem = make([
			'div',{class:'addMediaItem',id:'addMediaItem_'+size+'|'+filteredName},
			[
				'div',{class:'addMediaArt'},
				['div',{class:'addMediaArtIcon'}]
			],
			[
				'div',{class:'addMediaText'},
				['span',{class:'addMediaTitle'},name],
				['span',{class:'addMediaSize'},formatBytes(size)],
				['span',{class:'addMediaError'}]
			]
		]);
		var cancelElement = make(['span',{class:'button labelButton cancel addMediaItemCancel','data-id':size+'|'+filteredName},'Remove']);
		cancelElement.addEventListener('click',function() {
			var id = this.dataset.id;
			uploadScript.removeFiles([id]);
		});
		addMediaItem.appendChild(cancelElement);
		return addMediaItem;
	},
	updateFiles: function(files) {
		// Processes each file, making sure they are all audio files and checking for errors
		var type, size, modified, name, filteredName, valid, fileObject;
		// Parse through each file
		([...files]).forEach(file=>{
			type = file.type;
			size = file.size;
			modified = file.lastModified;
			name = file.name;
			filteredName = name.replace(/[^a-z0-9]/gi,'');
			valid = type.startsWith('audio');
			if ( !valid ) {
				alert('The following file could not be uploaded:\n"'+name+'"\nReason: File is not an audio file');
				return;
			} else if ( uploadScript.filesToUpload[size+'|'+filteredName] != null ) {
				alert("A file with the same size and name already exist within your list of files - please remove the old version first!");
				return;
			}
			fileObject = {
				'FILE':file,
				'TYPE':type,
				'HTML':uploadScript.previewFile(file)
			};
			uploadScript.fileList.appendChild(fileObject.HTML);
			uploadScript.filesToUpload[size+'|'+filteredName] = fileObject;
		});
		uploadScript.countFiles();
		console.log("Files successfully added to list!");
		console.log(uploadScript.filesToUpload)
	},
	handleDrop: function(e) {
		// Handles when users drop files into the fileList div
		var dt = e.dataTransfer;
		var files = dt.files;
		// Leads to processing files by adding files via "addFiles()"
		uploadScript.updateFiles(files);
	},
	uploadFiles: function(event) {
		event.stopPropagation();
		event.preventDefault();

		if (Object.keys(uploadScript.filesToUpload).length == 0) {
			console.log("No files detected");
			alert("No files are set to be uploaded! Please add at least one audio file and then try again.");
			return;
		}

		var successes = [];
		var copyFiles = Object.values(uploadScript.filesToUpload);

		var loop = function(i,list,next) {
			if (i < list.length) {
				let f = list[i];
				f['HTML'].classList.remove('failed')
				f['HTML'].classList.add('loading');
				f['HTML'].querySelector('.addMediaText .addMediaError').innerHTML = '';
				let newFormData = new FormData();
				newFormData.append('upload',f['FILE']);
				let xhr = new XMLHttpRequest();
				xhr.open('post', '/uploadFile');
				xhr.onload = function() {
					f['HTML'].classList.remove('loading');
					var data = JSON.parse(xhr.responseText);
					console.log(data);
					if (xhr.status == 200) {
						let filteredName = f['FILE'].name.replace(/[^a-z0-9]/gi,'');
						let newName = f['FILE'].size+'|'+filteredName;
						f['HTML'].classList.add('success');
						successes.push(newName);
					} else {
						f['HTML'].classList.add('failed');
						f['HTML'].querySelector('.addMediaText .addMediaError').innerHTML = data.message;
					}
					i += 1;
					loop(i,list,next);
				}
				xhr.send(newFormData);
			} else {
				next();
			}
		}
		loop(0,copyFiles,()=>{
			uploadScript.removeFiles(successes);
			if (Object.keys(uploadScript.filesToUpload).length > 0) {
				alert("Some files have not been uploaded! Please check them and try again.");
			}
		})
	}
};

/*
function highlight(e) {
	uploadScript.fileList.classList.add('highlight');
}
function unhighlight(e) {
	uploadScript.fileList.classList.remove('highlight');
}
*/

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
	uploadScript.fileList.addEventListener(eventName, preventDefaults, false);
});
/*
['dragenter', 'dragover'].forEach(eventName => {
	uploadScript.fileList.addEventListener(eventName, highlight, false);
});
['dragleave', 'drop'].forEach(eventName => {
	uploadScript.fileList.addEventListener(eventName, unhighlight, false);
});
*/

uploadScript.input.addEventListener('change',function() {
	uploadScript.updateFiles(this.files);
},false);
uploadScript.fileList.addEventListener('drop',uploadScript.handleDrop,false);
uploadScript.form.addEventListener('submit',uploadScript.uploadFiles);


