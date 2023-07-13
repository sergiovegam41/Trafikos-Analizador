let tokenToken = "127.0.0.1:Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0:eyJpdiI6ImxpamVFcUNrb1hkS1FxekJhM1BkckE9PSIsInZhbHVlIjoiYWlQMTNHdlg0NTdYVjRYazJUTjJkZ2IvL3N2cEpQUXk1YXplenJadGJQb1ZJaXg3bEQxY1d3N2loYnJrKzZXbm9nQkFvMGM2M3hmYjV6QnNzQ2xkK0pHZFJLdVBwOFFPUndIbm1lN1ErbGVkRXRJcTVzVU9vM1k5OHZSZTAvK3oiLCJtYWMiOiI0YmNlYzY4YzFkY2M3NTAyNDJkMjkxMjcwYWY1YmJjY2JjYTQ3OTZkZDBmZDlhNWVjNTJiODZhZjUwZmM4NzkwIiwidGFnIjoiIn0=:eyJpdiI6IlNOWGNaRG1aczVnRnlYdEdPRE9Remc9PSIsInZhbHVlIjoibXZmUW01aDB3QStob3UrWFA2TWxCQy9nZXlDc0dlZ2M1ZUFIaEM2MjdRaUdkVkJQTExFWGduRHBQV3kyWTVHSUZsWHFUODFyb1NXeC9qZ1ArVVU0SFpkaHloVW1qTmt6WVozSURIZ3JEdFBMakw4OFBKamJCUnFGUTluK3pWY28iLCJtYWMiOiIyMjllMDYzMmUxMGNiOGJiNGM1Njc1YmEyNDNiMjFmN2YxYTExNjk1ZjcwZTkwZDc1NzhiYTA1NjBhYmU0YjliIiwidGFnIjoiIn0=";


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