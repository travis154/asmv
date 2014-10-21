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
// $(".person-card").popover({
// 			placement:'top',
// 			html:true,
// 			content:'<h6>traveling to Male, Maldives from Emirates Business Lounge http://fb.me/2ora8UYgC </h6>'
// 		})
	$("body").on('click', '.person-card', function(){
		var data = $(this).attr('data-d');
		$('#modal-content').html(jade.render('profile'));
		$('#modal-profile').modal('show');
	})
});
