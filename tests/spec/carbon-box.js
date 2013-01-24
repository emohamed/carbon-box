describe("Carbon Box", function() {
    
    beforeEach(function() {
        var select = $('<select class="carbon"></carbon>');
        var options = ["Red", "Green", "Blue"];
        for (var i=0; i < options.length; i++) {
            var opt = options[i];
            $('<option>' + opt + '</option>', {value: opt}).appendTo(select);
        };

        select.appendTo('body');
    });

    afterEach(function () {
        $(".carbon").remove();
    });

    it("should respect namespace", function() {
        var cb = $('.carbon').carbonBox({
            namespace: 'test-namespace-'
        });
        
        expect(cb.data('ui').hasClass('test-namespace-container')).toBeTruthy();

    });

    it("should detect mobile browsers", function() {
        var cb = $('.carbon').carbonBox({
            namespace: 't-',
            is_mobile: function () {
                return true;
            }
        });

        expect(cb.parent().hasClass('t-mobile')).toBeTruthy();

    });

    it("should detect disabled options", function() {
        $('.carbon option:first').attr('disabled', true);

        var cb = $('.carbon').carbonBox({
            namespace: 't-',
        });
        var option = cb.data('ui').find('t-option:first');
        expect(option.hasClass('t-disabled')).toBeTruthy();
    });

});