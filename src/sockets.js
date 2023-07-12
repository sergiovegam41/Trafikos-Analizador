import SessionsController from './Controllers/SessionsController.js';
import SoketAnalizador from './Controllers/SoketsControllers/SoketAnalyze.js';
import { Privileges } from '../src/models/Privileges.js';

export default (io, MongoClient,SQLClient)=>{


  io.on('connection', async (socket)=>{

    console.log("New conecction")

    socket.on("cliente:tryAutch", async (data)=>{

      if(await validationMiddleware(data)){
        console.log("Next")
        start(io,socket, MongoClient, data)

      }else{
        io.emit("server:init", {success: false, code:"unauthorized",msj:"No estas autorizado para realizar esta accion."})
      }

    })

    // socket.on('disconnect', () => {
    //   console.log('Client disconnected');
    //   // Realizar acciones adicionales si es necesario

    // });

  })

  async function validationMiddleware(data)  {

    let session = await SessionsController.getCurrentSession(MongoClient,{headers:{authorization: data.token}})
      

    if(session){  

      return true      
    }

    return false
  
  }

  async function start(io, clientSocket, MongoClient, data)  {


    let session = await SessionsController.getCurrentSession(MongoClient,{headers:{authorization: data.token}})

    
    if(data.accion.toString() == SoketAnalizador.analize ){

      if(session.privilegeId.toString() == Privileges.participante || session.privilegeId.toString() == Privileges.superAdmin ){
        SoketAnalizador.run(io,clientSocket, MongoClient, SQLClient, data)
      }else{
        io.emit("server:init", {success: false, code:"unauthorized",msj:"No estas autorizado para realizar esta accion."})
      }
      
    }else if ( data.accion.toString() == ""){
      //Implement other uses here


    }

  }

  

       
  
}