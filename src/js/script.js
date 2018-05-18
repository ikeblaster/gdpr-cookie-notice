// Load locales
var gdprCookieNoticeLocales = {};

function gdprCookieNotice(config) {
	var namespace = 'cookieconsent';
	var pluginPrefix = 'gdpr-cookie-notice';
	var templates = window[pluginPrefix+'-templates'];
	var gdprCookies = Cookies.noConflict();
	var modalLoaded = false;
	var noticeLoaded = false; 
	var cookiesAccepted = false;
	var categories = ['analytics', 'social', 'marketing']; 

	// Default config options
	if(!config.locale) config.locale = 'cs';
	if(!config.timeout) config.timeout = 500;
	if(!config.domain) config.domain = null;
	if(!config.expiration) config.expiration = 30;

	// Get the users current cookie selection
	var currentCookieSelection = getCookie();
	var cookiesAcceptedEvent = new CustomEvent('gdprCookiesEnabled', {detail: currentCookieSelection});

	// Show cookie bar if needed
	if(!currentCookieSelection) {
		showNotice();
	} else {
		//deleteCookies(currentCookieSelection);
		document.dispatchEvent(cookiesAcceptedEvent);
	}

	// Get gdpr cookie notice stored value
	function getCookie() {
		return gdprCookies.getJSON(namespace);
	}

	// Delete cookies if needed
	function deleteCookies(savedCookies) {
		for (var i = 0; i < categories.length; i++) {
			if(!savedCookies[categories[i]] && config[categories[i]]) {
				for (var ii = 0; ii < config[categories[i]].length; ii++) {
					gdprCookies.remove(config[categories[i]][ii]);
				}
			}
		}
	}

	// Hide cookie notice bar
	function hideNotice() {
		document.documentElement.classList.remove(pluginPrefix+'-loaded');
	}

	// Write gdpr cookie notice's cookies when user accepts cookies
	function saveSettings(fromModal, byDefaultEnabled) {
		var settings = {};
		var cookieProps = { expires: config.expiration, domain: config.domain };

		// If request was coming from the modal, check for the settings
		if(fromModal) {
			for (var i = 0; i < categories.length; i++) {
				if(config[categories[i]]) settings[categories[i]] = document.getElementById(pluginPrefix+'-cookie_'+categories[i]).checked;
			}
		}
		else {
			for (var i = 0; i < categories.length; i++) {
				if(config[categories[i]]) settings[categories[i]] = byDefaultEnabled;
			}
		}
		
		for (var val in settings) {
			if(settings[val]) {
				gdprCookies.set(namespace+"_"+val, settings[val], cookieProps);
			}
			else {
				gdprCookies.remove(namespace+"_"+val);
			}
		}
		
		
		settings.date = new Date();
		
		gdprCookies.set(namespace, settings, cookieProps);
		deleteCookies(settings);

		// Load marketing scripts that only works when cookies are accepted
		cookiesAcceptedEvent = new CustomEvent('gdprCookiesEnabled', {detail: settings});
		document.dispatchEvent(cookiesAcceptedEvent);
		
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
			document.documentElement.classList.add(pluginPrefix+'-loaded');
		}, config.timeout);
	}

	// Localize templates
	function localizeTemplate(template, prefix) {
		var str = templates[template];
		var data = gdprCookieNoticeLocales[config.locale];

		if(prefix) {
			prefix = prefix+'_';
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
					} else if(data[prefix+key]) {
						return data[prefix+key];
					} else {
						return i;
					}
				});
			}
		} else {
			return false;
		}
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
		var categoryList = document.querySelector('.'+pluginPrefix+'-modal-cookies');

		//Load essential cookies
		categoryList.innerHTML += localizeTemplate('category.html', 'cookie_essential');
		var input = document.querySelector('.'+pluginPrefix+'-modal-cookie-input');
		var label = document.querySelector('.'+pluginPrefix+'-modal-cookie-input-switch');
		label.innerHTML = gdprCookieNoticeLocales[config.locale]['always_on'];
		label.classList.add(pluginPrefix+'-modal-cookie-state');
		label.classList.remove(pluginPrefix+'-modal-cookie-input-switch');
		input.remove();

		// Load other categories if needed
		for (var i = 0; i < categories.length; i++) {
			if(config[categories[i]]) categoryList.innerHTML += localizeTemplate('category.html', 'cookie_' + categories[i]);
		}
		
		// Update checkboxes based on stored info(if any)
		if(currentCookieSelection) {
			for (var i = 0; i < categories.length; i++) {
				if(config[categories[i]]) document.getElementById(pluginPrefix+'-cookie_'+categories[i]).checked = currentCookieSelection[categories[i]];
			}
		}
		
		// Load click functions
		setModalEventListeners();

		// Make sure modal is only loaded once
		modalLoaded = true;
	}

	// Show modal window
	function showModal() {
		buildModal();
		document.documentElement.classList.add(pluginPrefix+'-show-modal');
	}

	// Hide modal window
	function hideModal() {
		document.documentElement.classList.remove(pluginPrefix+'-show-modal');
	}

	// Click functions in the notice
	function setNoticeEventListeners() {
		var settingsButton = document.querySelectorAll('.'+pluginPrefix+'-nav-item-settings')[0];
		var acceptButton = document.querySelectorAll('.'+pluginPrefix+'-nav-item-accept')[0];
		var rejectButton = document.querySelectorAll('.'+pluginPrefix+'-nav-item-reject')[0];

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
		var closeButton = document.querySelectorAll('.'+pluginPrefix+'-modal-close')[0];
		var statementButton = document.querySelectorAll('.'+pluginPrefix+'-modal-footer-item-statement')[0];
		var categoryTitles = document.querySelectorAll('.'+pluginPrefix+'-modal-cookie-title');
		var saveButton = document.querySelectorAll('.'+pluginPrefix+'-modal-footer-item-save')[0];

		closeButton.addEventListener('click', function() {
			hideModal();
			return false;
		});

		statementButton.addEventListener('click', function(e) {
			e.preventDefault();
			window.location.href = config.statement;
		});

		for (var i = 0; i < categoryTitles.length; i++) {
			categoryTitles[i].addEventListener('click', function() {
				this.parentNode.parentNode.classList.toggle('open');
				return false;
			});
		}

		saveButton.addEventListener('click', function(e) {
			e.preventDefault();
			saveButton.classList.add('saved');
			setTimeout(function(){
				saveButton.classList.remove('saved');
			}, 1000);
			saveSettings(true);
		});

	}

	// Settings button on the page somewhere
	var globalSettingsButton = document.querySelectorAll('.'+pluginPrefix+'-settings-button');
	if(globalSettingsButton) {
		for (var i = 0; i < globalSettingsButton.length; i++) {
			globalSettingsButton[i].addEventListener('click', function(e) {
				e.preventDefault();
				showModal();
			});
		}
	}


}
