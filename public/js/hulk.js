$(document).ready(function() {

	$("body").append("<div id='hulk-cracks'></div>");
	$("body").append("<div id='hulk-fist'></div>");
  var smashing = false;
  var fistWidth = $("#hulk-fist").width();
  var fistHeight = $("#hulk-fist").height();
  var cracksWidth = $("#hulk-cracks").width();
  var cracksHeight = $("#hulk-cracks").height();
  // $("body").on("click", smash);

  var smash = function(e){
    console.log($(this));
    if(!smashing){
      smashing = true;
      e.preventDefault();
      var target = e.target
      var tObj = $(target);
      var _this = $(this);
      var url = _this.a
      // console.log("target");
      // console.log(target);
      $("#hulk-fist").css({ top: (-1 * fistHeight), left: (e.clientX - fistWidth / 2) })
      $("#hulk-fist").animate({
        // opacity: 0.25,
        top: "+="+(e.clientY+50),
      }, 200, "easeInExpo",function(){
        $("#hulk-cracks").show().css({ top: (_this.scrollTop() + e.clientY-cracksHeight/2), left: (e.clientX - cracksWidth / 2) })
        // .delay(5000).fadeOut(3000);
        $("body").effect('shake',
          { direction: "left", times:2 }, 200)
        // tObj.effect('shake',
        //   { direction: "left", times:2 }, 200)
        $(this).effect('shake',
          { direction: "up", times:2 }, 200)
        .delay(500)
        .fadeOut(500, 
          function() {
            if(target.href) window.location = target.href
            smashing = false;
          }
        );
      })
    }
    else{
        smashing = false;
    }
    // return false;
	}
  $("body").on("click", smash);
});