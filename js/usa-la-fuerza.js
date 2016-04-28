/****************
Código en Javascript para la visualización del grafo de usuarios y productores

Autor: Juan Fernando Correa
****************/


//definicion inicializacion de variables globales del la configuracion del lienzo    
var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var svg=d3.select("#grafico").append("svg")
        .attr("width",width)
        .attr("height",height);


//inicializacion de varibles globales
//escalaas d3    
var escalaradio=d3.scale.sqrt();
var escalacarga=d3.scale.sqrt();
var escalaenlaces=d3.scale.sqrt();    
var color=d3.scale.category10();    
    
    
//definicion de valriables globles para del force layout
var fuerza= null;
var nodos= [];
var enlaces= [];
var datos= null;    
var dir_archivo="data/flujosASC.csv";  
var in_carga=1; 
var in_gravedad=0.5;
var in_friccion=0.9;

//representación visual de elementos
//nodos    
var visnodos=svg.selectAll(".nodo");
var visenlaces=svg.selectAll(".enlace");    
//inicializar la fuerza
fuerza=d3.layout.force()
        .nodes(nodos)
        .links(enlaces)
        .size([width,height])
        .gravity(in_gravedad)
        .friction(in_friccion)
        .charge(in_carga)
        .on("tick", tick)
        .linkDistance(40)
        ;    
    
    

//escuchar cambios en el control de gravedad
d3.select("#gravity").on("input", function() {
  in_gravedad=this.value;
  d3.select("#textgravity").attr("value",in_gravedad);    
  actualizargravedad(in_gravedad);
});
//escuchar cambios en el control de carga
d3.select("#charge").on("input", function() {
  in_carga=this.value;
  d3.select("#textcharge").attr("value",in_carga);    
  actualizarcarga(in_carga);
});      
//escuchar cambios en el control de carga
d3.select("#friction").on("input", function() {
  in_friccion=this.value;
  d3.select("#textfriction").attr("value",in_friccion);    
  actualizarfriccion(in_friccion);
});        
cargardatos(dir_archivo);
//d3.csv(dir_archivo, function(error, data) {    
//if (error) return console.warn(error);
//    
//datos=data; 
//console.log("datos");    
//preprocesarDatos();
//console.log("datos preprocesados");    
//iniciarfuerza();
//console.log("fuerza inicada"); 
//console.log(visnodos);    
    
//});
//console.log("despues de cargar archivo");
  
    

//funciones
//inicialización del force layout  
function iniciarfuerza(){
    
console.log("iniciar la fuerza");    
fuerza.nodes(nodos)
      .links(enlaces)
      .linkStrength(0.001)
      .start();
//        fuerza.stop();   
console.log("tras iniciar: fuerza.nodes()")    
console.log(fuerza.nodes())
console.log("var global nodos");
console.log(nodos);    

//inicializacion de variables dependientes de los datos
// escalas
escalaradio.domain([1, d3.max(nodos,function(d){return d.weight;})])
            .range([3,28]); 
escalacarga.domain([1, d3.max(nodos,function(d){return d.weight;})])
            .range([-10,-400]);
escalaenlaces.domain([d3.min(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                }),d3.max(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                })])
            .range([height/8,height/2.5]);

//console.log(escalaradio(120)); 

//bindig de los enlaces    
visenlaces=visenlaces.data(enlaces)
              .enter().append("line")
              .attr("class","enlace")
                ;    
//bindig de los nodos    
visnodos=visnodos.data(nodos)
            .enter().append("circle")
            .attr("class","nodo")
//            .attr("r",0.01)
//            .attr("fill","black")
//            .transition()
            .attr("r",function(d){return escalaradio(d.weight);})
//            .attr("r",10)
            .style("fill",function(d){ return color(d.tipo);})
            .call(fuerza.drag);    
            

    
console.log("termina iniciar la fuerza");
    
}
    
//carga de los datos 
function cargardatos(url){    
d3.csv(url, function(error, data) {    
if (error) return console.warn(error);
    
datos=data; 
console.log("datos");    
preprocesarDatos();
console.log("datos preprocesados");    
iniciarfuerza();
console.log("fuerza inicada");
actualizarfcargas();    
    
});
}

function preprocesarDatos(){
// computar los distintos nodos de los datos cargados
    //para cada enlace insertamos un nodo en la lista con el nombre y tipo del productor y otro para el
    //usuario y su tipo. Liego se guarda el enlace usando el nombre del proceso y el nombre del produtor
    //en el source y el del usuario en el target
    datos.forEach(function (d) {
      nodos.push({ "nombre": d.productor, "tipo": d.tipo_productor });
      nodos.push({ "nombre": d.usuario, "tipo": d.tipo_usuario });
      enlaces.push({ "source": d.productor,
                         "target": d.usuario,
                         "info": d.ppi_ds,
                         "fuente": d.fuente});
     });
    var nodos_tmp=nodos;
    //agrupamos en un arrgelo los distintos nombres de los nodos sin repetir 
    var nombre_nodos = d3.keys(d3.nest()
       .key(function (d) { return d.nombre;})
       .map(nodos));
    //reemplazamos los valores de los nombre en source an target de los enlaces por 
    //el indice en el arrglego de nombres.
    enlaces.forEach(function (d, i) {
       enlaces[i].source = nombre_nodos.indexOf(enlaces[i].source);
       enlaces[i].target = nombre_nodos.indexOf(enlaces[i].target);
     });
    
    //A cada elemento del arreglo de nombres de los nodos se transforma en un objeto con el 
    //el nombre del nodo y un tipo indefinido. luego se completa la información del tipo con base en
    //la copia temporal de los nodos inicial.
    
    nombre_nodos.forEach(function (d, i) {
       nombre_nodos[i] = { "nombre": d , "tipo":"indefinido" };
       for (var j=0;j<nodos_tmp.length;j++){
        if(d == nodos_tmp[j].nombre)
            nombre_nodos[i].tipo=nodos_tmp[j].tipo;
       }
     }); 
    //actualizamos en la variable global
    nodos=nombre_nodos;  
    console.log("los enlaces");
    console.log(enlaces);
    
}

function tick(){
 
     
visnodos.attr("cx",function(d){return d.x})
    .attr("cy",function(d){return d.y});

    
visenlaces.attr("x1",function(d){return d.source.x;})
        .attr("y1",function(d){return d.source.y;})
        .attr("x2",function(d){return d.target.x;})
        .attr("y2",function(d){return d.target.y;});
}
//funciones actualizar valor controles  
function actualizargravedad(sgravedad){
    fuerza.gravity(sgravedad);
//    console.log(sgravedad);
    fuerza.start();
    

}
function actualizarcarga(scarga){
    fuerza.charge(function(d){ var a=scarga*escalacarga(d.weight);return a;});
    console.log(scarga);
    fuerza.start();

}  
function actualizarfriccion(sfriccion){
    fuerza.friction(sfriccion);
//    console.log(scarga);
    fuerza.start();

}
function actualizarfcargas(){

    fuerza.charge(function(d){return 2*escalacarga(escalaradio(d.weight));})
          .linkDistance(function(l,i){if(l.source.weight<l.target.weight) 
                                         return escalaenlaces(l.target.weight/l.source.weight);
                                     else
                                        return escalaenlaces(l.source.weight/l.target.weight);
                                    })
          .start();
    
}

function control_recalentar(){
fuerza.start();
}    
