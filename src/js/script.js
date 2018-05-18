// Load locales
var gdprCookieNoticeLocales = {};

function cookiesConsent(config) {
	var namespace = 'consent';
	var pluginPrefix = 'gdpr-cookie-notice';
	var templates = window[pluginPrefix + '-templates'];
	var modalLoaded = false;
	var noticeLoaded = false; 

	// Default config options
	if(!config.locale) config.locale = 'cs';
	if(!config.timeout) config.timeout = 300;
	if(!config.domain) config.domain = null;
	if(!config.expiration) config.expiration = 90;
	
	if(!config.categories) { 
		config.categories = { 
			essential: true, // always true
			//analytics: [],
			//social: [],
			//marketing: [],
		};
	}
	
	var ConsentSettings = (function(_Cookies) {
		var cookieProps = { expires: config.expiration, domain: config.domain };
		return {
			init: function() {
				_Cookies.set(namespace, (new Date()).valueOf(), cookieProps);
			},
			consentRequired: function() {
				return typeof _Cookies.get(namespace) === "undefined";
			},
			get: function(name) {
				return _Cookies.get(namespace + "_" + name);
			},
			set: function(name, value) {
				if(!value) {
					_Cookies.remove(namespace + "_" + name, cookieProps);
					
					// Remove existing cookies which are no longer allowed
					if(!ConsentSettings.get(name) && config.categories[name] instanceof Array) {
						for (var ii = 0; ii < config.categories[name].length; ii++) {
							_Cookies.remove(config.categories[name][ii]);
						}
					}
				}
				else {
					_Cookies.set(namespace + "_" + name, value, cookieProps);
				}
			},
		};
	})(Cookies.noConflict());

	// Show cookie bar if needed
	if(ConsentSettings.consentRequired()) {
		showNotice();
	} else {
		dispatchAcceptedCookiesEvent();
	}

	// Write gdpr cookie notice's cookies when user accepts cookies
	function saveSettings(fromModal, byDefaultEnabled) {

		ConsentSettings.init();
		
		// If request was coming from the modal, check for the settings
		if(fromModal) {
			iterateCategories(true, function(cat){
				ConsentSettings.set(cat, document.getElementById(pluginPrefix + '-cookie_' + cat).checked);
			});
		}
		else {
			iterateCategories(true, function(cat){
				ConsentSettings.set(cat, byDefaultEnabled);
			});
		}
		
		dispatchAcceptedCookiesEvent();
		hideNotice();
	}

	// Show the cookie bar
	function buildNotice() {
		if(noticeLoaded) {
			return false;
		}

		var noticeHtml = localizeTemplate('bar.html');
		document.body.insertAdjacentHTML('beforeend', noticeHtml);

		// Load click functions
		setNoticeEventListeners();

		// Make sure its only loaded once
		noticeLoaded = true;
	}

	// Show the cookie notice
	function showNotice() {
		buildNotice();

		// Show the notice with a little timeout
		setTimeout(function(){
			document.documentElement.classList.add(pluginPrefix + '-loaded');
		}, config.timeout);
	}
	
	// Hide cookie notice bar
	function hideNotice() {
		document.documentElement.classList.remove(pluginPrefix + '-loaded');
	}

	// Build modal window
	function buildModal() {
		if(modalLoaded) {
			return false;
		}

		// Load modal template
		var modalHtml = localizeTemplate('modal.html');

		// Append modal into body
		document.body.insertAdjacentHTML('beforeend', modalHtml);

		// Get empty category list
		var categoryList = document.querySelector('.' + pluginPrefix + '-modal-cookies');

		// Load categories if needed
		iterateCategories(false, function(cat, isEssential){
			categoryList.innerHTML += localizeTemplate('category.html', 'cookie_' + cat);
			
			if(isEssential) {
				var input = document.getElementById(pluginPrefix + '-cookie_' + cat);
				var label = document.querySelector('[for=' + pluginPrefix + '-cookie_' + cat + ']');
				label.innerHTML = gdprCookieNoticeLocales[config.locale]['always_on'];
				label.classList.add(pluginPrefix + '-modal-cookie-state');
				label.classList.remove(pluginPrefix + '-modal-cookie-input-switch');
				input.remove();							
			}		
		});

		
		// Update checkboxes based on stored info(if any)
		if(!ConsentSettings.consentRequired()) {
			iterateCategories(true, function(cat){
				document.getElementById(pluginPrefix + '-cookie_' + cat).checked = ConsentSettings.get(cat);
			});
		}
		
		// Load click functions
		setModalEventListeners();

		// Make sure modal is only loaded once
		modalLoaded = true;
	}

	// Show modal window
	function showModal() {
		buildModal();
		document.documentElement.classList.add(pluginPrefix + '-show-modal');
	}

	// Hide modal window
	function hideModal() {
		document.documentElement.classList.remove(pluginPrefix + '-show-modal');
	}
	
	// iterate through categories
	function iterateCategories(onlyNonEssential, callback) {
		for (var cat in config.categories) {
			var isEssential = (config.categories[cat] === true);
			
			if (config.categories.hasOwnProperty(cat) && (!onlyNonEssential || !isEssential)) {
				callback(cat, isEssential);
			}
		}
	}
	
	// Load marketing scripts that only works when cookies are accepted
	function dispatchAcceptedCookiesEvent() {
		cookiesAcceptedEvent = new CustomEvent('gdprCookiesEnabled');
		document.dispatchEvent(cookiesAcceptedEvent);
	}
	
	// Localize templates
	function localizeTemplate(template, prefix) {
		var str = templates[template];
		var data = gdprCookieNoticeLocales[config.locale];
		
		if(prefix) {
			prefix = prefix + '_';
		} else {
			prefix = '';
		}

		if (typeof str === 'string' && (data instanceof Object)) {
			for (var key in data) {
				return str.replace(/({([^}]+)})/g, function(i) {
					var key = i.replace(/{/, '').replace(/}/, '');
	
					if(key == 'prefix') {
						return prefix.slice(0, -1);
					}

					if(data[key]) {
						return data[key];
					} else if(data[prefix + key]) {
						return data[prefix + key];
					} else {
						return i;
					}
				});
			}
		} else {
			return false;
		}
	}	

	// Click functions in the notice
	function setNoticeEventListeners() {
		var settingsButton = document.querySelectorAll('.' + pluginPrefix + '-nav-item-settings')[0];
		var acceptButton = document.querySelectorAll('.' + pluginPrefix + '-nav-item-accept')[0];
		var rejectButton = document.querySelectorAll('.' + pluginPrefix + '-nav-item-reject')[0];

		settingsButton.addEventListener('click', function(e) {
			e.preventDefault();
			showModal();
		});

		acceptButton.addEventListener('click', function(e) {
			e.preventDefault();
			saveSettings(false, true);
		});

		rejectButton.addEventListener('click', function(e) {
			e.preventDefault();
			saveSettings(false, false);
		});
	}

	// Click functions in the modal
	function setModalEventListeners() {
		var closeButton = document.querySelectorAll('.' + pluginPrefix + '-modal-close')[0];
		var statementButton = document.querySelectorAll('.' + pluginPrefix + '-modal-footer-item-statement')[0];
		var categoryTitles = document.querySelectorAll('.' + pluginPrefix + '-modal-cookie-title');
		var saveButton = document.querySelectorAll('.' + pluginPrefix + '-modal-footer-item-save')[0];

		closeButton.addEventListener('click', function() {
			hideModal();
			return false; 
		});
		
		saveButton.addEventListener('click', function(e) {
			e.preventDefault();
			saveButton.classList.add('saved');
			setTimeout(function(){
				saveButton.classList.remove('saved');
			}, 1000);
			saveSettings(true);
		});
		
		statementButton.href = config.statement;
		
		for (var i = 0; i < categoryTitles.length; i++) {
			categoryTitles[i].addEventListener('click', function() {
				this.parentNode.parentNode.classList.toggle('open');
				return false;
			});
		}

	}

	// Settings button on the page somewhere
	var globalSettingsButton = document.querySelectorAll('.' + pluginPrefix + '-settings-button');
	if(globalSettingsButton) {
		for (var i = 0; i < globalSettingsButton.length; i++) {
			globalSettingsButton[i].addEventListener('click', function(e) {
				e.preventDefault();
				showModal();
			});
		}
	}


}
