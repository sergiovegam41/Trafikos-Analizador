import app  from './app.js';
import { Server as WebSocketServer } from 'socket.io';
import http from 'http';
import { connectDB } from './db.js';
import sockets from './sockets.js';
import routes from './route.js';
import { PORT } from './config.js';
import { MONGODB_NAME } from './config.js'
import { URI_MSQL } from './config.js'
import { URI_MSQL2 } from './config.js'
import mysql from 'mysql2'

( async ()=>{

    await connectDB(function(Mongoclient){

        var SQLClient = mysql.createConnection(URI_MSQL)
        // try {
            
            var SQLClient2 = mysql.createConnection({
                // root@:3306
                host: '194.60.87.251',
                user: 'root',
                password: 'Incamega1329',
                database: 'trafikos'
              });
        // } catch (error) {
        //     console.log(error)
        // }


        var MongoClient = Mongoclient.db(MONGODB_NAME);
        console.log("mongodb connect to "+MONGODB_NAME)

        routes(app,MongoClient,SQLClient,SQLClient2)
        
        const server = http.createServer(app)
        
        const httpServer = server.listen(PORT,'0.0.0.0',()=>{
            
            console.log("Server runing in port "+PORT)
            
            const io = new WebSocketServer(httpServer, {
                cors: {
                origin:"*"
            }})

            sockets(io,MongoClient,SQLClient,SQLClient2)

        })

    })
   
})();

