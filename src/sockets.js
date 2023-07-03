import { MONGODB_URI, MONGODB_NAME, PROYECT_NAME } from './config.js'

export default (io, DatabaseClient)=>{


  io.on('connection', async (socket)=>{

    console.log("New conecction")
    socket.emit('server:init', true)


    socket.on('disconnect', () => {
      console.log('Client disconnected');
      // Realizar acciones adicionales si es necesario
    });

  })

       

    




      


 
    
  
}