// ==UserScript==
// @name           P3D download script
// @description    lets you download P3D models
// @author         Reinitialized
//
//Version Number
// @version        1.0
//
// Urls process this user script on
// @include        /^https?://(www\.)?p3d\.in/.*$/
// ==/UserScript==

function OBJforGeometry(geometry) {
    var loader = new THREE.BinaryLoader();
    geometry.computeVertexNormals();
    var s = '';
    var perVertexNormals = [];
    for (i = 0; i < geometry.vertices.length; ++i) {
        s += 'v ' + geometry.vertices[i].x + ' ' + geometry.vertices[i].y + ' ' + geometry.vertices[i].z + '\n';
        perVertexNormals.push(null);
    }
    for (i = 0; i < geometry.faces.length; ++i) {
        var face = geometry.faces[i];
        if (!perVertexNormals[face.a]) 
            perVertexNormals[face.a] = face.vertexNormals[0];
        if (!perVertexNormals[face.b]) 
            perVertexNormals[face.b] = face.vertexNormals[1];
        if (!perVertexNormals[face.c]) 
            perVertexNormals[face.c] = face.vertexNormals[2];
        if (!perVertexNormals[face.d]) 
            perVertexNormals[face.d] = face.vertexNormals[3];
    }
    for (i = 0; i < perVertexNormals.length; ++i) {
        var vn = perVertexNormals[i];
        if (!vn)
            vn = new THREE.Vector3(0, 0, 0);
        s += 'vn ' + vn.x + ' ' + vn.y + ' ' + vn.z + '\n';
    }
    var uvIndex = 0;
	for (var grp_idx = 0; grp_idx < geometry.geometryGroupsList.length; ++grp_idx) {
		var grp = geometry.geometryGroupsList[grp_idx];
		s += 'usemtl mtl' + grp.materialIndex + '\n';
		
		for (var face_grp_idx = 0; face_grp_idx	< grp.faces3.length; ++face_grp_idx) {
			var face_idx = grp.faces3[face_grp_idx];
			
			var vertexUvs = geometry.faceVertexUvs[0][face_idx];
			for (var j = 0; j < vertexUvs.length; ++j) {
				var uv = vertexUvs[j];
				if (uv.u == undefined) {
				  s += 'vt ' + uv.x + ' ' + (1.0 - uv.y) + '\n';
				}
				else {
				  s += 'vt ' + uv.u + ' ' + (1.0 - uv.v) + '\n';
				}
			}

			var face = geometry.faces[face_idx];
			s += 'f ';
			s += (face.a + 1) + '/' + (++uvIndex) + '/' + (face.a + 1) + ' ';
			s += (face.b + 1) + '/' + (++uvIndex) + '/' + (face.b + 1) + ' ';
			s += (face.c + 1) + '/' + (++uvIndex) + '/' + (face.c + 1) + ' ';
			if (face.d !== undefined) {
				s += (face.d + 1) + '/' + (++uvIndex) + '/' + (face.d + 1);
			}
			s += '\n';
		}
	}

    return s;
};

function dlOBJ() {
    var OBJ = OBJforGeometry(P3DV.mesh.geometry);
    // Credit: http://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/
    function destroyClickedElement(event)
    {
        document.body.removeChild(event.target);
    }
    var textToWrite = OBJ;
    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    
    // Credit: http://phpjs.org/functions
    function basename (path, suffix) {
        var b = path.replace(/^.*[\/\\]/g, '');
        
        if (typeof suffix === 'string' && b.substr(b.length - suffix.length) == suffix) {
            b = b.substr(0, b.length - suffix.length);
        }
        
        return b;
    }
    var fileNameToSaveAs = basename(document.URL) + ".obj";
    
    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null)
    {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else
    {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }
    downloadLink.click();
};

// Credit: http://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
        eventListenerSupported = window.addEventListener;

    return function(obj, callback){
        if( MutationObserver ){
            // define a new observer
            var obs = new MutationObserver(function(mutations, observer){
                if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
                    callback();
            });
            // have the observer observe foo for changes in children
            obs.observe( obj, { childList:true, subtree:true });
        }
        else if( eventListenerSupported ){
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    }
})();

// Credit: http://stackoverflow.com/questions/10596417/is-there-a-way-to-get-element-by-xpath-in-javascript
var getElementByXpath = function (path) {
    return document.evaluate(path, document, null, 9, null).singleNodeValue;
};

var buttonAdded = false;
observeDOM(document.body, function(){ 
    var buttonPanel = getElementByXpath('//*[@id="content"]/div[1]/div/div');
    if (buttonPanel && !buttonAdded) {
        var newButton = document.createElement("span");
        newButton.innerHTML = '<div class="ember-view menu-item menu-control"><div class=""><span data-icon="J"></span> <span class="tooltip tooltip-r">Download .OBJ</span></div></div>';
        newButton.addEventListener("click", dlOBJ , false);
        buttonPanel.appendChild(newButton);
        buttonAdded = true;
    }
    else if (!buttonPanel && buttonAdded) {
        buttonAdded = false;   
    }
});
