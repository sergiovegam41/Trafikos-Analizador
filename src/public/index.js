let tokenToken = "Bearer 127.0.0.1:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36:eyJpdiI6IjhDTExjbWFMQnBZM2tuVS9VblpiZnc9PSIsInZhbHVlIjoieUtNWnlnOUhZNDZOZGgveXpqeEhrRHk4M3g0MDAvWFN4alBsaUJlM0toaURaWVNlaUpibWlGL1lnT1IvT1RRTEdkcnQ4dUFjSUc4b2JuTGY2dXdrWjMrV2ZCQUQyd1Z4RWpQcnJwSlA2VjFFY0NTSFY1aElOalpTcGVKRE1TWEIiLCJtYWMiOiIyMTY2ODkxNzgzNWJhNDQyMjNiYmU1YmMzZGI5MDdjNGU3NDdjZWQ3NzdkYTU1ZmJjNDg4OTdkYzgxZWQyMmM0IiwidGFnIjoiIn0=:eyJpdiI6IlgzNEJvaVhzMndQYVNBKzdmMEFVZWc9PSIsInZhbHVlIjoiVjcwaXhJNzVvVysxTHAzYWdsY3pzRHJkT24rTFc0enZWMGR3bGE0UzdjbEJGOGU4eUlBQ0pYZU5HV3grZkRsRkw5NmtLN0k1MzNXOEZsQmR0UVQzWFJYWXNFenRKRFhabFp4NDhNVUFXMnBJL2srWVhtL3lZcUlYVE1mOWpNcVIiLCJtYWMiOiJkMmE5YTAwYWNiM2VlNGZjMGE2YzI4MTcyMGI5YTA2NDc2NDY4N2UwMzg1OTgzZmJjY2U0ZGYyZTA1ZjM2MDg3IiwidGFnIjoiIn0=";


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