let tokenToken = "Bearer 127.0.0.1:Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0:eyJpdiI6IkxpMExTMW9UeG5mbkFwUXlNanRhQnc9PSIsInZhbHVlIjoiUHk0NWo4V0trcEtGUXpyVlVDbC9wUzVqZCtEeUhnY3NpVGpVK1FHN3R3NTVaOTlMRkxjR2RzdWV6VHBlR0FzZ3FMOXl2N0MwSjkxOTFreVZTN1MvODkxb3RtRklpb0xobDA5cHFCSE5Lc3VZWXZ1dWxPaFhSaFZqdmlyK2tPL2kiLCJtYWMiOiI2NjA5Mjc0MzkyMzYxZjhmZmEwZmYyMTg2Mjk5YTUzNWNmZTBjZTk5NTczOGM0NTEwMGYxYWY4Y2U2NjNlM2RmIiwidGFnIjoiIn0=:eyJpdiI6IkpkNU1pSnhJL0NNd29CbmJiR2lYY0E9PSIsInZhbHVlIjoiUXdhK3c3eG1jSmhrOVZmOFliVHk4Z3B6ZXMyeVl0MWdueDg0NEJNbVRZWlJVT1hDZGtCZlZNeXNlNTJLVVd5d3pqTnkvNWdvVlIxUmRQWnNxek1QaE5Gc1ZuaW1VMlN5UE1ZZExBcVAzZGEyOVZOZ25hY3duK05FeGt0U1BjZHIiLCJtYWMiOiIzMDNmOGVhMTEwOTljMjNmMDA4N2EyNDliYmU2MTRiNDRhMmIxYjE0ZGY4YTNkMjA5Y2MwMDdhNTc1YzhkY2MwIiwidGFnIjoiIn0=";


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