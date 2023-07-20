let tokenToken = "127.0.0.1:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36::eyJpdiI6InhQdjVkRi9BV21Vd0dyZ2pSUURTeHc9PSIsInZhbHVlIjoibTEwZ3dUQTRmcUFldFRZWEUrVC9QVDFYRi9SZTNMOW84M3Fld1BaakY5S09xN0FCTkVSWXdWQkliWWExNWZoSWFRc0VqaEJZc0NGMjE2SEpMLysxNFdjNlVhNkRVRTBDUnNDSVZqNzVBQ0FIY3hKMVVjbVN2N05IZTl2QkJHaDAiLCJtYWMiOiIzNWNkNTgyYTdjMTNkZWNlMjMwYzEyMjRjM2JkMzQ0ZDQwOTg4MDY3ZmY3M2I0NTRkNjkwYWI2NzM2ZmFmNjNiIiwidGFnIjoiIn0=";


const socket = io()

socket.emit("cliente:tryAutch",{
    token: tokenToken,
    accion: "analize"
})


socket.on('server:init',(dataG)=>{
    
    if(!dataG.success){
        alert(dataG.msj)
    }
    console.log(dataG)

    
    socket.on('server:analize:data',(data)=>{

        console.log(data)

        document.getElementById("body").innerText = JSON.stringify(data)
    
    })



    // Lista de frutas
    var frutas = dataG.initData.data;

    // Obtener el elemento select
    var select = document.getElementById("frutas");

    // Agregar opciones al select utilizando un ciclo for
    for (var i = 0; i < frutas.length; i++) {
        var option = document.createElement("option");
        option.text = frutas[i].login + " " + frutas[i].servidor;
        option.value = frutas[i].login;
        select.add(option);
    }

    select.addEventListener("change", function() {
        var seleccion = select.value;
        console.log("Seleccionaste: " + seleccion);
        socket.emit("client:analize:change_account",{ login: seleccion})

    });


})

// 