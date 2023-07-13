let tokenToken = "127.0.0.1:Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0:eyJpdiI6IndnVVQvaFNLWlRyK1dZTGZrNTRJalE9PSIsInZhbHVlIjoiSjArSWk3bFJIdzRwOFBlR3UwcDBSZVRXcmJnYjRmYkczTld4T3dBc0svTWJCZXFMVnJjdHp4QSt5U1FTWlBZZmsxQjlmMk9LbFoxSmt3NDJqUUZGKy93WnVPK3cySkxqNmIrZ0I4UDk3SXhScy9mL1VEc1Z4RlBZd1VDSW1HdlEiLCJtYWMiOiI5MWNjNGYzMzlhMTYxM2JjYmZlYTA3ZjE1ZWNiYjk5ZWQ0Y2QyOGI0YjM1MGMxMjg0OTc1N2RlOGRlMzRlMDRlIiwidGFnIjoiIn0=:eyJpdiI6Im1QM3dwUW5Gb2M1cjAwOEJHajd4RkE9PSIsInZhbHVlIjoiQy9pZmo3OFFtNkFwU2JZb0RqZlV1V0dETnZoNk9JQ1hKeFNBaVlZMDBQQm91UVArOWhxSmVJdXZzMFBBOW11VVUwK1RMQWlvcU9SVUtmbUF4dEVLdnVnUFJjNW5kZEhyczZIcEJ2Rk1GSDRUeEpYc2h5dzJZdzZFSW1wRHdyZVIiLCJtYWMiOiJmOTQyNTg3YjRiNDYyNjE2NTAwYmMwYWQ4ZTI4ODJmZmUyYWMwODllNzkzMjcyNDM0YWU0YTkxNWZhNTg2Y2QwIiwidGFnIjoiIn0=";


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