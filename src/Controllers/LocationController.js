import { MONGODB_URI, MONGODB_NAME, PROYECT_NAME } from '../config.js'
import { DBNames } from './../db.js';


class LocationController{

    static async getCountries(DatabaseClient,req,res){

      let countriesCollection = DatabaseClient.collection(DBNames.countries);

      let countries = await countriesCollection.find({}).toArray()

      return res.send({

        success:true,
        message: "OK",
        data: countries

      })

    }

    static async getFullLocationByIDs(DatabaseClient,req,res){

        let countriesCollection = DatabaseClient.collection(DBNames.countries);
        let statesCollection = DatabaseClient.collection(DBNames.states);
        let citiesCollection = DatabaseClient.collection(DBNames.cities);

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
    } 

    static async getStatesByCountrieID(DatabaseClient,req,res){

        let statesCollection = DatabaseClient.collection(DBNames.states);

        var id = req.params.id;
        let departaments = await statesCollection.find({id_country:parseInt(id)}).toArray()

        return res.send({

          success:true,
          message: "OK",
          data: departaments
        })

    }

    static async getCitiesByEtateID(DatabaseClient,req,res){

        let citiesCollection = DatabaseClient.collection(DBNames.cities);

        var id = req.params.id;
        let cities = await citiesCollection.find({id_state:parseInt(id)}).toArray()
        
        return res.send({
          
          success:true,
          message: "OK",
          data: cities
        })
        
    }

}



export default LocationController 