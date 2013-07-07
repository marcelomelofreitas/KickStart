/****************************************************
*  --- Application Object
*
*  NICE TO HAVE
*	- config to turn off top tabs, top menu
*	- utils should be part of app.js
*/

var app = { 

	header: function(msg) {
		$('#app-header').html(msg);
	},

	// ===========================================
	// -- Loads modules or calls .render()
	// -- if module was previously loaded

	load: function (name, params, callBack) {
		if (typeof app.core.modules[name] == 'undefined') {
			console.log('ERROR: module "'+ name +'" is not defined. Define it in app/core/app-modules.js.');
			return;
		}
		if (!params) params = {};
		// init module and pass params
		app[name] = app[name] || {};
		app[name].params = $.extend({}, params);
		// check if was loaded before 
		if (app.core.modules[name] && app.core.modules[name].isLoaded === true) {
			if (typeof app[name].render == 'undefined') {
				$.error('Loader: module "'+ name + '" has no render() method.');
			} else {
				app[name].render();
				if (typeof callBack == 'function') callBack(true);
			}
		} else {
			app.ajax({ 
				url 	: app.core.modules[name].url, 
				dataType: "script", 
				success	: function (data, status, respObj) {
					app.core.modules[name].isLoaded = true;
					if (typeof callBack == 'function') callBack(true);
				},
				error 	: function (respObj, err, errData) {
					if (err == 'error') {
						$.error('Loader: module "'+ name +'" failed to load ('+ app.core.modules[name].url +').');
					} else {
						$.error('Loader: module "'+ name + '" is loaded ('+ app.core.modules[name].url +'), but with a parsing error(s) in line '+ errData.line +': '+ errData.message);
						app.core.modules[name].isLoaded = true;
						if (typeof callBack == 'function') callBack(false);
					}
				} 
			});		
		}
	},

	// ===========================================
	// -- Loads a set of files and returns 
	// -- its contents to the callBack function

	get: function (files, callBack) {
		var bufferObj = {};
		var bufferLen = files.length;
		
		for (var i in files) {
			// need a closure
			(function () {
				var index = i;
				var path  = files[i];
				app.ajax({
					url		: path,
					dataType: 'text',
					success : function (data, success, responseObj) {
						if (success != 'success') {
							$.error('Loader: error while getting a file '+ path +'.');
							return;
						}
						bufferObj[index] = responseObj.responseText;
						loadDone();

					},
					error : function (data, err, errData) {
						if (err == 'error') {
							$.error('Loader: failed to load '+ files[i] +'.');
						} else {
							$.error('Loader: file "'+ files[i] + '" is loaded, but with a parsing error(s) in line '+ errData.line +': '+ errData.message);
							bufferObj[index] = responseObj.responseText;
							loadDone();
						}
					}
				});
			})();
		}
		// internal counter
		function loadDone() {
			bufferLen--;
			if (bufferLen <= 0) callBack(bufferObj);
		}
	},

	// ===========================================
	// -- Includes all files as scripts in order to see error line

	include: function (files) {
		for (var i in files) {
			$(document).append('<script type="text/javascript" src="'+ files[i] +'"></script>');
		}
	},
	
	// ===========================================
	// -- Common place for all AJAX calls

	ajax: function (url, options) {
		if (typeof options == 'undefined') options = url; else $.extend(options, { url: url });
		if (typeof options.error != 'undefined') options._error_ = options.error; 
		// custom error handler
		options.error = function (xhr, status, error) {
			if (typeof app.ajaxError == 'function') app.ajaxError(xhr, status, error);
			if (typeof options._error_ == 'function') options._error_(xhr, status, error);
		}
		options.cache = false;
		// submit through jquery
		$.ajax(options);
	},

	// ===========================================
	// -- Dialogs

	error: function (msg, title, callBack) {
		if (typeof callBack == 'undefined' && typeof title == 'function') {
			callBack = title; 
			title = 'Error';
		}
		if (typeof title == 'undefined') {
			title = 'Error';
		}
		// if popup is open
		if ($('#w2ui-popup').length > 0) {
			$('#w2ui-popup .w2ui-popup-message').remove();
			$().w2popup('message', {
				width 	: 500,
				height 	: 200,
				showMax : false,
				html 	: 
					'<div class="centered"><div style="padding-bottom: 30px">'+
					'	<div style=\'display: inline-block; text-align: left; font-size: 12px; font-family: Monaco, "Courier New"; color: #555;\'>'+ 
							String(msg).replace(/\n/g, '<br>') +
					'	</div>' +
					'</div></div>'
			});
			$('#w2ui-popup .w2ui-popup-message').on('click', function (event) { if (typeof callBack == 'function') callBack(); });
			return;
		}
		// open in as a popup
		$().w2popup('open', {
			width 	: 500,
			height 	: 245,
			showMax : false,
			title 	: (typeof title != 'undefined' ? title : 'Error'),
			body 	: '<div class="centered"><div>'+
				 	  '  <div style=\'display: inline-block; text-align: left; font-size: 12px; font-family: Monaco, "Courier New"; color: #555;\'>'+ 
				 			String(msg).replace(/\n/g, '<br>') +
					  '	 </div>' +
					  '</div></div>',
			buttons : '<input type="button" value="Ok" onclick="$().w2popup(\'close\')" style="width: 60px">',
			onClose : function () { if (typeof callBack == 'function') callBack(); }
		});
	},

	alert: function (msg, title, callBack) {
		if (typeof callBack == 'undefined' && typeof title == 'function') {
			callBack = title; 
			title = 'Notification';
		}
		if (typeof title == 'undefined') {
			title = 'Notification';
		}
		$().w2popup({
			width 	: 500,
			height 	: 245,
			title   : title,
			body    : '<div class="centered"><div>'+ msg +'</div></div>',
			buttons : '<input type="button" value="Ok" style="width: 60px" onclick="$().w2popup(\'close\');">',
			onClose : function () { if (typeof callBack == 'function') callBack(); }
		});
	},

	confirm: function (msg, title, callBack) { // can be called (msg, callBack)
		if (typeof callBack == 'undefined' || typeof title == 'function') {
			callBack = title; 
			title = 'Confirmation';
		}
		if (typeof title == 'undefined') {
			title = 'Confirmation';
		}
		$().w2popup({
			width 	: 500,
			height 	: 245,
			title   : title,
			showClose : false,
			modal	: true,
			body    : '<div class="centered"><div>'+ msg +'</div></div>',
			buttons : '<input class="btn" type="button" value="No" style="width: 60px; margin-right: 5px">&nbsp;'+
					  '<input class="btn" type="button" value="Yes" style="width: 60px">'
		});
		$('#w2ui-popup .btn').on('click', function (event) {
			$().w2popup('close');
			if (typeof callBack == 'function') callBack(this.value);
			 event.stopPropagation();
		});
	}
}

// =================================================
// -- Core Module

app.core = (function (obj) {
	var action;
	var config;
	var modules;
	var start;

	obj.modules	= modules;

	init();
	return obj;

	function init() {
		// -- load dependencies
		var files = [
			'app/core/conf/action.js', 
			'app/core/conf/config.js', 
			'app/core/conf/modules.js', 
			'app/core/conf/utils.js', 
			'app/core/conf/start.js' 
		];
		app.get(files, function (data) {
			try {
				/* REVISIT - ajax(script type ) does not show line */
				for (var i in data) eval(data[i]);
			} catch (e) {
				app.include(files);
			}
			app.core.config  = config;
			app.core.modules = modules;
			// init application UI
			$('#app-toolbar').w2toolbar(config.app_toolbar);
			$('#app-tabs').w2tabs(config.app_tabs);
			$('#app-main').w2layout(config.app_layout);
			// popin
			//$().w2popup({ width: 300, height: 65, body: 
			//	'<div style="font-size: 18px; color: #666; text-align: center; padding-top: 15px">Loading....</div>'} );
			setTimeout(popin, 100);
		});
	}

	function popin() {
		$('#app-container').fadeIn(200);
		//$('#app-container').css({ '-webkit-transform': 'scale(1)', opacity: 1 });
		setTimeout(function () {
			var top = 0;
			// app toolbar
			if (config.show.toolbar) {
				$('#app-toolbar').css('height', '30px').show();
				top += 30;
			} else {
				$('#app-toolbar').hide();
			}
			// app tabs
			if (config.show.tabs) {
				$('#app-tabs').css({ 'top': top + 'px', 'height': '30px' }).show();
				top += 30;
			} else {
				$('#app-tabs').hide();
			}
			$('#app-top').css('height', top + 'px').show();
			// app header
			if (config.show.header) {
				$('#app-header').css({ 'top': top + 'px', 'height': '60px' }).show();
				top += 60;
			} else {
				$('#app-header').hide();
			}
			$('#app-main').css('top', top + 'px');
			// init app
			if (typeof app.start == 'function') app.start();
			var hash = String(document.location.hash);
			if (hash.length > 1) hash = hash.substr(1);
			if ($.trim(hash) != '') {
				app.route.go(hash);
			} else {
				// load first module
				for (var mod in app.core.modules) {
					app.load(mod);
					break;
				}
			}
		}, 200);
	}

}) (app.core || {});

// =================================================
// -- Route Module

app.route = (function (obj) {
	var no_update = false;

	obj.set 	= set;
	obj.parse	= parse;
	obj.go		= go;

	init();
	return obj;

	function init () {
		// init routes
		$(window).on('hashchange', function (event) {
			if (no_update === true) return;
			var path = String(document.location.hash).replace(/\/{2,}/g, '/');
			if (path.length > 1) path = path.substr(1);
			app.route.go(path);
		});		
	}

	function set (path) {
		if (path.substr(0, 1) != '/') path = '/' + path;
		no_update = true;
		document.location.hash = path;
		setTimeout(function () { no_update = false; }, 1); // need timer to allow hash to be proceesed by the browser
	}

	function parse () {
		var hash = String(document.location.hash).replace(/\/{2,}/g, '/');
		if (hash.length > 1) hash = hash.substr(1);
		if (hash.length > 1 && hash.substr(0, 1) == '/') hash = hash.substr(1);
		return hash.split('/');
	}	

	function go (path) {
		if (!path) return;
		if (path.substr(0, 1) != '/') path = '/' + path;
		path = path.replace(/\/{2,}/g, '/');
		var tmp = app.route.parse();
		var mod = tmp[0];
		app.route.set(path);
		// open that module
		if (app.core.modules[mod] && app.core.modules[mod].isLoaded) {
			app[mod].params = { route: path, parsed: app.route.parse() };
			app[mod].render();
		} else {
			app.load(mod, { route: path, parsed: app.route.parse() });
		}
	}

}) (app.route || {});
