$(function(){
	$('#carousel').on('slide.bs.carousel', function (e) {
		var self = $(e.target).find('.carousel-mover');
		$('.carousel-mover').removeClass("active");
		console.log(self);
		self.addClass("active");
	});
	$("body").on("click", '.carousel-mover', function(){
		var self = $(this);
		var index = self.attr("data-index");
		$("#carousel").carousel(parseInt(index));
		$('.carousel-mover').removeClass("active");
		console.log(self);
		self.addClass("active");
	});
/*
$(".person-new-card").popover({
			placement:'bottom',
			html:true,
			content:'<h6>traveling to Male, Maldives from Emirates Business Lounge http://fb.me/2ora8UYgC </h6>'
		})
	$("body").on('click', '.person-card', function(){
		var data = $(this).attr('data-d');
		$('#modal-content').html(jade.render('profile'));
		$('#modal-profile').modal('show');
	})*/

	var types = {};
	$('.person-new-card').each(function(){
		var el = $(this);
		var data = el.attr('data-d');
		data = JSON.parse(decodeURIComponent(data));
		if(!data.twitter || data.twitter == ''){
			return;
		}
		var html = jade.render('profile', {profile:data});
		el.popover({
			placement:'bottom',
			html:true,
			content:html
		});		
		var t = $(this).attr('data-type');
		if(!t || t == ""){
			return;
		}
		types[t] = 1;
	});
	for(var type in types){
		$("#people-selection").append('<label class="btn btn-link"><div class="arrow-down"></div><input type="radio" name="option">'+type+'</label>')
	}
	$("body").on('click', '#people-selection label', function(){
		var type = $(this).text();
		$('.person-new-card[data-type="'+ type +'"]').show();
		$('.person-new-card[data-type!="'+ type +'"]').hide();
	})
	$('body').on('click','.person-new-card', function(){ $('.person-new-card').popover('hide'); })
	$('#people-selection:first').trigger('click');
});



