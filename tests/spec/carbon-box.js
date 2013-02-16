describe('CarbonBox - Initialize', function(){
	beforeEach(function(){
		var select = $('<select />', { 'class': 'carbon' });
		var options = ['Red', 'Green', 'Blue'];

		for(var i = 0; i < options.length*2; i++) {
			var option = $('<option />', { 'text': options[i] });
			select.append(option);
		}

		select.appendTo('body');
	});

	afterEach(function(){
		$('.carbon').remove();
	});

	it('should save plugin API as data', function(){
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox') != undefined).toBeTruthy();
	});

	it('should extend the options', function(){
		$('.carbon').carbonBox({
			namespace: 'test-'
		});

		expect($('.carbon').data('carbonBox').uns == 'test-').toBeTruthy();
	});	

	it('should detect if select is disabled', function(){
		$('.carbon').prop('disabled', true);
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox').isDisabled).toBeTruthy();
	});

	it('should detect if select is multiple', function(){
		$('.carbon').prop('multiple', true);
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox').isMultiple).toBeTruthy();
	});

	it('should detect mobile browsers', function(){
		$('.carbon').carbonBox({
			isMobile: function(){
				return true;
			}
		});

		expect($('.carbon').data('carbonBox').isMobile).toBeTruthy();
	});
});

describe('CarbonBox - Build UI', function(){
	beforeEach(function(){
		var select = $('<select />', { 'class': 'carbon' });
		var selectHTML = [
			'<option>1</option>',
			'<option>2</option>',
			'<option>3</option>',
			'<optgroup label="Optgroup1">',
				'<option>1</option>',
				'<option>2</option>',
				'<option>3</option>',
			'</optgroup>',
			'<optgroup label="Optgroup2">',
				'<option>1</option>',
				'<option>2</option>',
				'<option>3</option>',
			'</optgroup>'
		];

		select.html(selectHTML.join('\n')).appendTo('body');
	});

	afterEach(function(){
		$('.carbon').remove();
	});

	it('should respect renderOption', function(){
		$('.carbon').carbonBox({
			renderOption: function(item){
				var $li = $('<li />', { 'class': 'test' });
				$li.text(item.text());

				return $li;
			}
		});

		expect($('.carbon').data('carbonBox').containers.list.find('li').hasClass('test')).toBeTruthy();
	});

	it('should detect disabled options', function(){
		$('.carbon option:first').prop('disabled', true);
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox').containers.list.find('li[data-disabled="true"]').length == 1).toBeTruthy();
	});

	it('should save relationship between option & item as data', function(){
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox').containers.list.find('li:first').data('associated-option') != undefined).toBeTruthy();
	});

	it('should respect renderOptgroup', function(){
		$('.carbon').carbonBox({
			renderOptgroup: function(item){
				var $li = $('<li />', { 'class': 'test' });
				$li.text(item.attr('label'));

				return $li;
			}
		});

		expect($('.carbon').data('carbonBox').containers.list.find('li').hasClass('test')).toBeTruthy();
	});
});

describe('CarbonBox - Replace Selectbox', function(){
	beforeEach(function(){
		var select = $('<select />', { 'class': 'carbon' });
		var selectHTML = [
			'<option>1</option>',
			'<option>2</option>',
			'<option>3</option>',
			'<optgroup label="Optgroup1">',
				'<option>1</option>',
				'<option>2</option>',
				'<option>3</option>',
			'</optgroup>',
			'<optgroup label="Optgroup2">',
				'<option>1</option>',
				'<option>2</option>',
				'<option>3</option>',
			'</optgroup>'
		];

		select.html(selectHTML.join('\n')).appendTo('body');
	});

	afterEach(function(){
		$('.carbon').remove();
		$('.crb-dropdown').remove();
	});

	it('should build UI if is not mobile select', function(){
		$('.carbon').carbonBox();

		expect($('.carbon').data('carbonBox').containers.list.find('li').length > 0).toBeTruthy();
	});

	it('should build UI if is mobile select and layout is box', function(){
		$('.carbon').carbonBox({
			layout: 'box',
			isMobile: function(){
				return true;
			}
		});

		expect($('.carbon').data('carbonBox').containers.list.find('li').length > 0).toBeTruthy();
	});

	it('should respect appendTo option', function(){
		$('.carbon').carbonBox({
			appendTo: 'body'
		});

		expect($('body').find('.crb-dropdown').length > 0).toBeTruthy();
	});

});