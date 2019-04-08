// declaring the data variable to read in
let ELData;
// defining the svg dimensions/ margins
let SVGWidth = 700,
    SVGHeight = 600;
let margin = {top: 10, right: 10, bottom: 45, left: 10},
    width = SVGWidth - margin.left - margin.right,
    height = SVGHeight - margin.top - margin.bottom;


async function read(){
  ELData = await d3.csv('baseEnd.csv');

  ELData.forEach(entry => {
    entry.filt = true;
  })

  draw(ELData, 'SC')
}

// read the data in using async function
read();

let svg = d3.select('body').select('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

let scaleBand = d3.scaleBand()
                  .domain(d3.range(-4.0,4.5,0.5))
                  .range([0, width]);

function snapToPoint(num, factor){
  // turning the number into absolute number
  let absNum = Math.abs(num);
  // remainder and quotient after dividing from factor
  let remain = absNum % factor;
  let quotient = Math.floor(absNum / factor);
  // min and max options where number can be snapped
  let min = quotient * factor;
  let max = (quotient + 1) * factor;
  let snapped;
  // if number is positive
  // mid point of band is snapped to min
  if (num >= 0){
    snapped = (remain > (factor/2)) ? max : min;
  }
  // if number is negative
  // mid point of band is snapped to max
  else {
    snapped = (remain >= (factor/2)) ? max : min;
  }
  return num >= 0 ? snapped : -snapped;
}

// "SC",
// "GM",
// "AA",
// "RT",
// "OMC",
// "OBT",
// "SR",
// "HWB",
// "EE"

let rectHeight = 4;
let curvRect = 1 ;
let horBarDist = 2;
let rectWidth = scaleBand.step() - horBarDist;
let skill = 'Overall'
let fillRect = 'grey'

function draw(data, skill){
  svg.selectAll('*').remove();

  svg.append('g')
    .attr('class', 'dotGroup')
    .selectAll('rect.dots')
    .data(data)
    .enter()
    .append('rect')
    .attr('y', (d,i) => {
      let datbefore = data.slice(0, i).map(entry => entry[`${skill}Diff`]);
      let lenDatBefore = datbefore.filter(entry => snapToPoint(entry, 0.5) == snapToPoint(d[`${skill}Diff`], 0.5)).length;
      return height - ((lenDatBefore+1) * rectHeight);
    })
    .attr('x', d => scaleBand(snapToPoint(+d[`${skill}Diff`], 0.5)))
    .attr('height', rectHeight)
    .attr('width', rectWidth)
    .attr('rx', curvRect)
    .attr('ry', curvRect)
    //.attr('transform', `translate(${-rectWidth/2}, 0)`)
    .attr('class', d => d.UID + " studentRect")
    .style('fill', fillRect)
    //.style('stroke', d3.rgb(fillRect).darker(-0.5).darker(-0.5))
    .style('stroke', 'white')
    .style('stroke-width', '0.2px')
    .style('opacity', 0)
    .transition()
    .duration(50)
    .delay((d, i) => {
      return i * 2;
    })
    .style('opacity', d => d.filt ? 1 : .3) ;

  let gapBottom = 20;

  // svg.append('g')
  //   .attr('class', 'labels')
  //   .attr('transform', `translate(0, ${height + gapBottom})`)
  //   .selectAll('text')
  //   .data(scaleBand.domain())
  //   .enter()
  //   .append('text')
  //   .text(d => d)
  //   .attr('y', 0)
  //   .attr('x', d => scaleBand(d))
  //   .style('text-anchor', 'middle')

  let xAxis = d3.axisBottom()
      .scale(scaleBand)
      .tickValues(scaleBand.domain());

  let xAxisG = svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height + 5})`)
    .call(xAxis);

  xAxisG.append('text')
    .attr('transform', `translate(${width/2}, 40)`)
    .text('Difference Between Endline and Baseline')
    .style('text-anchor', 'middle')
    //.style('fill', 'black')
    .style('font-size', '14px')

  let filtData = data.filter(entry => entry.filt == true);
  let varOfInt = filtData.map(d => d[`${skill}Diff`]);
  let meanVar = roundToDigits(d3.mean(varOfInt), 2);
  let greaterZero = varOfInt.filter(d => d > 0).length;
  let lesserZero = varOfInt.filter(d => d > 0).length;
  let noZero = varOfInt.filter(d => d == 0).length;

  let impStatsDat = [
    {label: "Avg Growth", value: meanVar},
    {label: "Avg % Growth", value: roundToDigits((meanVar/5) * 100, 2) + '%'},
  ]

  svg.append('g')
      .classed('impStatsGrp', true)
      .attr('transform', 'translate(' + 10 + ',' + 60 + ')')
      .selectAll('text')
      .data(impStatsDat)
      .enter()
      .append('text')
      .text(d => `${d.label}: ${d.value}`)
      .attr('transform', (d, i) => 'translate(' + 0 + ',' + (i * 20) + ')')
      .style('fill', '#616161');

  console.log({
    mean: roundToDigits(meanVar, 2),
    moreZero: greaterZero,
    lessZero: lesserZero,
    noZero: noZero
  })

  d3.selectAll('rect.studentRect')
    .on('mouseover', mouseO(true, skill))
    .on('mouseout', mouseO(false, skill));

  function mouseO(over, skill){
    return function(d, i){
      let hoveredClass = d3.select(this).attr('class').replace(" studentRect", "");
      d3.selectAll(`.${hoveredClass}`)
        .style('fill', (d, i) => {
          return over ? d3.rgb(fillRect).darker().darker()
           : fillRect
        })


      let tooltipDat = [
        {label: "ID", value: "UID"},
        {label: "Name", value: "Name"},
        {label: "Age", value: "Age"},
        {label: "City", value: "City"},
        {label: "Program", value: "Program"},
        {label: "End - Base", value: `${skill}Diff`}
      ];

      if (over){
        let hoverBox = d3.select('body').append('div')
          .classed('tool', true)
          .attr('id', 'hoverBox')

        let toolWidth = document.getElementById('hoverBox')
                                .getBoundingClientRect()
                                .width;


        hoverBox.style('left', function(){
                  return `${d3.event.pageX - toolWidth/2}px`;
                })
                .style('top', function() {
                  if (d3.event.pageY > window.innerHeight/2){
                    return `${d3.event.pageY - 145}px`
                  }
                  else {
                    return `${d3.event.pageY + 10}px`
                  }

                });

        hoverBox.selectAll('div')
                .data(tooltipDat)
                .enter()
                .append('div')
                .attr('class', 'toolRow')
                .html(entry => `<span class = "Label">${entry.label}</span><span class = "Value">${d[entry.value]}</span>`);

      }
      else {
        d3.select('#hoverBox').remove();
      }
    }
  }

}

function Rearr(data, filtObj){
  // filter function
  function filtFunc(d, type){
    // individual logicals
    let cityLog =  filtObj.City == null ? true : d.City == filtObj.City ;
    let sexLog = filtObj.Sex == null ? true : d.Gender == filtObj.Sex;
    let progLog = filtObj.Program == null ? true : d.Program == filtObj.Program;
    let yoiLog = filtObj.YOI == null ? true : d["Year of Intervention"] == filtObj.YOI;
    let ageGrpLog = filtObj.ageGrp == null ? true : (filtObj.ageGrp == "6-10" ? +d["Age"] <= 10 : +d["Age"] > 10);



    // combined logical
    let logical =  cityLog & sexLog & progLog & yoiLog & ageGrpLog;
    if (type == "filt"){
      d.filt = logical ? true : false;
      return logical
    }
    else {
      return !logical
    }
  }

  let filtDat = data.filter(d => filtFunc(d, "filt"));
  let nonFiltDat = data.filter(d => filtFunc(d, "nonFilt"));


  return filtDat.concat(nonFiltDat);
}

let RearrData

d3.selectAll('.selector').on('input', function(d, i){
  let skill = getValSel('.selector.skillSelect');
  let city = getValSel('.selector.citySelect')
  city = city == "null" ? null : city;
  let sex = getValSel('.selector.sexSelect')
  sex = sex == "null" ? null : sex;
  let program = getValSel('.selector.programSelect');
  program = program == "null" ? null : program;
  let yoi = getValSel('.selector.yoiSelect');
  yoi = yoi == "null" ? null : yoi;
  let ageGrp = getValSel('.selector.ageGrpSelect');
  ageGrp = ageGrp == "null" ? null : ageGrp;


  function getValSel(selection){
    return d3.select(selection).node().value
  }

  RearrData = Rearr(ELData, {
    City: city,
    Sex: sex,
    Program: program,
    YOI: yoi,
    ageGrp: ageGrp
  })

  // RearrData = ELData;



  draw(RearrData, skill);
})

function roundToDigits(number, digit){
  return Math.round(number * (10 ** digit))/(10 ** digit)
}
