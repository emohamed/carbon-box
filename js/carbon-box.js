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
			animation_type: $.fn.slideToggle,

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
			var select_width = parseInt($(select_element).css('width'));
			var arrow_width = parseInt($('.crb-arrow').css('width')) + 4;
			var ns = 'crb-', user_ns = options.namespace;

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
				outer_container: $('<div class="' + css_class('cont') + '" style="width: ' + select_width + 'px;"></div>'),
				inner_container: $('<div class="' + css_class('cont-inner') + '"></div>'),
				head: $('<div class="' + css_class('top') + '" style="margin-right: ' + arrow_width + 'px;"></div>'),
				active: $('<div class="' + css_class('active-option') + '"></div>'),
				arrow: $('<div class="' + css_class('arrow') + '"><span></span></div>'),
				dropdown_container: $('<div class="' + css_class('dd-cont') + '"></div>'),
				dropdown: $('<ul class="' + css_class('dropdown') + '"></ul>'),
				option: $('<li class="' + css_class('option') + '"></li>'),
				optgroup: $('<li class="' + css_class('optgroup') + '" />'),
				mobile_wrap : $('<div class="' + css_class('mobile') + '" style="width:' + select_width + 'px;" />')
			}

			if(options.is_mobile()) {
				$(this).wrap(containers.mobile_wrap);
				return;
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

						// save the option as data
						item.data('associated-option', child);
						child.data('associated-item', item);

					} else if (child.is('optgroup')) {

						item = containers.optgroup.clone();
						item.text(child.attr('label'));

					} else {
						report_errorreport_error("Couldn't render option, it's " +  "not `option` or `optgroup` tag", select_child);
					}

					// append to the dropdown container
					dropdown.append(item);

				};

				// Build the HTML structure of the new element
				if (is_multiple(select_element)) {
					containers.outer_container.addClass(css_class('multiple'));
					containers.outer_container.append(dropdown_container.append(dropdown));
				} else {
					containers.outer_container.append(
						containers.inner_container.append(
							containers.head
							.append(containers.active)
							.append(containers.arrow)
						).append(dropdown_container.append(dropdown))
					);
				}

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

				// Trigger the change event 
				select.trigger('change');
			}
			
			function keyboard_element_change() {

			}
			function keydown_callback(event) {

				// console.log(event.keyCode + " clicked. ");
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

					containers.outer_container.addClass(css_class('closing'))

					containers.dropdown_container
						.stop()
						.slideUp(options.animation_duration, function () {
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

				containers.dropdown_container
					.stop()
					.slideDown(options.animation_duration, function () {
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
			containers.head.on('mousedown', function (e) {
				e.preventDefault();
			});

			// Handle click on the select box control item 
			containers.head.on('click', function () {
				if (containers.dropdown_container.is(':visible')) {
					close_dropdown();
				} else {
					open_dropdown();
				}
			});

			select.on('change', function () {
				console.log("1");
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