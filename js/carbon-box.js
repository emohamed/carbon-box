/**
 * Carbon Box
 * 
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
;(function($, window, document, undefined){
	'use strict';

	// the global variables
	var $win = $(window),
		$doc = $(document);

	// the plugin defaults
	var defaults = {
		namespace: '',
		layout: 'dropdown',
		context: 'container',
		position: 'auto',
		transition: 'slide',
		duration: 500,
		isMobile: function(){
			var ua = navigator.userAgent || navigator.vendor || window.opera;
			return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
		},
		renderOption: false,
		renderOptgroup: false,
		onCreate: false,
		onShow: false,
		onHide: false,
		onChange: false
	};

	// the plugin constructor
	function CarbonBox(element, options){
		// cache the constructor reference
		var self = this;

		// cache the plugin variables
		this.el = element;
		this.$el = $(element);
		this.$children = this.$el.find('option, optgroup');
		this.config = $.extend({}, defaults, options);
		this.ns = 'crb-';
		this.uns = this.config.namespace;
		this.isMultiple = 'multiple' in element.attributes;
		this.isDisabled = 'disabled' in element.attributes;
		this.isMobile = this.config.isMobile();
		this.searchTimeout = null;
		this.searchPhrase = '';
		this.searchDelay = 250;

		// html structure
		this.containers = {
			'container': $('<div />', { 'class': self.cssClass('container') }),
			'head': $('<div />', { 'class': self.cssClass('head') }),
			'current': $('<div />', { 'class': self.cssClass('current') }),
			'button': $('<div />', { 'class': self.cssClass('button') }),
			'arrow': $('<div />', { 'class': self.cssClass('arrow') }),
			'dropdown': $('<div />', { 'class': self.cssClass('dropdown') }),
			'list': $('<ul />', { 'class': self.cssClass('list') }),
			'option': $('<li />', { 'class': self.cssClass('option') }),
			'optgroup': $('<li />', { 'class': self.cssClass('optgroup') })
		}

		// handle non-select item
		if (!this.$el.is('select')) {
			this.report('The selected element is not a select', this.el);
			return;
		}

		// add 'disabled' class
		if (this.isDisabled) {
			this.containers['container'].addClass(this.cssClass('container-disabled'));
		}

		// replace selectbox & bind events
		this.replaceSelectbox();
		this.bindEvents();

		this.initState();
	};
	CarbonBox.prototype.initState = function(){
		// this.setActive();
	};
	// method - build custom ui
	CarbonBox.prototype.buildUI = function(){
		// cache the constructor reference
		var self = this;

		// loop the select children
		this.$children.each(function(){
			// shortcut variables
			var $child = $(this),
				$item;

			if ($child.is('option')) {
				if ($.isFunction(self.config.renderOption)) {
					$item = self.config.renderOption($child);
					$item.addClass(self.cssClass('option'));
				}
				else {
					$item = self.containers['option'].clone();
					$item.html($child.html());
				}

				if ($child.is(':disabled')) {
					$item.addClass(self.cssClass('disabled'));
					$item.attr('data-disabled', true);
				}

				$item.data('associated-option', $child);
				$child.data('associated-item', $item);
			}
			else if ($child.is('optgroup')) {
				if ($.isFunction(self.config.renderOptgroup)) {
					$item = self.config.renderOptgroup($child);
					$item.addClass(self.cssClass('optgroup'));
				}
				else {
					$item = self.containers['optgroup'].clone();
					$item.html($child.attr('label'));
				}
			}
			else {
				self.report('The element is not option or optgroup', $child);
			}

			// append the new item to list
			self.containers['list'].append($item);
		});
	};

	// method - replace the selectbox
	CarbonBox.prototype.replaceSelectbox = function(){
		// shortcut variables
		var $container = this.containers['container'],
			$head = this.containers['head'],
			$button = this.containers['button'],
			$arrow = this.containers['arrow'],
			$current = this.containers['current'],
			$dropdown = this.containers['dropdown'],
			$list = this.containers['list'],
			layout = this.config.layout,
			context = this.config.context;

		// build the dropdown list
		if (!this.isMobile || this.isMobile && layout == 'box') {
			this.buildUI();
			$dropdown.append($list);
		}

		// build the head
		$button.append($arrow);
		$head.append($button, $current);

		// build the structure
		if (layout == 'dropdown') {
			if (!this.isMobile) {
				if (context == 'container') {
					$container.addClass(this.cssClass('container-dropdown'));
					$container.append($head, $dropdown);
				} else if (context == 'body') {
					$container.addClass(this.cssClass('container-dropdown'));
					$container.append($head);
					$('body').append($dropdown);
				} 
			} else {
				$container.addClass(this.cssClass('container-mobile'));
				$container.append($head);
			}
		} else if (layout == 'box') {
			$container.append($dropdown);
			$container.addClass(this.cssClass('container-box'));
		} else {
			throw "not possible";
		}

		// replace the selectbox
		if (this.isMobile && layout == 'dropdown') {
			this.$el.wrap($container);
			$head.insertAfter(this.$el);
		} else {
			this.$el.hide();
			$container.insertAfter(this.$el);
		}

		// callback - create 
		if ($.isFunction(this.config.onCreate)) {
			this.config.onCreate(this);
		}

		// save all items
		this.$allItems = $container.find('.' + this.cssClass('option', false));
	};

	// method - bind all events
	CarbonBox.prototype.bindEvents = function(){
		// cache the constructor reference
		var self = this;

		// toggle dropdown list
		this.containers['head'].on('click', function(){
			if (self.isDisabled) {
				return;
			}

			if (self.containers['dropdown'].is(':visible')) {
				self.closeDropdown();
			} 
			else {
				self.openDropdown();
			}
		});

		// close the dropdown when clicking out of the container
		$doc.on('click', function(evt){
			if (!$(evt.target).closest(self.containers['container']).length && self.containers['dropdown'].is(':visible') && self.config.layout == 'dropdown') {
				self.closeDropdown();
			}
		});

		// handle mouseover/mouseleave events on selectbox items
		this.containers['list'].on('mouseenter mouseleave', 'li:not(.'+ this.cssClass('optgroup', false) +')', function(){
			var $this = $(this);
			$this.toggleClass(self.cssClass('focused', false));
		});
	};

	// method - open dropdown
	CarbonBox.prototype.openDropdown = function(){
		// cache the constructor reference
		var self = this;

		// shortcut variables
		var $container = this.containers['container'],
			$dropdown = this.containers['dropdown'],
			transitionType = '';

		$container.addClass(this.cssClass('opening', false));

		switch (this.config.transition) {
			case 'slide':
				transitionType = 'slideDown';
			break;
			case 'fade':
				transitionType = 'fadeIn';
			break;
			default:
				transitionType = 'show';
		}

		if (this.config.position == 'auto') {

		}

		// animate dropdown
		$dropdown.stop();
		$dropdown[transitionType](this.config.duration, function(){
			if ($.isFunction(self.config.onShow)) {
				self.config.onShow(self);
			}

			$container.removeClass(self.cssClass('opening', false));
			$container.addClass(self.cssClass('opened', false));
		});

		this.startKeyboardMonitoring();
	};

	// method - close dropdown
	CarbonBox.prototype.closeDropdown = function(){
		// cache the constructor reference
		var self = this;

		// shortcut variables
		var $container = this.containers['container'],
			$dropdown = this.containers['dropdown'],
			transitionType = '';

		if (this.config.layout == 'dropdown') {
			$container.addClass(this.cssClass('closing', false));

			switch (this.config.transition) {
				case 'slide':
					transitionType = 'slideUp';
				break;
				case 'fade':
					transitionType = 'fadeOut';
				break;
				default:
					transitionType = 'hide';
			}

			// animate dropdown
			$dropdown.stop();
			$dropdown[transitionType](this.config.duration, function(){
				if ($.isFunction(self.config.onHide)) {
					self.config.onHide(self);
				}

				$container.removeClass(self.cssClass('closing', false));
				$container.removeClass(self.cssClass('opened', false));
			});
		}

		this.stopKeyboardMonitoring();
	};

	// method - start keyboard monitoring
	CarbonBox.prototype.startKeyboardMonitoring = function(){
		$doc.on('keydown', 'body', this, this.keyDownCallback);
	};

	// method - stop keyboard monitoring
	CarbonBox.prototype.stopKeyboardMonitoring = function(){
		$doc.off('keydown', 'body', this.keyDownCallback);
	};

	// method - move to item
	CarbonBox.prototype.moveToItem = function(direction, step){
		// cache the constructor reference
		var self = this;

		var currentIndex,
			focused = this.$allItems.filter('.' + this.cssClass('focused', false)),
			// currentActive = this.$allItems.filter('.' + this.cssClass('active', false)).last();
			currentActive = this.$allItems.not('.' + this.cssClass('disabled', false) ).first(); // REMOVE THIS!

		// determine the current index
		if (focused.length) {
			currentIndex = this.$allItems.index(focused);
		} else {
			currentIndex = this.$allItems.index(currentActive);
		}

		// setup the factor
		var factor = (direction == 'up' ? -1 : 1);

		// calculate the target index
		var targetIndex = currentIndex + step * factor;

		// negative indexes are not allowed
		targetIndex = Math.max(targetIndex, 0);

		// indexes bigger than items count are not allowed
		targetIndex = Math.min(targetIndex, this.$allItems.length - 1);

		// get the target item
		var targetItem = this.$allItems.eq(targetIndex);

		if (targetItem.hasClass(this.cssClass('disabled', false))) {
			var isLast  = this.$allItems.index(targetItem) == this.$allItems.length - 1,
				isFirst = this.$allItems.index(targetItem) == 0,
				enabledSelector = ':not(.'+ this.cssClass('disabled', false) +')';

			if (direction == 'down' && isLast) {
				var lastEnabled = this.$allItems.filter(enabledSelector + ':last');
				this.setFocusedItem(lastEnabled);
			} else if (direction == 'up' && isFirst) {
				var firstEnabled = this.$allItems.filter(enabledSelector + ':first');
				this.setFocusedItem(firstEnabled);
			} else {
				this.moveToItem(direction, step + 1);
			}
		} else {
			this.setFocusedItem(targetItem);
		}

		return false;
	};

	// method - set the focused item
	CarbonBox.prototype.setFocusedItem = function(item){
		// cache the constructor reference
		var self = this;

		if (!item.length) {
			return;
		}

		var focusedClass = this.cssClass('focused', false);

		// remove the focused class from the siblings
		this.$allItems.filter('.' + focusedClass).removeClass(focusedClass);

		// focus the element
		item.addClass(focusedClass);
	};

	// method - search
	CarbonBox.prototype.initKeyboardSearch = function(character){
		// cache the constructor reference
		var self = this;

		// clear the search timeout
		clearTimeout(this.searchTimeout);

		// remaining keys should initiate a keyboard search
 		this.searchPhrase += character.toLowerCase();

 		for (var i = 0; i < this.$allItems.length; i++) {
 			var item = this.$allItems.eq(i);

 			if (item.is('.' + this.cssClass('expand'))) {
 				continue;
 			}

 			var text = $.trim(item.text().toLowerCase());
 			if (text.indexOf(this.searchPhrase) == 0) {
 				this.setFocusedItem(item);
 				break;
 			}
 		}

 		this.searchTimeout = setTimeout(function(){
 			self.searchPhrase = '';
 		}, this.searchDelay);
	};

	// callback - keydown
	CarbonBox.prototype.keyDownCallback = function(evt){
		// cache the constructor reference
		var self = evt.data;
		var codes = {
			keyDown: 40,
			keyUp: 38,
			home: 36,
			end: 35,
			pageDown: 34,
			pageUp: 33,
			esc: 27,
			enter: 13,
			tab: 9
		};

		var keyCode = evt.keyCode;

		switch (keyCode) {
			case codes['keyDown']:
				return self.moveToItem('down', 1);
			case codes['keyUp']:
				return self.moveToItem('up', 1);

			case codes['home']:
				return self.moveToItem('up', self.$allItems.length);
			case codes['end']:
				return self.moveToItem('down', self.$allItems.length);

			case codes['pageUp']:
			case codes['pageDown']:
			break;

			case codes['tab']:
			case codes['enter']:
				var focused = self.$allItems.filter('.' + self.cssClass('focused'));
				self.setActive(focused);
				self.closeDropdown();
			break;

			case codes['esc']:
				self.closeDropdown();
			break;

			default: 
				var character = String.fromCharCode(keyCode);
				self.initKeyboardSearch(character);
		}
	};

	// method - report errors 
	CarbonBox.prototype.report = function(message, element){
		if (typeof 'console' != 'undefined') {
			console.log('carbonBox error: ' + message);
		}

		if (element) {
			console.log(element);
		}
	};

	// method - generate css class
	CarbonBox.prototype.cssClass = function(className, useUns){
		var classes = [this.ns + className];

		if (useUns == undefined) {
			useUns = true;
		}

		if (this.uns != '' && useUns) {
			classes.push(this.uns + className);
		}

		return classes.join(' ');
	};

	// extend the jQuery.fn 
 	$.fn.carbonBox = function(options){
 		return this.each(function(){
 			var $this = $(this),
 				instance = $this.data('carbonBox');

 			if (typeof instance === 'undefined') {
 				instance = new CarbonBox(this, options);
 				$this.data('carbonBox', instance);
 			}
 		});	
 	}

}(jQuery, window, document));