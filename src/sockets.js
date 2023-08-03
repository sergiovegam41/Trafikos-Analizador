import SessionsController from './Controllers/SessionsController.js';
import SoketAnalizador from './Controllers/SoketsControllers/SoketAnalyze.js';
import { Privileges } from '../src/models/Privileges.js';
import SoketAnalizadorBots from './Controllers/SoketsControllers/SoketAnalyzeBots.js';

export default (io, MongoClient, SQLClient, SQLClient2) => {


  io.on('connection', async (socket) => {

    console.log("New conecction")

    socket.on("cliente:tryAutch", async (data) => {

      if (await validationMiddleware(data)) {
        console.log("Next")
        start(io, socket, MongoClient, data)

      } else {
        io.emit("server:init", { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
      }

    })

    socket.on("cliente:tryFree", async (data) => {


      if (await validationMiddleware(data)) {
        console.log("Next")
        start(io, socket, MongoClient, data)

      } else {
        io.emit("server:init", { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
      }
    })

  })

  async function validationMiddleware(data) {

    let session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })


    if (session) {

      return true
    }

    return false

  }

  async function start(io, clientSocket, MongoClient, data) {

    let session = null;
    try {
      session = await SessionsController.getCurrentSession(MongoClient, { headers: { authorization: data.token } })
    } catch (error) {

    }


    if (data.accion.toString() == SoketAnalizador.analize) {
      console.log(1)

      if (session.privilegeId.toString() == Privileges.participante || session.privilegeId.toString() == Privileges.superAdmin) {
        SoketAnalizador.run(io, clientSocket, MongoClient, SQLClient, data)
      } else {
        io.emit("server:init", { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
      }

    } else if (data.accion.toString() == SoketAnalizadorBots.analize) {
      //Implement other uses here
      console.log(2)

      if (session.privilegeId.toString() == Privileges.participante || session.privilegeId.toString() == Privileges.superAdmin) {
        SoketAnalizadorBots.run(io, clientSocket, MongoClient, SQLClient2, data)
      } else {
        io.emit("server:init", { success: false, code: "unauthorized", msj: "No estas autorizado para realizar esta accion." })
      }

    }

  }





}