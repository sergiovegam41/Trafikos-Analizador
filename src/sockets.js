import { MONGODB_URI, MONGODB_NAME } from './config.js'
import { MongoClient, ServerApiVersion, ObjectID } from 'mongodb';
const DATABASE = MONGODB_NAME


export default (io,app)=>{

    const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    var countriesCollection = null
    var statesCollection = null
    var citiesCollection = null

    Mongoclient.connect(async err => {
      
      console.log("Mongo Conectado a: " + DATABASE);

      countriesCollection = Mongoclient.db(DATABASE).collection("countries");
      statesCollection = Mongoclient.db(DATABASE).collection("states");
      citiesCollection = Mongoclient.db(DATABASE).collection("cities");
  


        io.on('connection', async (socket)=>{

          console.log("New conecction")
          socket.emit('server:init', true)

  
          socket.on('disconnect', () => {
            console.log('Client disconnected');
            // Realizar acciones adicionales si es necesario
          });

  
        })


        app.get('/ping',  async function(req, res) {
          return res.send(true) 
        })

        app.get('/getFullLocationByIDs/:idCountri/:idState/:idCity',  async function(req, res) {

          var idCountri = req.params.idCountri;
          var idState = req.params.idState;
          var idCity = req.params.idCity;

          let countries = await countriesCollection.find({id:parseInt(idCountri)}).toArray()
          let state = await statesCollection.find({id:parseInt(idState)}).toArray()
          let cities = await citiesCollection.find({id:parseInt(idCity)}).toArray()

          
          return res.send({

            success:true,
            message: "OK",
            data: {countries,state,cities}
          })
        
        })
        app.get('/getCountries',  async function(req, res) {

          let countries = await countriesCollection.find({}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: countries
          })
        
        })


        app.get('/getStatesByCountrieID/:id',  async function(req, res) {

          var id = req.params.id;
          let departaments = await statesCollection.find({id_country:parseInt(id)}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: departaments
          })
        
        })

        app.get('/getCitiesByEtateID/:id',  async function(req, res) {

          var id = req.params.id;
          let cities = await citiesCollection.find({id_state:parseInt(id)}).toArray()

          return res.send({

            success:true,
            message: "OK",
            data: cities
          })
        
        })


       
  
        
    
    
    });



 

   

 
  
}