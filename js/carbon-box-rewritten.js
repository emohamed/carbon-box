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

 	// the global variables for this scope
 	var $win = $(window),
 		$doc = $(document);

 	// the plugin defaults
 	var defaults = {
 		namespace : '',
 		transition: 'slide',
 		duration: 500,
 		append_to: 'container',
 		layout: 'dropdown',
 		position: 'auto',
 		on_create: false,
 		on_show: false,
 		on_hide: false,
 		on_change: false,
 		render_current: false,
 		render_option: false,
 		render_optgroup: false,
 		is_mobile: function(){
 			var ua = navigator.userAgent || navigator.vendor || window.opera;
			return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
 		}
 	}

 	// the constructor
 	function CarbonBox(element, options){
 		// save the constructor reference
 		var constructor = this;

 		// shortcut variables
 		var select,
 			containers,
 			uns,
 			ns,
 			$select;

 		// save the references
 		this.select = select = element;
 		this.$select = $select = $(element);
 		this.config = $.extend({}, defaults, options);
 		this.ns = ns = 'crb-';
 		this.uns = uns = this.config.namespace;
 		this.is_multiple = this.check_multiple(element);
 		this.is_mobile = this.config.is_mobile();
 		this.is_disabled = this.check_disable(element);
 		this.$childs = $select.find('option, optgroup');

 		// handle initialization erros early
 		var init_errors = this.validate(this.config);

 		if (init_errors.length > 0) {
 			for (var i = 0; i < init_erros.length; i++) {
 				this.report(init_erros[i]);
 			}
 			return;
 		}

 		// handle non-select item early
 		if (!$select.is('select')) {
 			this.report('carbonBox error: the selected element is not a select', select);
 			return;
 		}

 		// build containers
 		this.containers = containers = {};

 		var keys = ['container', 'head', 'current', 'button', 'arrow', 'dropdown', 'list', 'option', 'optgroup'];

 		for (var i=0; i < keys.length; i++) {
 			var tag_name = 'div';

 			switch(keys[i]) {
 				case 'list':
 					tag_name = 'ul';
 				break;
 				case 'option':
 				case 'optgroup':
 					tag_name = 'li';
 				break;
 			}

 			containers[keys[i]] = this.build_tag(tag_name, keys[i]);
 		}

 		// add 'disabled' class if element is disabled
 		if(this.is_disabled) {
 			containers['container'].addClass(this.build_class('container-disabled'));
 		}

 		// replace the selectbox, bind events
 		this.replace_selectbox();
 		this.bind_events();

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the build list method
 	CarbonBox.prototype.build_list = function(){
 		// save the constructor reference
 		var constructor = this;
 		
 		// loop the select childrens
 		this.$childs.each(function(){

 			// shortcut variables
 			var $this = $(this),
 				$item;

 			if ($this.is('option')) {
 				if ($.isFunction(constructor.config.render_item)) {
 					$item = constructor.config.render_item($this);
 					$item.addClass(constructor.build_class('option'));
 				} 
 				else {
 					$item = constructor.containers['option'].clone();
 					$item.text($this.text());
 				}

 				if ($this.is(':disabled')) {
 					$item.addClass(constructor.build_class('disabled'));
 					$item.attr('data-disabled', 'true');
 				}

 				if ($this.parent('optgroup').length) {
 					$item.addClass(constructor.build_class('optgroup-child'));
 				}

 				$item.data('associated-option', $this);
 				$this.data('associated-item', $item);
 			} 
 			else if ($this.is('optgroup')) {
 				if ($.isFunction(constructor.config.render_optgroup)) {
 					$item = constructor.config.render_optgroup($this);
 					$item.addClass(constructor.build_class('optgroup'));
 				}
 				else {
 					$item = constructor.containers['optgroup'].clone();
					$item.text($this.attr('label'));
 				}
 			}
 			else {
				constructor.report('carbonBox error: The element is not `option` or `optgroup` tag', $this);
			}

 			constructor.containers['list'].append($item);

 		});	

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the replace selectbox method
 	CarbonBox.prototype.replace_selectbox = function(){
 		// shortcut varibales
 		var containers = this.containers,
 			$container = containers['container'],
 			$head = containers['head'],
 			$button = containers['button'],
 			$arrow = containers['arrow'],
 			$current = containers['current'],
 			$dropdown = containers['dropdown'],
 			$list = containers['list'];

 		// build the dropdown list
 		if (!this.is_mobile || this.is_mobile && this.config.layout == 'box') {
 			this.build_list();
 			$dropdown.append($list);
 		}

 		// build the head structure
 		$button.append($arrow);
 		$head.append($current, $arrow);

 		// build the entire structure
 		if (this.config.layout == 'dropdown' && !this.is_mobile && this.config.append_to == 'container') {
 			$container.addClass(this.build_class('default'));
 			$container.append($head, $dropdown);
 		} 
 		else if (this.config.layout == 'dropdown' && !this.is_mobile && this.config.append_to == 'body') {
 			$container.addClass(this.build_class('default'));
 			$container.append($head);
 			$('body').append($dropdown);
 		}
 		else if (this.config.layout == 'box') {
 			$container.addClass(this.build_class('box'));
 			$container.append($dropdown);
 		}
 		else if (this.config.layout == 'dropdown' && this.is_mobile) {
 			$container.addClass(this.build_class('mobile'));
 		}

 		// replace the selectbox
 		if (this.is_mobile && this.config.layout == 'dropdown') {
 			this.$select.wrap($container);
 			$head.insertAfter(this.$select);
 		} 
 		else {
 			//this.$select.hide();
 			$container.insertAfter(this.$select);
 		} 

 		// create callback
 		if($.isFunction(this.config.on_create)) {
			this.config.on_show(this);
		}

 		// save reference to all items
 		this.$all_items = $container.find(this.expand_class('option'));

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the bind events method
 	CarbonBox.prototype.bind_events = function(){
 		// save the constructor reference
 		var constructor = this;

 		// handle the click over selectbox head
 		this.containers['head'].on('click', function(){
 			if (constructor.is_disabled) {
 				return;
 			}

 			if (constructor.containers['dropdown'].is(':visible')) {
 				constructor.close_dropdown();
 			}
 			else {
 				constructor.open_dropdown();
 			}
 		});

 		// handle mouseover/mouseleave events on selectbox items
 		this.containers['list'].on('mouseenter mouseleave', 'li', function(){
 			var $this = $(this);
 			$this.toggleClass(constructor.build_class('focused'), $this.hasClass(constructor.build_class('focused')));
 		});

 		// handle click event on selectbox items
 		this.containers['list'].on('click', 'li', function(){
 			var $this = $(this);

 			if (!$this.hasClass(constructor.build_class('disabled')) && !$this.hasClass(constructor.build_class('optgroup'))) {
 				constructor.set_active($this);
 			}
 		});

 		// close the dropdown when clicking out of the selectbox container
 		$doc.on('click', function(evt){
 			if (!$(evt.target).closest(constructor.containers['container']).length) {
 				constructor.close_dropdown();
 			}
 		});

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the open dropdown method
 	CarbonBox.prototype.open_dropdown = function(){
 		// save the constructor reference
 		var constructor = this;

 		var transition_type = '';

 		// add opening class
 		this.containers['container'].addClass(this.build_class('opening'));

 		// set the transition type
 		switch(this.config.transition) {
 			case 'slide':
 				transition_type = 'slideDown';
 			break;
 			case 'fade':
 				transition_type = 'fadeIn';
 			break;
 			default: 
 				transition_type = 'show';
 		}

 		// TODO - dynamic position
 		// this.set_position();

 		// show the dropdown
 		this.containers['dropdown'].stop();
 		this.containers['dropdown'][transition_type](this.config.duration, function(){
 			if($.isFunction(constructor.config.on_show)) {
 				constructor.config.on_show(constructor);
 			}

 			constructor.containers['container'].removeClass(constructor.build_class('opening'));
 			constructor.containers['container'].addClass(constructor.build_class('opened'));
 		});

 		// TODO - keyboard monitoring - start
 		// this.start_keyboard_monitoring();

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the close dropdown method 
 	CarbonBox.prototype.close_dropdown = function(){
 		// save the constructor reference
 		var constructor = this;

 		if (this.config.layout == 'dropdown') {
	 		var transition_type = '';

	 		// add opening class
	 		this.containers['container'].addClass(this.build_class('closing'));

	 		// set the transition type
	 		switch(this.config.transition) {
	 			case 'slide':
	 				transition_type = 'slideUp';
	 			break;
	 			case 'fade':
	 				transition_type = 'fadeOut';
	 			break;
	 			default: 
	 				transition_type = 'hide';
	 		}

	 		// hide the dropdown
	 		this.containers['dropdown'].stop();
	 		this.containers['dropdown'][transition_type](this.config.duration, function(){
	 			if($.isFunction(constructor.config.on_hide)) {
	 				constructor.config.on_hide(constructor);
	 			}

	 			constructor.containers['container'].removeClass(constructor.build_class('closing'));
	 			constructor.containers['container'].removeClass(constructor.build_class('opened'));
	 		});
	 	}

 		// TODO - keyboard monitoring - stop
 		// this.stop_keyboard_monitoring();

 		// preserve chainability of the plugin
 		return this;
 	};

 	// the set active method
 	CarbonBox.prototype.set_active = function(item){
 		if (!item.length) {
 			return;
 		}

 		if (!this.is_multiple) {
	 		item.data('associated-option').prop('selected', true);
	 		item.addClass(this.build_class('active'));
	 		item.siblings('li').removeClass(this.build_class('active'));
			
			if ($.isFunction(this.config.render_current)){
				var value = this.config.render_current(item);
				this.containers['current'].html(value);
			} 
			else {
				this.containers['current'].html(item.text());
			}

			this.close_dropdown();
 		}
 		else {
 			item.toggleClass(this.build_class('active'));
 			item.data('associated-option').prop('selected', item.hasClass(this.build_class('active')));
 		}

 		// preserve chainability of the plugin
 		return this;
 	};

 	// --------------- //
 	// --- helpers --- //
 	// --------------- //
 	CarbonBox.prototype.validate = function(options){
 		var errors = [];

		for (var option in options) {
			if (/container$/.test(option) && typeof options[option].jquery == "undefined") {
				errors.push("Option " + option + " must be a jQuery object!");
			}
		}

		return errors;
 	};

 	CarbonBox.prototype.report = function(message, element){
 		if (typeof 'console' != 'undefined') {
 			console.log('carbonBox error: ' + message);

 			if (element) {
 				console.log(element);
 			}
 		}
 	};

 	CarbonBox.prototype.build_class = function(class_name){
 		var classes = [this.ns + class_name];

 		if (this.uns != '') {
 			classes.push(this.uns + class_name);
 		}

 		return classes.join(' ');
 	};

 	CarbonBox.prototype.expand_class = function(class_name){
 		return '.' + this.ns + class_name;
 	};

 	CarbonBox.prototype.build_tag = function(tag_name, tag_key){
 		return $('<' + tag_name + '/>', { 'class': this.build_class(tag_key) });
 	};

 	CarbonBox.prototype.check_multiple = function(element){
 		return 'multiple' in element.attributes;
 	};

 	CarbonBox.prototype.check_disable = function(element){
 		return 'disabled' in element.attributes;
 	}

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