

  // beeswarm plugin: https://github.com/Kcnarf/d3-beeswarm
  d3.csv("./src/pingpong.csv", function(row){
        return row
      }).then(function(data){


        table = d3.select('#bee').style('background-color', 'rgb(32 32 82)').style('border', '3px solid white')
        width = table.attr('width')
        height = table.attr('height')
        xScale_Tab = d3.scaleLinear().domain([-21, 21]).range([0, width])

        table.append("line")
        .attr("x1", width/2)
        .attr("y1", 0)
        .attr("x2", width/2)
        .attr("y2", height)
        .style("stroke-width", 2)
        .style("stroke", "white")
        .attr("stroke-dasharray", "5")

        table.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", height/2)
        .attr("y2", height/2)
        .style("stroke-width", 2)
        .style("stroke", "white")

        benWins = data.filter(function(d){ return d.winner == 'Ben'}).length
        table.append("text")
        .attr("x", width-5)
        .attr("y", height-5)
        .text('Ben: ' + benWins)
        .style("fill", "white")
        .style('font-size', '18px')
        .style('text-anchor', 'end')


        table.append("text")
        .attr("x", 5)
        .attr("y", height-5)
        .text('Dad: ' + (data.length-benWins))
        .style("fill", "white")
        .style('font-size', '18px')
        .style('text-anchor', 'start')

        table.append("g")
          .call(d3.axisBottom().scale(xScale_Tab)
          .tickValues([-20, -15, -10, -5, 5, 10, 15, 20])
          .tickFormat(function(n){return Math.abs(n)}))
          .style('color', 'white')
          .attr('transform', 'translate(0,0)')


        radius = 9

        var swarm = d3.beeswarm()
          .data(data)
          .distributeOn(function(d) {
            return xScale_Tab(d.spread); // evaluated once on each element of data
          })
          .radius(radius)
          .orientation('horizontal')
          .side('symetric')
          .arrange();


        table.selectAll('.game')
        .data(swarm, function(d, i){ return i})
        .enter().append('circle')
        .attr('class', 'game')
        .attr('cx', function(d){ return d.x})
        .attr('cy', function(d){ return height/2-d.y})
        .attr('id', function(d, i){return `game${i}`})
        .attr('r', String(radius))
        .attr('fill', 'rgb(230,230,230)')
        .attr('stroke', function(d){ return d.datum.winner == 'Dad' ? 'red' : 'blue'})
        .attr('stroke-width', '1')
        .on('mouseenter', function(d, i){
          $('#toolTip').css('left', d3.event.pageX-40).css('top', d3.event.pageY-70).css('border',  `1px solid ${d.datum.winner == 'Dad' ? 'red' : 'blue'}`)
          d3.select('#toolTip').html(`Game ${i+1}  <br> ${d3.max([parseInt(d.datum.score_ben), parseInt(d.datum.score_dad)])} - ${d3.min([parseInt(d.datum.score_ben), parseInt(d.datum.score_dad)])}  ${d.datum.winner}`)
          d3.select('#toolTip').style('visibility','visible')

          d3.select(`#spread${i}`).attr('r', 5)
        })
        .on('mouseout', function(d, i){
          d3.select('#toolTip').style('visibility','hidden')

          d3.select(`#spread${i}`).attr('r', 3)

        })

        spread = d3.select('#spread').style('background-color', 'white').style('border', '3px solid rgb(32 32 82)')
        margin = {top: 10, right: 20, bottom: 10, left: 50},
        width = spread.attr('width') - margin.left - margin.right,
        height = spread.attr('height') - margin.top - margin.bottom

        meanSpread = d3.mean(data.map(function(d){ return d.spread}))
        xScale_SP = d3.scaleLinear().domain([0, data.length]).range([0, width])
        yScale_SP = d3.scaleLinear().domain([-1*(data.length*meanSpread)-100, (data.length*meanSpread)+100]).range([height, 0])

        plot = spread.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        rollSpread = []
        totSpread = 0
        streak = 0
        prevWinner = data[0].winner
        for([i, game] of data.entries()){
         // mult = game.winner == 'Dad' ? -1 : 1
         totSpread = totSpread + parseInt(game.spread)
         winner = game.winner
         if(winner == prevWinner){
           streak = streak + 1
           rollSpread.push({game: i, tot: totSpread, streak: 0, data: game})
         }else{
           if(streak >= 8){
             rollSpread.push({game: i, tot: totSpread, streak: streak, data: game})
           }else{
             rollSpread.push({game: i, tot: totSpread, streak: 0, data: game})
           }
           streak = 0
         }
        }


        plot.append("g")
        .attr("transform", "translate(0," + height/2 + ")")
        .call(d3.axisBottom(xScale_SP))

        plot.append("g")
        .call(d3.axisLeft(yScale_SP).tickFormat(function(n){return Math.abs(n)}))

        spread.selectAll('.domain').attr('stroke', 'rgb(32, 32, 82)')


        plot.append("linearGradient")
          .attr("id", "line-gradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", d3.max(yScale_SP.range()))
          .selectAll("stop")
            .data([
              {offset: "0%", color: "blue"},
              {offset: "50%", color: "gray"},
              {offset: "100%", color: "red"}
            ])
          .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; })

        plot.append("path")
          .datum(rollSpread)
          .attr("stroke", "url(#line-gradient)")
          .attr("fill", "none")
          .attr("stroke-width", 3)
          .attr("d", d3.line()
            .x(function(d) { return xScale_SP(d.game) })
            .y(function(d) { return yScale_SP(d.tot) })
            )

      streaks = rollSpread.filter(function(d){ return d.streak > 0})

      for(streak of streaks){
        console.log(streak)
        plot.append("line")
        .attr("x1", function(d){return xScale_SP(streak.game)})
        .attr("y1", function(d){return yScale_SP(streak.tot-80)})
        .attr("x2", function(d){return xScale_SP(streak.game)})
        .attr("y2", function(d){return yScale_SP(streak.tot+80)})
        .style("stroke-width", 2)
        .style("stroke", "rgb(32, 32, 82)")
        .attr("stroke-dasharray", "5")
      }




        plot.selectAll('.gamePts').data(rollSpread)
        .enter().append('circle')
          .attr('class', 'gamePts')
          .attr("fill", function(d){ return d.data.winner == 'Dad' ? 'red': 'blue'})
          .attr("stroke", "black")
          .attr('id', function(d){return `spread${d.game}`})
          .attr("stroke-width", '1px')
          .attr('r', '3')
          .attr('cx', function(d){return xScale_SP(d.game)})
          .attr('cy', function(d){return yScale_SP(d.tot)})
          .on('mouseenter', function(d, i){
            d3.select(this).attr('r', '5')
            $('#toolTip').css('left', d3.event.pageX-40).css('top', d3.event.pageY-80).css('border',  `1px solid ${d.data.winner == 'Dad' ? 'red' : 'blue'}`)
            d3.select('#toolTip').html(`Game ${i+1}  <br> ${d3.max([parseInt(d.data.score_ben), parseInt(d.data.score_dad)])} - ${d3.min([parseInt(d.data.score_ben), parseInt(d.data.score_dad)])}  ${d.data.winner}
            <br> Spread: ${d.tot}`)
            d3.select('#toolTip').style('visibility','visible')

            d3.select(`#game${i}`).attr('fill', 'yellow')

          })
          .on('mouseout', function(d, i){
            d3.select('#toolTip').style('visibility','hidden')
            d3.select(this).attr('r', '3')

            d3.select(`#game${i}`).attr('fill', 'rgb(230, 230, 230)')

          })

          plot.append('text')
          .attr('x', 10)
          .attr('y', 15)
          .attr('text-anchor', 'start')
          .text(`${data.length} Games:`)
          .style('font-size', '20px')

          plot.append('text')
          // .attr('x', 177)
          .attr('x', 110)
          .attr('y', 15)
          .attr('text-anchor', 'start')
          .text(`${totSpread > 0 ? 'Ben' : 'Dad'} +${totSpread}`)
          .style('font-size', '20px')
          .style('fill', totSpread > 0 ? 'blue' : 'red')

          plot.append('text')
          .attr('x', 10)
          .attr('y', height-5)
          .attr('text-anchor', 'start')
          .text(`Hide Points`)
          .style('font-size', '15px')
          .style('cursor', 'pointer')
          .on('mouseenter', function(d){
            d3.select(this).style('text-decoration', 'underline')
          }).on('mouseout', function(d){
            d3.select(this).style('text-decoration', 'none')
          }).on('click', function(d){
            $('.gamePts').toggle('fast')
            if(d3.select(this).text() == 'Show Points'){
              d3.select(this).text('Hide Points')
            }else{
              d3.select(this).text('Show Points')
            }
          })

          d3.select('#shut').text('Shutouts: ' + String(data.filter(function(d){ return d.score_ben == 0 || d.score_dad == 0}).length))
          d3.select('#ot').text('Overtime Games: ' + String(data.filter(function(d){ return d.score_ben > 21 || d.score_dad > 21}).length))
          d3.select('#cur').text('Current Champ: ' + String(data[data.length-1].winner))






      })
