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
;(function ($) {

	$.fn.carbonBox = function( options ) {  
		options = $.extend({
			// How fast will the animation show / hide the elements
			animation_duration: 500,

			// What will be the animation
			transition: 'slide',

			// Optional name space for all classes of the select box
			namespace: false,
			
			// callback that gets called whenever a select dropdown is shown 
			on_appear: $.noop,
			
			// callback that gets called whenever an item is chosen
			on_change: $.noop,
			
			// render item function
			render_item: null,

			// mobile detection
			is_mobile: function(){
				var ua = navigator.userAgent || navigator.vendor || window.opera;
				return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
			},
			
			// Whether to use the jScrollPane API
			use_jScrollPane: true
		}, options);
		
		// Handle initialization errors early
		var init_errors = validate_options(options);

		if (init_errors.length != 0) {
			for (var i = 0; i < init_errors.length; i++) {
				report_error(init_errors[i]);
			}
			return false;
		}

		return this.each(function () {
			var select_element = this;
			var select = $(select_element);
			var current_active_item = null;
			var select_width = parseInt($(select_element).css('width'));
			var arrow_width = parseInt($('.crb-arrow').css('width')) + 4;
			// Buffer string containg the search phrase for the select box upon opening it; 
			var keyboard_search_phrase = '';
			
			var ns = 'crb-', user_ns = options.namespace;

			// a jQuery object that contains all items from the select box
			var all_items;

			if (select_width == undefined) {
				select_width = 200;
			}

			// prevent re-initialization of the plugin
			if (select.hasClass(css_class('enabled'))) {
				return;
			}
			
			// Handle non-select items early
			if (!select.is('select')) {
				report_error("Couldn't create custom select box: " +
					"the selected element is not a select", select_element);
				return;
			}

			// Various elements used across the source code
			var containers = {
				outer_container: $('<div class="' + css_class('container') + '" style="width: ' + select_width + 'px;"></div>'),
				inner_container: $('<div class="' + css_class('inner') + '"></div>'),
				head: $('<div class="' + css_class('head') + '" style="margin-right: ' + arrow_width + 'px;"></div>'),
				active: $('<div class="' + css_class('current') + '"></div>'),
				arrow: $('<div class="' + css_class('arrow') + '"><span></span></div>'),
				dropdown_container: $('<div class="' + css_class('dropdown') + '"></div>'),
				dropdown: $('<ul class="' + css_class('list') + '"></ul>'),
				option: $('<li class="' + css_class('option') + '"></li>'),
				optgroup: $('<li class="' + css_class('optgroup') + '" />')
			}

			if(options.is_mobile()) {
				containers.outer_container.addClass(css_class('mobile'));
				$(this).wrap(containers.outer_container);
				return;
			}

			function expand_css_class(className) {
				return '.' + ns + className;
			}
			// returns string collection of css classes with appropriate prefixes  
			function css_class(className) {
				var classes = [ns + className];
				if (user_ns) {
					classes.push(user_ns + className);
				}
				return classes.join(' ');
			}
			
			// Build the HTML structure for the custom select box
			function build_custom_ui(select) {
				// Shortcuts to the container & dropdown.
				var dropdown_container = containers.dropdown_container;
				var dropdown = containers.dropdown;

				// The options in the original select box
				var select_children = select.find('option, optgroup');

				for (var i = 0; i < select_children.length; i++) {
					// The option in the original select box
					var child = $(select_children[i]);
					// The item in the custom drop down
					var item;

					// if child is option
					if (child.is('option')) {

						// The option in the original selectbox
						var child = $(select_children[i]);
						// The item in the custom dropdown
						var item = containers.option.clone();

						// if the render functions is overwritten
						if ($.isFunction(options.render_item)) {
							item = options.render_item(child);
							item.addClass(css_class('option'));
						} else {
							item = containers.option.clone();
							item.text(child.text());
						}

						// check for disabled option
						if (child.is(':disabled')) { 
							item.addClass(css_class('disabled'))
							item.attr('data-disabled', 'true');
						}

						// check for optgroup parent
						if (child.parent('optgroup').length) {
							item.addClass(css_class('optgroup-child'));
						}

						// save the option as data
						item.data('associated-option', child);
						child.data('associated-item', item);

					} else if (child.is('optgroup')) {

						item = containers.optgroup.clone();
						item.text(child.attr('label'));

					} else {
						report_errorreport_error("Couldn't render option, it's not `option` or `optgroup` tag", select_child);
					}

					// append to the dropdown container
					dropdown.append(item);

				};

				// Build the HTML structure of the new element
				if (is_multiple(select_element)) {
					containers.outer_container.addClass(css_class('multiple'));
					containers.outer_container.append(dropdown_container.append(dropdown));
				} else {
					containers.outer_container.addClass(css_class('default'));
					containers.outer_container.append(
						containers.inner_container.append(
							containers.head
							.append(containers.active)
							.append(containers.arrow)
						).append(dropdown_container.append(dropdown))
					);
				}
				all_items = containers.dropdown_container.find(expand_css_class('option'));
				return containers.outer_container;
			}
			

			// selected_item is jQuery object of the chosen item in the custom UI
			function set_active_option(selected_item) {
				if (selected_item.length == 0) {
					return;
				}

				if (!is_multiple(select_element)) {
					selected_item.data('associated-option').prop('selected', true);
					selected_item.addClass(css_class('active'));
					containers.active.text(selected_item.text());
					containers.dropdown_container.find('li').not(selected_item).removeClass(css_class('active'));
				} else {

					if (selected_item.hasClass(css_class('active'))) {
						selected_item.removeClass(css_class('active'));
						selected_item.data('associated-option').prop('selected', false);
					} else {
						selected_item.addClass(css_class('active'));
						selected_item.data('associated-option').prop('selected', true);
					}

				}
				// Update the original select
				// TODO: do we really need trigger.change? Test it across browsers. 
				select.val(selected_item.data('associated-option')).trigger('change');

				current_active_item = selected_item;
			}

			// selected_item is jQuery object of the chosen item in the custom UI
			function set_focused_item(item) {
				if (item.length == 0) {
					return;
				}
				var focused_class = css_class('focused');
				
				// Remove the focus from other items
				var old_focused = all_items.filter('.' + focused_class);
				old_focused.removeClass(focused_class);

				// Focus the element
				item.addClass(focused_class);
				
				var item_top = item.position().top;
				var item_pos = {
					top: item_top,
					bottom: item_top + item.height()
				}

				var dd_cont_top = containers.dropdown_container.scrollTop();
				var pane_pos = {
					top: dd_cont_top,
					bottom: dd_cont_top + containers.dropdown_container.height()
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
				var old_focused_item_index = all_items.index(old_focused);
				var new_focused_item_index = all_items.index(item);

				// var dd_cont = ;
				// if (item.position().top) {};
				// console.log();
			}

			// Jumps between select box options. 
			// direction - either up or down. Indicates the move direction
			// step_size - how many items should be skipped. Starting from 1 rather than 0 
			function move_to_item(direction, step_size) {
				var current_item_index;

				var focused_item = all_items.filter(expand_css_class('focused'));
				if (focused_item.length != 0) {
					current_item_index = all_items.index(focused_item);
				} else {
					current_item_index = all_items.index(current_active_item);
				}
				

				// Whether to look in the items before or after the current one
				var factor = direction == 'up' ? -1 : 1;
				
				// Determinate the index of the target item; it's not yet clear whether
				// we'll be able to go to this item, but it's a base point. 
				var target_item_index = current_item_index + step_size * factor;
				
				// Don't allow negative indexes
				target_item_index = Math.max(target_item_index, 0);
				
				// Don't allow indexes to be bigger than the items count
				target_item_index = Math.min(target_item_index, all_items.length - 1);
				
				var target_item = all_items.eq(target_item_index);
				
				if (target_item.is(expand_css_class('disabled'))) {
					var is_last_item = all_items.index(target_item) == all_items.length - 1;
					var is_first_item = all_items.index(target_item) == 0;
					var active_items_filter_selector = ":not(" + expand_css_class('disabled') + ")";

					if (direction == "down" && is_last_item) {
						var last_active_item = all_items.filter(active_items_filter_selector + ":last");
						set_focused_item(last_active_item);
					} else if (direction == "up" && is_first_item) {
						var first_active_item = all_items.filter(active_items_filter_selector + ":first");
						set_focused_item(first_active_item);
					} else {
						// TODO: do we really need recursion here? Far more effecient 
						// solution would be to loop through the items with a while
						move_to_item(direction, step_size + 1);
					}
				} else {
					// An active item is found. Mark it is as active.
					set_focused_item(target_item);
				}

				return false;
			}

			var reset_search_phrase_timeout = null,
				// the milliseconds allocated for delay between keystrokes
				// while the user is typing
				reset_search_delay = 250;
			function init_keyboard_search(character) {
				clearTimeout(reset_search_phrase_timeout);
				// remaining keys should initiate a keyboard search
				keyboard_search_phrase += character.toLowerCase();
				
				for (var i = 0; i < all_items.length; i++) {
					var item = all_items.eq(i);
					
					if (item.is(expand_css_class('disabled'))) {
						continue; 
					}

					var item_text = $.trim(item.text().toLowerCase());
					if (item_text.indexOf(keyboard_search_phrase) === 0) {
						set_focused_item(item);
						break;
					}
				}

				reset_search_phrase_timeout = setTimeout(function () {
					keyboard_search_phrase = '';
				}, reset_search_delay);

			};
			
			function keydown_callback(event) {
				var interesting_keycodes = {
					key_down: 40,
					key_up: 38,

					home: 36,
					end: 35,

					page_up: 33,
					page_down: 34,
					
					enter: 13,
					tab: 9
				}
				var key_code = event.keyCode;
				switch (key_code) {
					case interesting_keycodes.key_down: return move_to_item('down', 1);
					case interesting_keycodes.key_up: return move_to_item('up', 1);
					
					// Home and end are changing the focused item to
					// the first / last not disabled item
					case interesting_keycodes.home:
						return move_to_item('up', all_items.length);
					case interesting_keycodes.end:
						return move_to_item('down', all_items.length);
					
					case interesting_keycodes.page_up:
						break;
					case interesting_keycodes.page_down:
						break;

					case interesting_keycodes.tab:
					case interesting_keycodes.enter:
						// The focused element should be actually selected
						var currently_focused = all_items.filter(expand_css_class('focused'));
						set_active_option(currently_focused);
						close_dropdown();
						break;
					
					default:
						var character = String.fromCharCode(key_code);
						init_keyboard_search(character); 
						
				}
			}

			function start_keyboard_monitoring() {
				$(document).on('keydown', 'body', keydown_callback);
			}

			function stop_keyboard_monitoring() {
				$(document).off('keydown', 'body', keydown_callback);
			}

			function close_dropdown(skip_animation) {
				skip_animation = skip_animation || false;

				if (!is_multiple(select_element)) {
					if (skip_animation) {
						containers.dropdown_container.stop().hide();
					}

					var animation = '';

					switch(options.transition) {
						case 'slide': 
							animation = 'slideUp';
						break;
						case 'fade':
							animation = 'fadeOut';
						break;
						default: 
							animation = 'hide';
						break;
					}

					containers.outer_container.addClass(css_class('closing'))

					containers.dropdown_container
						.stop()
						[animation](options.animation_duration, function () {
							containers.outer_container
								.removeClass(css_class('closing'))
								.removeClass(css_class('opened'));
						});
					
					stop_keyboard_monitoring();
				}
			}
			
			function open_dropdown() {
				containers.outer_container
					.addClass(css_class('opening'))

				var animation = '';

				switch(options.transition) {
					case 'slide': 
						animation = 'slideDown';
					break;
					case 'fade':
						animation = 'fadeIn';
					break;
					default: 
						animation = 'show';
					break;
				}

				containers.dropdown_container
					.stop()[animation](options.animation_duration, function () {
						containers.outer_container
							.removeClass(css_class('opening'))
							.addClass(css_class('opened'));
					});

				start_keyboard_monitoring();
			}
			
			var custom_ui = build_custom_ui(select);
			
			// Replace the select box with the custom UI
			select.after(custom_ui);

			// Initialize the custom select box initial state
			if (!is_multiple(select_element)) {
				var selected = select.find('option').filter(':selected:not(disabled)').slice(0,1);
				var selected_option = selected.data('associated-item');
				set_active_option(selected_option);
			} else {
				select.find('option').filter(':selected:not(disabled)').each(function(){
					set_active_option($(this).data('associated-item'));
				});
			}

			select.addClass(css_class('enabled'));
			
			/********************/
			/*  Event handlers  */
			/********************/
			
			// Handle click on the custom options
			$('li', containers.dropdown_container).on('click', function () {
					
				if (!$(this).hasClass(css_class('disabled'))) {
					set_active_option($(this));
				}

				if(!is_multiple(select_element)) {
					close_dropdown();
				}
			});

			// Prevent text selection in the custom select box
			// containers.head.on('mousedown', function (e) {
			// 	e.preventDefault();
			// });

			// Handle click on the select box control item 
			containers.head.on('click', function () {
				if (containers.dropdown_container.is(':visible')) {
					close_dropdown();
				} else {
					open_dropdown();
				}
			});
			
			$('li', containers.dropdown_container).on('mouseenter', function () {
				$(this).addClass(css_class('focused'));
			});
			$('li', containers.dropdown_container).on('mouseleave', function () {
				$(this).removeClass(css_class('focused'));
			});

			// containers.dropdown_container.on('hover', 'li', );
			select.on('change', function () {
				// console.log("1");
			});

			// Close the select drop down when clicking out of the select box container 
			$(document).on('click', function (e) {
				if ($(e.target).closest(containers.outer_container).length == 0) {
					close_dropdown()
				}
			});

		});
	};

	// Small helpers
	function validate_options(options) {
		var errors = [];
		for (var option in options) {
			if (/container$/.test(option) && typeof options[option].jquery == 'undefined') {
				errors.push("Option " + option + " must be a jquery object");
			}
		}
		return errors;
	}

	function report_error(message, element) {
		if (typeof 'console' != "undefined") {
			console.log("carbonBox error: " + message);
			if (element) {
				console.log(element);
			}
		}
	}

	function is_multiple(select){
		return 'size' in select.attributes || 'multiple' in select.attributes;
	}

})(jQuery);