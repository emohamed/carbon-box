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

 	// global variables
 	var $win = $(window),
 		$doc = $(document);

	// the plugin defaults
	var defaults = {

		// how fast will the transition show / hide the elements
		transition_duration: 500,

		// what will be the transition
		transition: "slide",

		// layout the selectbox
		layout: "dropdown",

		// optional name space for all classes of the select box
		namespace: false,

		// callback that gets called whenever a select dropdown is shown 
		on_appear: $.noop,

		// callback that gets called whenever an item is chosen
		on_change: $.noop,

		// function which will override the default render
		render_item: null,

		// if select needs to be multiple
		is_multiple: false,

		// mobile detection
		is_mobile: function(){
			var ua = navigator.userAgent || navigator.vendor || window.opera;
			return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
		}

	}

	// ---- Helper Class ---- //
	var Helper = {};

	// validator for options object
	Helper.validate = function(options){
		var errors = [];
		for (var option in options) {
			if (/container$/.test(option) && typeof options[option].jquery == "undefined") {
				errors.push("Option " + option + " must be a jQuery object!");
			}
		}
		return errors;
	}

	// report method for errors & messages
	Helper.report = function(message, element){
		if (typeof "console" != "undefined") {
			console.log("carbonBox error: " + message);
			if (element) {
				console.log(element);
			}
		}
	}

	// css classes builder
	Helper.css_class = function(className, namespace, user_namespace){
		var classes = [namespace + className];
		if (user_namespace) {
			classes.push(user_namespace + className);
		}
		return classes.join(" ");
	}

	// css classes expander
	Helper.expand_class = function(className, namespace){
		return "." + namespace + className;
	}

	// tag builder
	Helper.tag_builder = function(tag, key, namespace, user_namespace) {
		return $("<"+ tag +"/>", { "class": Helper.css_class(key, namespace, user_namespace) });
	}

	// ---- CarbonBox Class ---- //
	var CarbonBox = function(element, options){

		// call the initialize
		this._initialize(element, options);
		this._replace_select();
		this._events();

	}

	// CarbonBox - Initialize
	CarbonBox.prototype._initialize = function(element, options){

		// save the object reference
		var that = this;

		var templates,
			uns,
			ns = "crb-",
			select,
			$select;


		// save the references
		this.select = select = element;
		this.$select = $select = $(element);
		this.config = $.extend({}, defaults, options);
		this.ns = ns;
		this.uns = uns = this.config.namespace;
		this.multiple = this.config.is_multiple;
		this.mobile = this.config.is_mobile();
		this.$childs = $select.find("option, optgroup");

		// handle initialization errors early
		var init_errors = Helper.validate(this.config);

		if (init_errors.length != 0) {
			for(var i = 0; i < init_errors.length; i++) {
				Helper.report(init_errors[i]);
			}
		}

		// handle non-select item early
		if (!$select.is("select")) {
			Helper.report("Couldn't create custom select box: the selected element is not a select", select);
			return;
		}

		// define templates
		this.templates = templates = {};

		var template_tags = ["container", "head", "current", "arrow", "icon", "dropdown", "list", "option", "optgroup"];

		// generate templates
		$.each(template_tags, function(index, value){

			var tagName = "div";
			
			switch(value) {
				case "list":
					tagName = "ul";
				break;
				case "option":
				case "optgroup":
					tagName = "li"
				break;
			}

			templates[value] = Helper.tag_builder(tagName, value, ns, uns);

		});

	}

	// CarbonBox - Build List
	CarbonBox.prototype._build_list = function(){

		// save the object reference
		var that = this;

		// variables
		var templates = this.templates,
			render = this.config.render_item,
			$list = templates["list"],
			$childs = this.$childs;

		// loop the children"s
		$childs.each(function(){

			// variables
			var $this = $(this), item;

			// if child is option
			if ($this.is("option")) {
				item = templates["option"].clone();

				// if the render function is overwritten
				if ($.isFunction(render)) {
					item = render($this);
					item.addClass(Helper.css_class("option", that.ns, that.uns));
				} else {
					item.text($this.text());
				}

				// check for disabled option
				if ($this.is(":disabled")) {
					item.addClass(Helper.css_class("disabled", that.ns, that.uns));
					item.attr("data-disabled", "true");
				}

				// check for optgroup parent
				if ($this.parent("optgroup").length) {
					item.addClass(Helper.css_class("optgroup-child", that.ns, that.uns));
				}

				// save the option & data as data
				item.data("associated-option", $this);
				$this.data("associated-item", item);

			} 

			// if child is optgroup
			else if ($this.is("optgroup")) {

				item = templates["optgroup"];
				item.text($this.attr("label"));

			}

			// report error if child is not option or optgroup
			else {
				Helper.report("Couldn't render option, it's not `option` or `optgroup` tag", select_child)
			}

			// append to the dropdown container
			$list.append(item);

		});

	}

	// CarbonBox - Build UI
	CarbonBox.prototype._replace_select = function(){

		// save the object reference
		var that = this;

		// variables
		var templates = this.templates,
			$container = templates["container"],
			$head = templates["head"],
			$dropdown = templates["dropdown"],
			$list = templates["list"],
			$arrow = templates["arrow"],
			$icon = templates["icon"],
			$current = templates["current"];

		// build the dropdown list
		if (!this.mobile) {
			this._build_list();
			$dropdown.append($list);
		}

		// append some of structure
		$arrow.append($icon);
		$head.append($current, $arrow);

		// build the html structure of the new element
		if (this.config.layout == "dropdown" && !this.mobile){
			$container.addClass(Helper.css_class("default", this.ns, this.uns));
			$container.append($head, $dropdown);
		} else if (this.config.layout == "box"){
			$container.addClass(Helper.css_class("box", this.ns, this.uns));
			$container.append($dropdown);
		} else if (this.config.layout == "dropdown" && this.is_mobile) {
			$container.addClass(Helper.css_class("mobile", this.ns, this.uns));
		}

		// replace the selectbox
		if(this.mobile) {
			this.$select.wrap($container);
			this.$select.after($head);
		} else {
			this.$select.hide().after($container);
			this.all_items = $container.find(Helper.expand_class("option", this.ns))
		}

	}

	// CarbonBox - Event Handlers
	CarbonBox.prototype._events = function(){

		// save the object reference
		var that = this;

		// variables
		var $container = this.templates["container"],
			$head = this.templates["head"],
			$dropdown = this.templates["dropdown"];

		// handle click on the custom options
		$container.on("click", "li", function(){

			if (!$(this).hasClass(Helper.css_class("disabled", that.ns, that.uns))) {
				that._set_active($(this));
			}

			if (!that.multiple && that.config.layout == "dropdown" && !$(this).hasClass(Helper.css_class("disabled", that.ns, that.uns))) {
				that._close_dropdown();
			}
			
		});

		// handle click on the selectbox head
		$head.on("click", function(){

			if ($dropdown.is(":visible")) {
				that._close_dropdown();
			} else {
				that._open_dropdown();
			}

		});

		// close the select dropdown when clicking out of the selectbox container
		$doc.on('click', function(evt){

			if (!$(evt.target).closest($container).length) {
				that._close_dropdown();
			}

		});

	}

	// CarbonBox - Open Dropdown
	CarbonBox.prototype._open_dropdown = function(){

		// save the object reference
		var that = this;

		// variables
		var $container = this.templates["container"],
			$dropdown = this.templates["dropdown"],
			animationType = "";

		// add opening class
		$container.addClass(Helper.css_class("opening", this.ns, this.uns));

		// set the animation type
		switch(this.config.transition) {
			case "slide":
				animationType = "slideDown";
			break;
			case "fade":
				animationType = "fadeIn";
			break;
			default: 
				animationType = "show";
		} 

		// show the dropdown
		$dropdown.stop()[animationType](this.config.transition_duration, function(){
			$container.removeClass(Helper.css_class("opening", that.ns, that.uns))
			$container.addClass(Helper.css_class("opened", that.ns, that.uns))
		});

		// start keyboard monitoring
		// this._start_keyboard_monitoring();

	}

	// CarbonBox - Close Dropdown
	CarbonBox.prototype._close_dropdown = function(){

		// save the object reference
		var that = this;

		// variables
		var $container = this.templates["container"],
			$dropdown = this.templates["dropdown"],
			animationType = "";

		if (this.config.layout == "dropdown") {

			// set the animation type
			switch(this.config.transition) {
				case "slide":
					animationType = "slideUp";
				break;
				case "fade":
					animationType = "fadeOut";
				break;
				default: 
					animationType = "hide";
			} 

			// add closing class
			$container.addClass(Helper.css_class("closing", this.ns, this.uns));

			// hide the dropdown
			$dropdown.stop()[animationType](this.config.transition_duration, function(){
				$container.removeClass(Helper.css_class("closing", that.ns, that.uns))
				$container.removeClass(Helper.css_class("opened", that.ns, that.uns))
			});

			// stop keyboard monitoring
			// this._stop_keyboard_monitoring();

		}

	}

	// CarbonBox - Set Active
	CarbonBox.prototype._set_active = function(item){

		// save the object reference
		var that = this;

		// variables
		var templates = this.templates,
			$container = templates['container'],
			$current = templates['current'],
			$list = templates['list'];

		// check the element
		if (!item.length) {
			return;
		}

		// if select is not multiple and is a dropdown 
		if (this.config.layout == "dropdown" && !this.multiple) {
			item.data('associated-option').prop('selected', true);
			item.addClass(Helper.css_class('active', this.ns, this.uns));
			$current.text(item.text());
			$list.find('li').not(item).removeClass(Helper.css_class('active', this.ns, this.uns));
		} else 

	}

	// extend jQuery namespace
	$.fn.carbonBox = function(options) {

		return this.each(function(){
			new CarbonBox(this, options);
		});

	}

 }(jQuery, window, document));