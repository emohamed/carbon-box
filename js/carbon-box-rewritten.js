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
 		this.$children = $select.find('option, optgroup');
 		this.search_timeout = null;
 		this.search_delay = 250;
 		this.search_phrase = '';
 		this.current_active = null;

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

 		// build the containers
 		this.containers = containers = {};

 		var keys = ['container', 'head', 'current', 'button', 'arrow', 'dropdown', 'list', 'option', 'optgroup'];

 		for (var i=0; i < keys.length; i++) {
 			var tag_name = 'div';

 			switch (keys[i]) {
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

 		// setup selected item
 		if (!this.is_multiple && this.config.layout == 'dropdown') {
 			var selected = $select.find('option:selected:not(:disabled)');
 			var option = selected.data('associated-item');
 			this.set_active(option);
 		}
 		else if (this.is_multiple) {
 			var all_selected = $select.find('option:selected:not(:disabled)');
 			all_selected.each(function(){
 				constructor.set_active($(this).data('associated-item'));
 			});
 		}
 	};

 	// the build list method
 	CarbonBox.prototype.build_list = function(){
 		// save the constructor reference
 		var constructor = this;
 		
 		// loop the select children
 		this.$children.each(function(){

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
 		$head.append($button, $current);

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
 			this.$select.hide();
 			$container.insertAfter(this.$select);
 		} 

 		// create callback
 		if($.isFunction(this.config.on_create)) {
			this.config.on_show(this);
		}

 		// save reference to all items
 		this.$all_items = $container.find(this.expand_class('option'));
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
 		this.containers['list'].on('mouseenter mouseleave', 'li:not('+ this.expand_class('optgroup') +')', function(){
 			var $this = $(this);
 			$this.toggleClass(constructor.build_class('focused'), $this.hasClass(constructor.build_class('focused')));
 		});

 		// handle click event on selectbox items
 		this.containers['list'].on('click', 'li:not('+ this.expand_class('optgroup') +')', function(){
 			var $this = $(this);

 			if (!$this.hasClass(constructor.build_class('disabled')) && !$this.hasClass(constructor.build_class('optgroup'))) {
 				constructor.set_active($this);
 			}
 		});

 		// close the dropdown when clicking out of the selectbox container
 		$doc.on('click', function(evt){
 			if (!$(evt.target).closest(constructor.containers['container']).length && constructor.containers['dropdown'].is(':visible') && constructor.config.layout == 'dropdown') {
 				constructor.close_dropdown();
 			}
 		});
 	};

 	// the open dropdown method
 	CarbonBox.prototype.open_dropdown = function(){
 		// save the constructor reference
 		var constructor = this;

 		var transition_type = '';

 		// add opening class
 		this.containers['container'].addClass(this.build_class('opening'));

 		// set the transition type
 		switch (this.config.transition) {
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

 		this.start_keyboard_monitoring();
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
	 		switch (this.config.transition) {
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

 		this.stop_keyboard_monitoring();
 	};

 	// the set active method
 	CarbonBox.prototype.set_active = function(item){
 		if (!item.length) {
 			return;
 		}

 		var new_value = '';

 		if (!this.is_multiple) {
	 		item.data('associated-option').prop('selected', true);
	 		item.addClass(this.build_class('active'));
	 		item.siblings('li').removeClass(this.build_class('active'));
			
			new_value = item.html();
			this.current_active = item;

			this.close_dropdown();
 		}
 		else {
 			item.toggleClass(this.build_class('active'));
 			item.data('associated-option').prop('selected', item.hasClass(this.build_class('active')));

 			new_value = [];
 			this.$all_items.filter(this.expand_class('active')).each(function(){
 				new_value.push($(this).html());
 			});
 		}

 		// convert new_value to string
 		if ($.isArray(new_value)) {
 			new_value = new_value.join(', ');
 		}

 		this.containers['current'].html(new_value);

 		//TODO - how exactly set value to select 
 	};

 	// the keyboard monitoring method - start
 	CarbonBox.prototype.start_keyboard_monitoring = function(){
 		$doc.on('keydown', 'body', this, this.keydown_callback);
 	};

 	// the keyboard monitoring method - stop
 	CarbonBox.prototype.stop_keyboard_monitoring = function(){
 		$doc.off('keydown', 'body', this.keydown_callback);
 	};

 	// the keydown callback
 	CarbonBox.prototype.keydown_callback = function(event){
 		var constructor = event.data;
 		var codes = {
 			key_down: 40,
 			key_up: 38,
 			home: 36,
 			end: 35,
 			page_up: 33,
 			page_down: 34,
 			esc: 27,
 			enter: 13,
 			tab: 9
 		}

 		var key_code = event.keyCode;

 		switch (key_code) {
 			case codes['key_down']:
 				return constructor.move_to_item('down', 1);

 			case codes['key_up']:
 				return constructor.move_to_item('up', 1);

 			case codes['home']:
 				return constructor.move_to_item('up', constructor.$all_items.length);

 			case codes['end']:
 				return constructor.move_to_item('down', constructor.$all_items.length);

 			case codes['page_up']:
 			break;
 			case codes['page_down']:
 			break;

 			case codes['tab']:
 			case codes['enter']:
 				var focused = constructor.$all_items.filter(constructor.expand_class('focused'));
 				constructor.set_active(focused);
 				constructor.close_dropdown();
 			break;

 			case codes['esc']:
 				constructor.close_dropdown();
 			break;

 			default: 
 				var character = String.fromCharCode(key_code);
 				constructor.init_keyboard_search(character);
 		}
 	};

 	// the move item method
 	CarbonBox.prototype.move_to_item = function(direction, step_size){
 		var current_index,
 			focused = this.$all_items.filter(this.expand_class('focused'));

 		// determine the current index
 		if (focused.length) {
 			current_index = this.$all_items.index(focused);
 		}
 		else {
 			current_index = this.$all_items.index(this.current_active);
 		}

 		// setup the factor
 		var factor = direction == 'up' ? -1 : 1;

 		// calculate the target index
 		var target_index = current_index + step_size * factor;

 		// negative indexes aren't allowed
 		target_index = Math.max(target_index, 0);

 		// indexes bigger than items count aren't allowed 
 		target_index = Math.min(target_index, this.$all_items.length - 1);

 		// get the target item
 		var target_item = this.$all_items.eq(target_index);

 		if (target_item.hasClass(this.build_class('disabled'))) {
 			var is_last_item = target_item.is(':last');
 			var is_first_item = target_item.is(':first');
 			var active_items_selector = ':not(' + this.expand_class('disabled') + ')';

 			if (direction == 'down' && is_last_item) {
 				var last_active = this.$all_items.filter(active_items_selector + ':last');
 				this.set_focused_item(last_active);
 			}
 			else if (direction == 'up' && is_first_item) {
 				var first_active = this.$all_items.filter(active_items_selector + ':first');
 				this.set_focused_item(first_active);
 			}
 			else {
 				this.move_to_item(direction, step_size + 1);
 			}
 		} 
 		else {
 			this.set_focused_item(target_item);
 		}

 		return false;
 	};

 	// the set focused item method
 	CarbonBox.prototype.set_focused_item = function(item){
 		// save the constructor reference
 		var constructor = this;

 		if (!item.length) {
 			return;
 		}

 		var focused_class = this.build_class('focused');

 		// remove the focus from the siblings
 		var old_focused = this.$all_items.filter('.' + focused_class);
 		old_focused.removeClass(focused_class);

 		// focus the element
 		item.addClass(focused_class);

 		var item_top = item.position().top;
 		var item_pos = {
 			top: item_top,
 			bottom: item_top + item.height()
 		}

 		var dropdown_top = this.containers['dropdown'].scrollTop();
 		var pane_pos = {
 			top: dropdown_top,
 			bottom: dropdown_top + constructor.containers['dropdown'].height()
 		}

 		var item_top_in_bounds = (pane_pos.top < item_pos.top && item_pos.top < pane_pos.bottom);
 		var item_bottom_in_bounds = (pane_pos.top < item_pos.bottom && item_pos.bottom < pane_pos.bottom);

 		if (item_top_in_bounds && item_bottom_in_bounds) {
			console.log("The item is currently visible ... nothing to do. ");
		} else if (!item_top_in_bounds) {
			console.log("The top bound is no visible ... . ");
		} else if (!item_bottom_in_bounds) {
			console.log("The bottom bound is no visible ... . ");
		} else {
			console.log("This shouldn't happen, I think");
		}
 	};

 	// the search method
 	CarbonBox.prototype.init_keyboard_search = function(character){
 		// save the constructor reference
 		var constructor = this;

 		// clear timeout 
 		clearTimeout(this.search_timeout);

 		// remaining keys should initiate a keyboard search
 		this.search_phrase += character.toLowerCase();

 		for (var i = 0; i < this.$all_items.length; i++) {
 			var item = this.$all_items.eq(i);

 			if (item.is(this.expand_class('disabled'))) {
 				continue;
 			}

 			var item_text = $.trim(item.text().toLowerCase());
 			if (item_text.indexOf(this.search_phrase) == 0) {
 				this.set_focused_item(item);
 				break;
 			}
 		}

 		this.search_timeout = setTimeout(function(){
 			constructor.search_phrase = '';
 		}, this.search_delay);
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