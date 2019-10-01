$(document).ready( () => {
      if($("#intro").length == 0){
        $("#game").css("visibility","hidden");
       }
    $('#board0').click(() =>{ 
         $('button.choice').removeClass('choice');
         $('#board0').toggleClass('choice');
     });

    $('#board1').click(() => {
           $('button.choice').removeClass('choice');
           $('#board1').toggleClass('choice');
    });

    $('#board2').click(() => {
            $('button.choice').removeClass('choice');
            $('#board2').toggleClass('choice');
     });

    $('#board3').click(() =>{ 
             $('button.choice').removeClass('choice');
             $('#board3').toggleClass('choice');
    });

    $('#board4').click(() => {
             $('button.choice').removeClass('choice');
             $('#board4').toggleClass('choice');
    });

    $('#board5').click(() => {
             $('button.choice').removeClass('choice');
             $('#board5').toggleClass('choice');
    });

    $('#board6').click(() =>{ 
             $('button.choice').removeClass('choice');
             $('#board6').toggleClass('choice');
      });

    $('#board7').click(() => {
             $('button.choice').removeClass('choice');
             $('#board7').toggleClass('choice');
    });

    $('#board8').click(() => {
            $('button.choice').removeClass('choice');
            $('#board8').toggleClass('choice');
    });
 
    $('#completeTurn').click(() => {
            let boardpieces = ($('table button').text()).split("");
            for(let i=0;i<boardpieces.length;i+=1){
                 if($("#board"+i).css("color") == "rgb(255, 255, 255)"){
                        boardpieces[i] = " ";
                 }
            }
            $.ajax({
                 url: "http://130.245.170.254/ttt/play",
                 type: "POST",
                 data: JSON.stringify({grid: boardpieces}),
                 contentType: "application/json",
                 success:   (data,status,jQxhr) =>{
                              let result = data;
                              const servergrid = result.grid;
                                for(let i=0;i<boardpieces.length;i+=1){
                                       if(servergrid[i]!=" "){
                                          $("#board"+i).html(servergrid[i]);
                                          $("#board"+i).css("color","black");
                                          $("#board"+i).attr("disabled", true);
                                       }
                                }
                              if(result.winner!=""){
                                   for(let i=0;i<boardpieces.length;i+=1){
                                          $("#board"+i).attr("disabled", true);
                                    }
                                   if(result.winner!=" "){
                                      $('#finished').html("Winner " + result.winner);
                                   }
                                   else{
                                      $('#finished').html("Tie");   
                                   }
                                 }
                }

            });
    });

   $('#Enter').click(()=>{
       if($("#game").length != 0){
         $("#game").css("visibility","visible");
   } });

});
