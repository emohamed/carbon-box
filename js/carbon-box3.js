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

		// optional name space for all classes of the select box
		namespace: false,

		// callback that gets called whenever a select dropdown is shown 
		on_appear: $.noop,

		// callback that gets called whenever an item is chosen
		on_change: $.noop,

		// function which will override the default render
		render_item: null,

		// layout for multiple selectboxes
		multiple_layout: 'dropdown',

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

	// check for the multiple select
	Helper.is_multiple = function(element){
		return "multiple" in element.attributes;
	}

	// check for the size attribute in select
	Helper.has_size = function(element){
		return "size" in element.attributes;
	}

	// css classes builder
	Helper.css_classes = function(className, namespace, user_namespace){
		var classes = [namespace + className];
		if (user_namespace) {
			classes.push(user_namespace + className);
		}
		return classes.join(" ");
	}

	// css classes expander
	Helper.expand_css_classes = function(className, namespace){
		return "." + namespace + className;
	}

	// tag builder
	Helper.tag_builder = function(tag, key, namespace, user_namespace) {
		return $("<"+ tag +"/>", { "class": Helper.css_classes(key, namespace, user_namespace) });
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

		// variables
		var select, $select, config, templates, ns = "crb-", user_ns;

		// save the references
		this.select = select = element;
		this.config = config = $.extend(defaults, options);
		this.user_ns = user_ns = this.config.namespace;
		this.is_multiple = Helper.is_multiple(element);
		this.has_size = Helper.has_size(element);
		this.is_mobile = config.is_mobile();
		this.ns = ns;
		this.$select = $select = $(element);
		this.$childrens = $select.find("option, optgroup");

		// handle initialization errors early
		var init_errors = Helper.validate(config);

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

		var template_tags = ["container", "inner", "head", "active", "arrow", "icon", "dropdown", "list", "option", "optgroup"];

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

			templates[value] = Helper.tag_builder(tagName, value, ns, user_ns);

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
			$childrens = this.$childrens;

		// loop the children"s
		$childrens.each(function(){

			// variables
			var $this = $(this), item;

			// if child is option
			if ($this.is("option")) {
				item = templates["option"].clone();

				// if the render function is overwritten
				if ($.isFunction(render)) {
					item = render($this);
					item.addClass(Helper.css_classes("option", that.ns, that.user_ns));
				} else {
					item.text($this.text());
				}

				// check for disabled option
				if ($this.is(":disabled")) {
					item.addClass(Helper.css_classes("disabled", that.ns, that.user_ns));
					item.attr("data-disabled", "true");
				}

				// check for optgroup parent
				if ($this.parent("optgroup").length) {
					item.addClass(Helper.css_classes("optgroup-child", that.ns, that.user_ns));
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
			$inner = templates["inner"],
			$head = templates["head"],
			$dropdown = templates["dropdown"],
			$list = templates["list"],
			$arrow = templates["arrow"],
			$icon = templates["icon"],
			$active = templates["active"];

		// build the dropdown list
		if (!this.is_mobile) {
			this._build_list();
			$dropdown.append($list);
		}

		// append some of structure
		$arrow.append($icon);
		$head.append($active, $arrow);
		$inner.append($head, $arrow);

		// build the html structure of the new element
		if (!this.has_size && !this.is_mobile){
			$container.addClass(Helper.css_classes("default", this.ns, this.user_ns));
			$container.append($inner, $dropdown);
		} else if (this.has_size && !this.is_mobile || this.config.multiple_layout == "box"){
			$container.addClass(Helper.css_classes("box", this.ns, this.user_ns));
			$container.append($dropdown);
		} else if (!this.has_size && this.is_mobile) {
			$container.addClass(Helper.css_classes("mobile", this.ns, this.user_ns));
		}

		// replace the selectbox
		if(this.is_mobile) {
			this.$select.wrap($container);
			this.$select.after($inner);
		} else {
			this.$select.hide().after($container);
			this.all_items = $container.find(Helper.expand_css_classes("option", this.ns))
		}

	}

	// CarbonBox - Event Handlers
	CarbonBox.prototype._events = function(){

		// save the object reference
		var that = this;

		// variables
		var $container = this.templates["container"],
			$inner = this.templates["inner"],
			$dropdown = this.templates["dropdown"];

		// handle click on the custom options
		$container.on("click", "li", function(){

		});

		// handle click on the selectbox head
		$inner.on("click", function(){

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
		$container.addClass(Helper.css_classes("opening", this.ns, this.user_ns));

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
			$container.removeClass(Helper.css_classes("opening", that.ns, that.user_ns))
			$container.addClass(Helper.css_classes("opened", that.ns, that.user_ns))
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

		if (!this.is_multiple) {

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
			$container.addClass(Helper.css_classes("closing", this.ns, this.user_ns));

			// hide the dropdown
			$dropdown.stop()[animationType](this.config.transition_duration, function(){
				$container.removeClass(Helper.css_classes("closing", that.ns, that.user_ns))
				$container.removeClass(Helper.css_classes("opened", that.ns, that.user_ns))
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
			$container = templates['container'];

		// check the element
		if (!item.length) {
			return;
		}



	}

	// extend jQuery namespace
	$.fn.carbonBox = function(options) {

		return this.each(function(){
			new CarbonBox(this, options);
		});

	}

 }(jQuery, window, document));